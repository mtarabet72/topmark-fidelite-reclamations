import { ID, Query } from "appwrite";
import { databases, storage, DATABASE_ID, COLLECTIONS, BUCKETS } from "./appwrite";

// Les 13 paliers définis par TOP MARK — [min, max] en kg cumulés
export const RANGES = [
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

export function findRangeForPoints(points) {
  return RANGES.find((r) => points >= r.min && points <= r.max) || null;
}

export function photoUrl(fileId) {
  if (!fileId) return null;
  return storage.getFileView(BUCKETS.LOT_PHOTOS, fileId);
}

// ---------- Côté client ----------

export async function listActivePrizesForRange(rangeMin) {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.WHEEL_PRIZES, [
    Query.equal("rangeMin", rangeMin),
    Query.equal("active", true),
    Query.limit(50),
  ]);
  return res.documents;
}

export async function listClientSpins(clientId) {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.WHEEL_SPINS, [
    Query.equal("clientId", clientId),
    Query.limit(200),
  ]);
  return res.documents;
}

export function findNextLockedRange(loyaltyPoints, spins) {
  const claimedThresholds = new Set(spins.map((s) => s.thresholdPoints));
  return RANGES.find((r) => !claimedThresholds.has(r.min) && loyaltyPoints < r.min) || null;
}

export function findAvailableRange(loyaltyPoints, spins) {
  const claimedThresholds = new Set(spins.map((s) => s.thresholdPoints));
  const unlockedRanges = RANGES.filter((r) => loyaltyPoints >= r.min && !claimedThresholds.has(r.min));
  if (unlockedRanges.length === 0) return null;
  return unlockedRanges[unlockedRanges.length - 1];
}

export function drawPrize(prizes) {
  if (prizes.length === 0) return null;
  const weights = prizes.map((p) => Math.max(Number(p.probability) || 0, 0.0001));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < prizes.length; i++) {
    r -= weights[i];
    if (r <= 0) return prizes[i];
  }
  return prizes[prizes.length - 1];
}

export async function recordSpin({ clientId, prize, thresholdPoints }) {
  await databases.createDocument(DATABASE_ID, COLLECTIONS.WHEEL_SPINS, ID.unique(), {
    clientId,
    prizeId: prize.$id,
    thresholdPoints,
    spunAt: new Date().toISOString(),
  });
}

// ---------- Côté admin (gestion du catalogue) ----------

export async function listAllPrizes() {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.WHEEL_PRIZES, [
    Query.orderAsc("rangeMin"),
    Query.limit(500),
  ]);
  return res.documents;
}

export async function uploadLotPhoto(file) {
  const uploaded = await storage.createFile(BUCKETS.LOT_PHOTOS, ID.unique(), file);
  return uploaded.$id;
}

export async function createPrize({ label, rangeMin, probability, photoFileId }) {
  return databases.createDocument(DATABASE_ID, COLLECTIONS.WHEEL_PRIZES, ID.unique(), {
    label,
    rangeMin: Number(rangeMin),
    probability: Number(probability) || 0.33,
    pointsValue: 0,
    active: true,
    photoFileId: photoFileId || "",
  });
}

export async function updatePrize(prizeId, data) {
  return databases.updateDocument(DATABASE_ID, COLLECTIONS.WHEEL_PRIZES, prizeId, data);
}

export async function deletePrize(prizeId) {
  return databases.deleteDocument(DATABASE_ID, COLLECTIONS.WHEEL_PRIZES, prizeId);
}

// Liste tous les tirages, du plus récent au plus ancien (vue admin)
export async function listAllSpins() {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.WHEEL_SPINS, [
    Query.orderDesc("spunAt"),
    Query.limit(200),
  ]);
  return res.documents;
}

export async function markSpinDelivered(spinId, delivered) {
  return databases.updateDocument(DATABASE_ID, COLLECTIONS.WHEEL_SPINS, spinId, { delivered });
}
