import { storage, BUCKETS } from "./appwrite";

/**
 * Emplacements des photos de la section "Notre histoire".
 * Dès que vous avez vos vraies photos : Appwrite → Storage → lot_photos
 * → Upload file → copiez l'ID généré → collez-le ici. Aucune autre
 * modification de code n'est nécessaire.
 */
export const HISTORY_IMAGES = {
  fields: "6a6752210023c86fa66b"
  beans:  "6a67524b003342dd9f7d"
  roasting: "6a6753ac0022cd902922"
};

export function brandImageUrl(fileId) {
  if (!fileId) return null;
  return storage.getFileView(BUCKETS.LOT_PHOTOS, fileId);
}
