import { Query } from "appwrite";
import { databases, DATABASE_ID, COLLECTIONS } from "./appwrite";

export const EQUIPMENT_LABELS = {
  fr: {
    presse_cafe: "Presse à café",
    moulin_barista: "Moulin café barista",
    moulin_vrac: "Moulin café vrac",
    machine_espresso: "Machine espresso",
    autre: "Autre",
  },
  ar: {
    presse_cafe: "آلة ضغط القهوة",
    moulin_barista: "مطحنة قهوة باريستا",
    moulin_vrac: "مطحنة قهوة بالجملة",
    machine_espresso: "آلة إسبريسو",
    autre: "أخرى",
  },
  zgh: {
    presse_cafe: "ⵜⴰⵎⵙⵙⵓⴹⴹⴰⵜ ⵏ ⵍⵇⴰⵀⵡⴰ",
    moulin_barista: "ⵜⴰⵙⵉⵔⵜ ⵏ ⵍⵇⴰⵀⵡⴰ ⴱⴰⵔⵉⵙⵜⴰ",
    moulin_vrac: "ⵜⴰⵙⵉⵔⵜ ⵏ ⵍⵇⴰⵀⵡⴰ ⵙ ⵓⵙⵎⵓⵜⵜⴳ",
    machine_espresso: "ⵜⴰⵎⵙⵙⵓⴷⵙⵜ ⵏ ⵉⵙⴱⵔⵉⵙⵓ",
    autre: "ⵢⴰⴹⵏ",
  },
};

export function equipmentLabel(type, lang = "fr") {
  const table = EQUIPMENT_LABELS[lang] || EQUIPMENT_LABELS.fr;
  return table[type] || type;
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
