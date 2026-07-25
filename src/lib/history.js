import { Query } from "appwrite";
import { databases, DATABASE_ID, COLLECTIONS } from "./appwrite";

export const EQUIPMENT_LABELS = {
  presse_cafe: "Presse à café",
  moulin_barista: "Moulin café barista",
  moulin_vrac: "Moulin café vrac",
  machine_espresso: "Machine espresso",
  autre: "Autre",
};

export function equipmentLabel(type) {
  return EQUIPMENT_LABELS[type] || type;
}

export async function listTransactions(clientId) {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.LOYALTY_TRANSACTIONS, [
    Query.equal("clientId", clientId),
    Query.orderDesc("$createdAt"),
    Query.limit(200),
  ]);
  return res.documents;
}

export async function listEquipment(clientId) {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.CLIENT_EQUIPMENT, [
    Query.equal("clientId", clientId),
    Query.limit(50),
  ]);
  return res.documents;
}

export async function listAllEquipment() {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.CLIENT_EQUIPMENT, [
    Query.limit(500),
  ]);
  return res.documents;
}
