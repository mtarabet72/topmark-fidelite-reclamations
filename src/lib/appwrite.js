import { Client, Account, Databases, Storage, Functions, Teams, Messaging } from "appwrite";

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);
export const teams = new Teams(client);

export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

export const COLLECTIONS = {
  CLIENTS: "clients",
  CLIENT_LOYALTY: "client_loyalty",
  LOYALTY_TRANSACTIONS: "loyalty_transactions",
  WHEEL_PRIZES: "wheel_prizes",
  WHEEL_SPINS: "wheel_spins",
  COMPLAINTS: "complaints",
  COMPLAINT_CATEGORIES: "complaint_categories",
  NOTIFICATIONS: "notifications",
  CLIENT_EQUIPMENT: "client_equipment",
};

// Appwrite Functions serveur — seules autorisées à modifier le solde de points
// et à trancher les tirages de la roue (voir functions/*/README.md).
export const FUNCTIONS = {
  AWARD_POINTS: "award-points",
  SPIN_WHEEL: "spin-wheel",
};

export const BUCKETS = {
  COMPLAINT_ATTACHMENTS: "complaint_attachments",
  AVATARS: "avatars",
  LOT_PHOTOS: "lot_photos",
};

export default client;
