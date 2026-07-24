import { ID, Query, Permission, Role } from "appwrite";
import { databases, storage, DATABASE_ID, COLLECTIONS, BUCKETS } from "./appwrite";

export const STATUS_LABELS = {
  nouveau: { fr: "Nouveau", ar: "جديد", zgh: "ⴰⵎⴰⵢⵏⵓ", color: "#C9A227" },
  en_cours: { fr: "En cours", ar: "قيد المعالجة", zgh: "ⵉⵜⵜⵎⵙⴰⵔ", color: "#5B8FB9" },
  resolu: { fr: "Résolu", ar: "تم الحل", zgh: "ⵉⴼⵙⵙⵉ", color: "#7FB88A" },
  rejete: { fr: "Rejeté", ar: "مرفوض", zgh: "ⵉⵜⵜⵓⴳⴷⵍ", color: "#E07A5F" },
};

export function attachmentUrl(fileId) {
  if (!fileId) return null;
  return storage.getFileView(BUCKETS.LOT_PHOTOS, fileId);
}

export async function listCategories() {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.COMPLAINT_CATEGORIES, [
    Query.limit(50),
  ]);
  return res.documents;
}

export function categoryLabel(category, lang) {
  if (!category) return "—";
  if (lang === "ar") return category.labelAr;
  if (lang === "zgh") return category.labelZgh;
  return category.labelFr;
}

export async function uploadAttachment(file) {
  const uploaded = await storage.createFile(BUCKETS.LOT_PHOTOS, ID.unique(), file);
  return uploaded.$id;
}

// ---------- Côté client ----------

export async function listMyComplaints(clientId) {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.COMPLAINTS, [
    Query.equal("clientId", clientId),
    Query.orderDesc("$createdAt"),
    Query.limit(100),
  ]);
  return res.documents;
}

export async function createComplaint({ clientId, categoryId, description, files }) {
  const attachmentFileIds = [];
  for (const file of files) {
    const id = await uploadAttachment(file);
    attachmentFileIds.push(id);
  }

  return databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.COMPLAINTS,
    ID.unique(),
    {
      clientId,
      categoryId,
      description,
      status: "nouveau",
      attachmentFileIds,
    },
    [Permission.read(Role.user(clientId))]
  );
}

// ---------- Côté admin ----------

export async function listAllComplaints() {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.COMPLAINTS, [
    Query.orderDesc("$createdAt"),
    Query.limit(200),
  ]);
  return res.documents;
}

export async function updateComplaint(complaintId, { status, adminResponse }) {
  const data = {};
  if (status !== undefined) data.status = status;
  if (adminResponse !== undefined) data.adminResponse = adminResponse;
  return databases.updateDocument(DATABASE_ID, COLLECTIONS.COMPLAINTS, complaintId, data);
}
