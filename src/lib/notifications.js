import { ID, Query, Permission, Role } from "appwrite";
import { databases, DATABASE_ID, COLLECTIONS } from "./appwrite";

export async function listMyNotifications(clientId) {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, [
    Query.equal("clientId", clientId),
    Query.orderDesc("$createdAt"),
    Query.limit(100),
  ]);
  return res.documents;
}

export function notificationTitle(notif, lang) {
  if (lang === "ar") return notif.titleAr || notif.titleFr;
  if (lang === "zgh") return notif.titleZgh || notif.titleFr;
  return notif.titleFr;
}

export async function markAsRead(notifId) {
  return databases.updateDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, notifId, { read: true });
}

export async function markAllAsRead(notifs) {
  const unread = notifs.filter((n) => !n.read);
  await Promise.all(unread.map((n) => markAsRead(n.$id)));
}

// Appelée côté admin (Team support-agents a le droit de Create)
export async function createNotification({ clientId, titleFr, titleAr, titleZgh, relatedType, relatedId }) {
  return databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.NOTIFICATIONS,
    ID.unique(),
    {
      clientId,
      titleFr,
      titleAr,
      titleZgh,
      read: false,
      relatedType,
      relatedId: relatedId || "",
    },
    [
      Permission.read(Role.user(clientId)),
      Permission.update(Role.user(clientId)),
    ]
  );
}
