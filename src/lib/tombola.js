import { ID, Query } from "appwrite";
import { databases, storage, functions, DATABASE_ID, COLLECTIONS, BUCKETS, FUNCTIONS } from "./appwrite";

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

export const MAX_ATTEMPTS = 2;

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

// Chaque cycle (entre deux remises à zéro) est indépendant : seul le solde
// actuel du client détermine le palier accessible, peu importe l'historique.
export function findNextLockedRange(loyaltyPoints, _spins) {
  return RANGES.find((r) => loyaltyPoints < r.min) || null;
}

export function findAvailableRange(loyaltyPoints, _spins) {
  const unlocked = RANGES.filter((r) => loyaltyPoints >= r.min);
  if (unlocked.length === 0) return null;
  return unlocked[unlocked.length - 1];
}

// Un tirage lancé mais pas encore confirmé (bloque tout nouveau tirage)
export function findPendingSpin(spins) {
  return spins.find((s) => s.confirmed !== true) || null;
}

async function callSpinWheel(payload) {
  const execution = await functions.createExecution(
    FUNCTIONS.SPIN_WHEEL,
    JSON.stringify(payload),
    false
  );
  let result;
  try {
    result = JSON.parse(execution.responseBody || "{}");
  } catch {
    result = {};
  }
  if (execution.responseStatusCode >= 400 || !result.ok) {
    throw new Error(result.error || "La roue a refusé cette action.");
  }
  return result;
}

// Le tirage (choix du lot, vérification d'éligibilité, remise à zéro du solde)
// est entièrement décidé par la Function serveur `spin-wheel` — le client ne
// fait que déclencher l'action et afficher le lot renvoyé, ce qui empêche un
// client de forcer le lot gagnant depuis la console du navigateur.

// 1er essai : demande à la Function de créer le tirage en attente
export async function startSpin({ clientUserId, thresholdPoints }) {
  return callSpinWheel({ action: "start", clientUserId, thresholdPoints });
}

// 2e essai : demande à la Function de retirer un lot pour le tirage en attente
export async function retrySpin({ clientUserId, spinId }) {
  return callSpinWheel({ action: "retry", clientUserId, spinId });
}

// Confirmation définitive : la Function remet le solde du client à zéro
export async function confirmSpin({ clientUserId, spinId }) {
  const result = await callSpinWheel({ action: "confirm", clientUserId, spinId });
  return result.newBalance;
}

// ---------- Côté admin ----------

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
