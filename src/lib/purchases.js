import { ID, Query } from "appwrite";
import { databases, DATABASE_ID, COLLECTIONS } from "./appwrite";

export async function listClients(search = "") {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.CLIENTS, [
    Query.limit(100),
    Query.orderDesc("$createdAt"),
  ]);
  if (!search) return res.documents;
  const term = search.toLowerCase();
  return res.documents.filter(
    (c) =>
      (c.companyName || "").toLowerCase().includes(term) ||
      (c.fullName || "").toLowerCase().includes(term)
  );
}

// Règle : 1 kg acheté = 1 point
export async function recordPurchase({ client, kg }) {
  const points = Math.round(Number(kg));
  if (!points || points <= 0) throw new Error("Quantité invalide.");

  await databases.createDocument(DATABASE_ID, COLLECTIONS.LOYALTY_TRANSACTIONS, ID.unique(), {
    clientId: client.userId,
    type: "gain",
    points,
    reason: `Achat ${kg} kg`,
  });

  const newBalance = (client.loyaltyPoints || 0) + points;
  await databases.updateDocument(DATABASE_ID, COLLECTIONS.CLIENTS, client.$id, {
    loyaltyPoints: newBalance,
  });

  return newBalance;
}
