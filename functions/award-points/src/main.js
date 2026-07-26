import { Client, Databases, Query, ID } from "node-appwrite";

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || "topmark_main";
const COLLECTIONS = {
  CLIENT_LOYALTY: "client_loyalty",
  LOYALTY_TRANSACTIONS: "loyalty_transactions",
};

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

// Crédite des points de fidélité après un achat.
// Seule l'équipe "support-agents" peut exécuter cette Function (configuré
// dans Appwrite Console > Functions > award-points > Settings > Execute
// Access) — c'est ce qui empêche un client normal de se créditer des points,
// quel que soit le code du front-end.
export default async ({ req, res, log, error }) => {
  const callerId = req.headers["x-appwrite-user-id"];
  if (!callerId) {
    return res.json({ ok: false, error: "Authentification requise." }, 401);
  }

  const { clientUserId, kg } = getPayload(req);
  const points = Math.round(Number(kg));
  if (!clientUserId || !Number.isFinite(points) || points <= 0) {
    return res.json({ ok: false, error: "Paramètres invalides." }, 400);
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);
  const databases = new Databases(client);

  try {
    const loyaltyRes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.CLIENT_LOYALTY, [
      Query.equal("clientId", clientUserId),
      Query.limit(1),
    ]);
    const loyaltyDoc = loyaltyRes.documents[0];
    if (!loyaltyDoc) {
      return res.json({ ok: false, error: "Client introuvable." }, 404);
    }

    const oldBalance = loyaltyDoc.loyaltyPoints || 0;
    const newBalance = oldBalance + points;

    await databases.createDocument(DATABASE_ID, COLLECTIONS.LOYALTY_TRANSACTIONS, ID.unique(), {
      clientId: clientUserId,
      type: "gain",
      points,
      reason: `Achat ${points} kg`,
    });

    await databases.updateDocument(DATABASE_ID, COLLECTIONS.CLIENT_LOYALTY, loyaltyDoc.$id, {
      loyaltyPoints: newBalance,
    });

    log(`+${points} pts pour ${clientUserId} (déclenché par ${callerId}) -> ${newBalance}`);

    return res.json({ ok: true, oldBalance, newBalance });
  } catch (err) {
    error(err.message || String(err));
    return res.json({ ok: false, error: "Erreur serveur." }, 500);
  }
};
