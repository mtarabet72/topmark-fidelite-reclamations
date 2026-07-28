import { functions } from "./appwrite";

const FUNCTION_ID = "app-actions";

async function callAction(action) {
  const exec = await functions.createExecution(FUNCTION_ID, JSON.stringify({ action }), false);
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
