import { storage, BUCKETS } from "./appwrite";

/**
 * Emplacements des photos de la section "Notre histoire".
 * Dès que vous avez vos vraies photos : Appwrite → Storage → lot_photos
 * → Upload file → copiez l'ID généré → collez-le ici. Aucune autre
 * modification de code n'est nécessaire.
 */
export const HISTORY_IMAGES = {
  fields: null,   // photo des champs / plantations de café
  beans: null,    // photo de grains de café
  roasting: null, // photo de la torréfaction
};

export function brandImageUrl(fileId) {
  if (!fileId) return null;
  return storage.getFileView(BUCKETS.LOT_PHOTOS, fileId);
}
