import React, { createContext, useContext, useState, useEffect } from "react";
import { ID, Permission, Role } from "appwrite";
import { account, databases, DATABASE_ID, COLLECTIONS } from "./appwrite";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // document de la table "clients"
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId) {
    try {
      const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.CLIENTS, []);
      const doc = res.documents.find((d) => d.userId === userId);
      setProfile(doc || null);
    } catch (err) {
      console.error("Erreur chargement profil client :", err);
    }
  }

  async function refreshSession() {
    try {
      const current = await account.get();
      setUser(current);
      await loadProfile(current.$id);
    } catch {
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshSession();
  }, []);

  async function register({ fullName, email, password, locale }) {
    await account.create(ID.unique(), email, password, fullName);
    await account.createEmailPasswordSession(email, password);
    const current = await account.get();

    // Création du profil client associé — solde de points à 0 par défaut
    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.CLIENTS,
      ID.unique(),
      {
        userId: current.$id,
        fullName,
        phone: "",
        email,
        locale,
        loyaltyPoints: 0,
        tier: "bronze",
      },
      [
        Permission.read(Role.user(current.$id)),
        Permission.update(Role.user(current.$id)),
      ]
    );

    setUser(current);
    setProfile(doc);
  }

  async function login({ email, password }) {
    await account.createEmailPasswordSession(email, password);
    await refreshSession();
  }

  async function logout() {
    await account.deleteSession("current");
    setUser(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
