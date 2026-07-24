import React, { createContext, useContext, useState, useEffect } from "react";
import { ID, Permission, Role } from "appwrite";
import { account, databases, teams, DATABASE_ID, COLLECTIONS } from "./appwrite";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
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

  async function checkAdmin() {
    try {
      const res = await teams.list();
      const admin = res.teams.some((tm) => tm.$id === "support-agents");
      setIsAdmin(admin);
    } catch {
      setIsAdmin(false);
    }
  }

  async function refreshSession() {
    try {
      const current = await account.get();
      setUser(current);
      await loadProfile(current.$id);
      await checkAdmin();
    } catch {
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
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
    await checkAdmin();
  }

  async function login({ email, password }) {
    await account.createEmailPasswordSession(email, password);
    await refreshSession();
  }

  async function logout() {
    await account.deleteSession("current");
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
  }

  async function completeTechnicalFile({ companyName, address, city, equipmentList }) {
    if (!user || !profile) throw new Error("Session invalide.");

    const updatedDoc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.CLIENTS,
      profile.$id,
      { companyName, address, city, technicalFileCompleted: true }
    );

    for (const item of equipmentList) {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.CLIENT_EQUIPMENT,
        ID.unique(),
        {
          clientId: user.$id,
          equipmentType: item.equipmentType,
          brand: item.brand || "",
          model: item.model || "",
          quantity: Number(item.quantity) || 1,
        },
        [
          Permission.read(Role.user(user.$id)),
          Permission.update(Role.user(user.$id)),
        ]
      );
    }

    setProfile(updatedDoc);
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, isAdmin, loading, register, login, logout, completeTechnicalFile }}
    >
      {children}
    </AuthContext.Provider>
  );
}
