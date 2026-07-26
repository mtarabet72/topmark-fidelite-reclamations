import { Query } from "appwrite";
import { databases, functions, DATABASE_ID, COLLECTIONS, FUNCTIONS } from "./appwrite";
import { RANGES } from "./tombola.js";
import { createNotification } from "./notifications.js";

export async function listClients(search = "") {
  const [clientsRes, loyaltyRes] = await Promise.all([
    databases.listDocuments(DATABASE_ID, COLLECTIONS.CLIENTS, [
      Query.limit(100),
      Query.orderDesc("$createdAt"),
    ]),
    databases.listDocuments(DATABASE_ID, COLLECTIONS.CLIENT_LOYALTY, [Query.limit(100)]),
  ]);
  const loyaltyByClientId = new Map(loyaltyRes.documents.map((l) => [l.clientId, l]));
  const merged = clientsRes.documents.map((c) => ({
    ...c,
    loyaltyPoints: loyaltyByClientId.get(c.userId)?.loyaltyPoints ?? 0,
    tier: loyaltyByClientId.get(c.userId)?.tier ?? "bronze",
  }));

  if (!search) return merged;
  const term = search.toLowerCase();
  return merged.filter(
    (c) =>
      (c.companyName || "").toLowerCase().includes(term) ||
      (c.fullName || "").toLowerCase().includes(term)
  );
}

function highestUnlockedRange(points) {
  const unlocked = RANGES.filter((r) => points >= r.min);
  return unlocked.length > 0 ? unlocked[unlocked.length - 1] : null;
}

// Règle : 1 kg acheté = 1 point.
// Le crédit réel est effectué par la Function serveur `award-points` (exécutable
// uniquement par l'équipe support-agents) — le client ne fait que déclencher
// l'exécution et afficher le résultat renvoyé.
export async function recordPurchase({ client, kg }) {
  const points = Math.round(Number(kg));
  if (!points || points <= 0) throw new Error("Quantité invalide.");

  const execution = await functions.createExecution(
    FUNCTIONS.AWARD_POINTS,
    JSON.stringify({ clientUserId: client.userId, kg: points }),
    false
  );

  let result;
  try {
    result = JSON.parse(execution.responseBody || "{}");
  } catch {
    result = {};
  }
  if (execution.responseStatusCode >= 400 || !result.ok) {
    throw new Error(result.error || "Le crédit de points a été refusé par le serveur.");
  }

  const { oldBalance, newBalance } = result;

  // Notifie le client si l'achat lui fait franchir un nouveau palier tombola
  const rangeBefore = highestUnlockedRange(oldBalance);
  const rangeAfter = highestUnlockedRange(newBalance);
  if (rangeAfter && rangeAfter.min !== rangeBefore?.min) {
    try {
      await createNotification({
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
