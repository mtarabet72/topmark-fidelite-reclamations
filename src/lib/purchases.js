import { ID, Query, Permission, Role } from "appwrite";
import { databases, DATABASE_ID, COLLECTIONS } from "./appwrite";
import { RANGES } from "./tombola.js";
import { secureNotify } from "./secureActions.js";

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

function highestUnlockedRange(points) {
  const unlocked = RANGES.filter((r) => points >= r.min);
  return unlocked.length > 0 ? unlocked[unlocked.length - 1] : null;
}

// Règle : 1 kg acheté = 1 point
export async function recordPurchase({ client, kg }) {
  const points = Math.round(Number(kg));
  if (!points || points <= 0) throw new Error("Quantité invalide.");

  await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.LOYALTY_TRANSACTIONS,
    ID.unique(),
    {
      clientId: client.userId,
      type: "gain",
      points,
      reason: `Achat ${kg} kg`,
    },
    [Permission.read(Role.user(client.userId))]
  );

  const oldBalance = client.loyaltyPoints || 0;
  const newBalance = oldBalance + points;

  await databases.updateDocument(DATABASE_ID, COLLECTIONS.CLIENTS, client.$id, {
    loyaltyPoints: newBalance,
  });

  // Notifie le client si l'achat lui fait franchir un nouveau palier tombola
  const rangeBefore = highestUnlockedRange(oldBalance);
  const rangeAfter = highestUnlockedRange(newBalance);
  if (rangeAfter && rangeAfter.min !== rangeBefore?.min) {
    try {
      await secureNotify({
        clientId: client.userId,
        titleFr: `Nouveau palier tombola débloqué : ${rangeAfter.min}-${rangeAfter.max} kg ! Tentez votre chance.`,
        titleAr: `تم فتح مستوى جديد للقرعة: ${rangeAfter.min}-${rangeAfter.max} كلغ! جربوا حظكم.`,
        titleZgh: `ⴰⵙⵡⵉⵔ ⴰⵎⴰⵢⵏⵓ ⵏ ⵜⵓⵎⴱⵓⵍⴰ ⵉⵍⵍⵉ: ${rangeAfter.min}-${rangeAfter.max} ⴽⴳ! ⴰⵔⵎⵜ ⴰⵣⵎⵣ ⵏⵏⵓⵏ.`,
        relatedType: "loyalty",
        relatedId: "",
      });
    } catch (err) {
      console.error("Notification palier non envoyée :", err);
    }
  }

  return newBalance;
}
