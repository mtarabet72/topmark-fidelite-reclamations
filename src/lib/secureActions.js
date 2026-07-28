import { functions } from "./appwrite";

const FUNCTION_ID = "app-actions";

async function callAction(action, params = {}) {
  const exec = await functions.createExecution(FUNCTION_ID, JSON.stringify({ action, ...params }), false);
  let body = {};
  try {
    body = JSON.parse(exec.responseBody || "{}");
  } catch {
    throw new Error("Réponse serveur invalide.");
  }
  if (exec.responseStatusCode >= 400 || body.error) {
    throw new Error(body.error || "Erreur serveur.");
  }
  return body;
}

export async function secureStartSpin() {
  const { spin } = await callAction("start");
  return spin;
}

export async function secureRetrySpin() {
  const { spin } = await callAction("retry");
  return spin;
}

export async function secureConfirmSpin() {
  const { newBalance } = await callAction("confirm");
  return newBalance;
}

export async function secureNotify({ clientId, titleFr, titleAr, titleZgh, relatedType, relatedId }) {
  return callAction("notify", { clientId, titleFr, titleAr, titleZgh, relatedType, relatedId });
}

export async function secureListNotifications() {
  const { notifications } = await callAction("list-notifications");
  return notifications;
}

export async function secureMarkRead(notificationId) {
  const { notification } = await callAction("mark-read", { notificationId });
  return notification;
}

export async function secureMarkAllRead() {
  return callAction("mark-all-read");
}
