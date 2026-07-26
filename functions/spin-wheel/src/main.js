import { Client, Databases, Query, ID } from "node-appwrite";

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || "topmark_main";
const COLLECTIONS = {
  CLIENT_LOYALTY: "client_loyalty",
  LOYALTY_TRANSACTIONS: "loyalty_transactions",
  WHEEL_PRIZES: "wheel_prizes",
  WHEEL_SPINS: "wheel_spins",
};

const MAX_ATTEMPTS = 2;

// Dupliqué depuis src/lib/tombola.js (RANGES) : cette Function est déployée
// séparément du bundle front-end et ne peut pas partager le module. Garder
// synchronisé si les paliers changent.
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

function getPayload(req) {
  if (req.bodyJson) return req.bodyJson;
  if (req.body && typeof req.body === "object") return req.body;
  const raw = typeof req.body === "string" ? req.body : req.bodyRaw;
  if (typeof raw === "string" && raw.length > 0) {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return {};
}

async function getLoyalty(databases, clientUserId) {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.CLIENT_LOYALTY, [
    Query.equal("clientId", clientUserId),
    Query.limit(1),
  ]);
  return res.documents[0] || null;
}

async function getPendingSpin(databases, clientUserId) {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.WHEEL_SPINS, [
    Query.equal("clientId", clientUserId),
    Query.equal("confirmed", false),
    Query.limit(1),
  ]);
  return res.documents[0] || null;
}

async function handleStart({ databases, clientUserId, res }) {
  const existing = await getPendingSpin(databases, clientUserId);
  if (existing) {
    const prize = await databases.getDocument(DATABASE_ID, COLLECTIONS.WHEEL_PRIZES, existing.prizeId).catch(() => null);
    return res.json({ ok: true, spin: existing, prize });
  }

  const loyalty = await getLoyalty(databases, clientUserId);
  if (!loyalty) return res.json({ ok: false, error: "Client introuvable." }, 404);

  const range = findAvailableRange(loyalty.loyaltyPoints || 0);
  if (!range) return res.json({ ok: false, error: "Aucun palier débloqué." }, 400);

  const prizesRes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.WHEEL_PRIZES, [
    Query.equal("rangeMin", range.min),
    Query.equal("active", true),
    Query.limit(50),
  ]);
  if (prizesRes.documents.length === 0) {
    return res.json({ ok: false, error: "Aucun lot configuré pour ce palier." }, 400);
  }

  const prize = drawPrize(prizesRes.documents);
  const spin = await databases.createDocument(DATABASE_ID, COLLECTIONS.WHEEL_SPINS, ID.unique(), {
    clientId: clientUserId,
    prizeId: prize.$id,
    thresholdPoints: range.min,
    spunAt: new Date().toISOString(),
    delivered: false,
    confirmed: false,
    attemptNumber: 1,
  });

  return res.json({ ok: true, spin, prize });
}

async function handleRetry({ databases, clientUserId, spinId, res }) {
  const spin = await databases.getDocument(DATABASE_ID, COLLECTIONS.WHEEL_SPINS, spinId).catch(() => null);
  if (!spin || spin.clientId !== clientUserId || spin.confirmed) {
    return res.json({ ok: false, error: "Tirage introuvable ou déjà confirmé." }, 400);
  }
  if ((spin.attemptNumber || 1) >= MAX_ATTEMPTS) {
    return res.json({ ok: false, error: "Nombre d'essais dépassé." }, 400);
  }

  const prizesRes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.WHEEL_PRIZES, [
    Query.equal("rangeMin", spin.thresholdPoints),
    Query.equal("active", true),
    Query.limit(50),
  ]);
  if (prizesRes.documents.length === 0) {
    return res.json({ ok: false, error: "Aucun lot configuré pour ce palier." }, 400);
  }

  const prize = drawPrize(prizesRes.documents);
  const updated = await databases.updateDocument(DATABASE_ID, COLLECTIONS.WHEEL_SPINS, spin.$id, {
    prizeId: prize.$id,
    spunAt: new Date().toISOString(),
    attemptNumber: (spin.attemptNumber || 1) + 1,
  });

  return res.json({ ok: true, spin: updated, prize });
}

async function handleConfirm({ databases, clientUserId, spinId, res }) {
  const spin = await databases.getDocument(DATABASE_ID, COLLECTIONS.WHEEL_SPINS, spinId).catch(() => null);
  if (!spin || spin.clientId !== clientUserId || spin.confirmed) {
    return res.json({ ok: false, error: "Tirage introuvable ou déjà confirmé." }, 400);
  }

  await databases.updateDocument(DATABASE_ID, COLLECTIONS.WHEEL_SPINS, spin.$id, { confirmed: true });

  const loyalty = await getLoyalty(databases, clientUserId);
  const consumed = loyalty?.loyaltyPoints || 0;

  if (loyalty) {
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.CLIENT_LOYALTY, loyalty.$id, {
      loyaltyPoints: 0,
    });
  }

  if (consumed > 0) {
    await databases.createDocument(DATABASE_ID, COLLECTIONS.LOYALTY_TRANSACTIONS, ID.unique(), {
      clientId: clientUserId,
      type: "roue",
      points: -consumed,
      reason: `Tirage tombola confirmé (palier ${spin.thresholdPoints} kg)`,
    });
  }

  return res.json({ ok: true, newBalance: 0 });
}

// Logique serveur complète de la roue de la fortune : tirage pondéré,
// vérification d'éligibilité et remise à zéro du solde. Exécutable par tout
// client authentifié (Execute Access = Role.users()), mais chaque appel ne
// peut agir que sur son propre solde/tirage (voir la vérification
// clientUserId === callerId ci-dessous) — un client ne peut ni forcer le lot
// gagnant ni agir au nom d'un autre client.
export default async ({ req, res, log, error }) => {
  const callerId = req.headers["x-appwrite-user-id"];
  if (!callerId) {
    return res.json({ ok: false, error: "Authentification requise." }, 401);
  }

  const payload = getPayload(req);
  const { action, clientUserId } = payload;

  if (!clientUserId || clientUserId !== callerId) {
    return res.json({ ok: false, error: "Action non autorisée." }, 403);
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);
  const databases = new Databases(client);

  try {
    if (action === "start") return await handleStart({ databases, clientUserId, res });
    if (action === "retry") return await handleRetry({ databases, clientUserId, spinId: payload.spinId, res });
    if (action === "confirm") return await handleConfirm({ databases, clientUserId, spinId: payload.spinId, res });
    return res.json({ ok: false, error: "Action inconnue." }, 400);
  } catch (err) {
    error(err.message || String(err));
    return res.json({ ok: false, error: "Erreur serveur." }, 500);
  }
};
