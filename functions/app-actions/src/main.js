import { Client, Databases, Query, ID } from "node-appwrite";

// Dupliqué depuis src/lib/tombola.js — à garder synchronisé si les paliers changent un jour
const RANGES = [
  { min: 6, max: 11 },
  { min: 12, max: 17 },
  { min: 18, max: 29 },
  { min: 30, max: 49 },
  { min: 50, max: 75 },
  { min: 75, max: 99 },
  { min: 100, max: 149 },
  { min: 150, max: 199 },
  { min: 200, max: 299 },
  { min: 300, max: 399 },
  { min: 400, max: 499 },
  { min: 500, max: 749 },
  { min: 750, max: 1000 },
];
const MAX_ATTEMPTS = 2;

const COLLECTIONS = {
  CLIENTS: "clients",
  WHEEL_PRIZES: "wheel_prizes",
  WHEEL_SPINS: "wheel_spins",
  LOYALTY_TRANSACTIONS: "loyalty_transactions",
};

function findAvailableRange(points) {
  const unlocked = RANGES.filter((r) => points >= r.min);
  return unlocked.length > 0 ? unlocked[unlocked.length - 1] : null;
}

function drawPrize(prizes) {
  const weights = prizes.map((p) => Math.max(Number(p.probability) || 0, 0.0001));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < prizes.length; i++) {
    r -= weights[i];
    if (r <= 0) return prizes[i];
  }
  return prizes[prizes.length - 1];
}

export default async ({ req, res, log, error }) => {
  const databaseId = process.env.APPWRITE_DATABASE_ID;
  const userId = req.headers["x-appwrite-user-id"];

  if (!userId) {
    return res.json({ error: "Non authentifié." }, 401);
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);
  const databases = new Databases(client);

  let body = {};
  try {
    body = req.bodyJson || JSON.parse(req.body || "{}");
  } catch {
    body = {};
  }
  const action = body.action;

  try {
    // Profil client
    const clientDocs = await databases.listDocuments(databaseId, COLLECTIONS.CLIENTS, [
      Query.equal("userId", userId),
      Query.limit(1),
    ]);
    if (clientDocs.total === 0) {
      return res.json({ error: "Profil client introuvable." }, 404);
    }
    const clientDoc = clientDocs.documents[0];

    // Tirage en attente existant ?
    const pendingDocs = await databases.listDocuments(databaseId, COLLECTIONS.WHEEL_SPINS, [
      Query.equal("clientId", userId),
      Query.equal("confirmed", false),
      Query.limit(1),
    ]);
    const pending = pendingDocs.total > 0 ? pendingDocs.documents[0] : null;

    if (action === "start") {
      if (pending) {
        // Un tirage est déjà en cours — on le renvoie tel quel plutôt que d'en créer un second
        return res.json({ spin: pending });
      }

      const range = findAvailableRange(clientDoc.loyaltyPoints || 0);
      if (!range) {
        return res.json({ error: "Aucun palier débloqué." }, 400);
      }

      const prizesRes = await databases.listDocuments(databaseId, COLLECTIONS.WHEEL_PRIZES, [
        Query.equal("rangeMin", range.min),
        Query.equal("active", true),
        Query.limit(50),
      ]);
      if (prizesRes.total === 0) {
        return res.json({ error: "Aucun lot configuré pour ce palier." }, 400);
      }

      const winner = drawPrize(prizesRes.documents);

      const spin = await databases.createDocument(databaseId, COLLECTIONS.WHEEL_SPINS, ID.unique(), {
        clientId: userId,
        prizeId: winner.$id,
        thresholdPoints: range.min,
        spunAt: new Date().toISOString(),
        delivered: false,
        confirmed: false,
        attemptNumber: 1,
      });

      return res.json({ spin });
    }

    if (action === "retry") {
      if (!pending) {
        return res.json({ error: "Aucun tirage en attente." }, 400);
      }
      if ((pending.attemptNumber || 1) >= MAX_ATTEMPTS) {
        return res.json({ error: "Plus d'essai disponible." }, 400);
      }

      const prizesRes = await databases.listDocuments(databaseId, COLLECTIONS.WHEEL_PRIZES, [
        Query.equal("rangeMin", pending.thresholdPoints),
        Query.equal("active", true),
        Query.limit(50),
      ]);
      if (prizesRes.total === 0) {
        return res.json({ error: "Aucun lot configuré pour ce palier." }, 400);
      }

      const winner = drawPrize(prizesRes.documents);

      const updated = await databases.updateDocument(databaseId, COLLECTIONS.WHEEL_SPINS, pending.$id, {
        prizeId: winner.$id,
        spunAt: new Date().toISOString(),
        attemptNumber: (pending.attemptNumber || 1) + 1,
      });

      return res.json({ spin: updated });
    }

    if (action === "confirm") {
      if (!pending) {
        return res.json({ error: "Aucun tirage en attente." }, 400);
      }

      const consumed = clientDoc.loyaltyPoints || 0;

      await databases.updateDocument(databaseId, COLLECTIONS.CLIENTS, clientDoc.$id, {
        loyaltyPoints: 0,
      });

      await databases.updateDocument(databaseId, COLLECTIONS.WHEEL_SPINS, pending.$id, {
        confirmed: true,
      });

      if (consumed > 0) {
        await databases.createDocument(databaseId, COLLECTIONS.LOYALTY_TRANSACTIONS, ID.unique(), {
          clientId: userId,
          type: "roue",
          points: -consumed,
          reason: `Tirage tombola confirmé (palier ${pending.thresholdPoints} kg)`,
        });
      }

      return res.json({ newBalance: 0 });
    }

    return res.json({ error: "Action inconnue." }, 400);
  } catch (err) {
    error(err.message);
    return res.json({ error: err.message || "Erreur serveur." }, 500);
  }
};
