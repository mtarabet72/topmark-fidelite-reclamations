import React from "react";
import { Gift, MessageSquareWarning, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "../lib/AuthContext.jsx";
import { useLang, GOLD, BRONZE, INK, PANEL, CREAM, MUTED } from "../lib/theme.js";

export default function Dashboard({ setScreen }) {
  const { t } = useLang();
  const { profile, user, isAdmin, logout } = useAuth();

  return (
    <div className="min-h-screen w-full flex flex-col" dir={t.dir} style={{ backgroundColor: INK, color: CREAM }}>
      <header className="flex items-center justify-between px-5 py-4 md:px-10" style={{ borderBottom: `1px solid ${GOLD}26` }}>
        <div>
          <p className="text-sm" style={{ color: MUTED }}>{t.hero.eyebrow}</p>
          <p className="text-lg font-semibold">{profile?.fullName || user?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setScreen("admin")}
              className="flex items-center gap-2 text-sm rounded-full px-4 py-2"
              style={{ backgroundColor: `${GOLD}22`, color: GOLD, border: `1px solid ${GOLD}55` }}
            >
              <ShieldCheck size={16} /> Espace Admin
            </button>
          )}
          <button onClick={logout} className="flex items-center gap-2 text-sm rounded-full px-4 py-2" style={{ border: `1px solid ${CREAM}33`, color: CREAM }}>
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="px-6 py-8 max-w-3xl mx-auto w-full flex flex-col gap-6">
        <div className="rounded-2xl p-6 flex items-center justify-between" style={{ backgroundColor: PANEL, border: `1px solid ${GOLD}44` }}>
          <div>
            <p className="text-sm" style={{ color: MUTED }}>Solde de points</p>
            <p className="text-4xl font-bold" style={{ color: GOLD }}>{profile ? profile.loyaltyPoints : "…"}</p>
          </div>
          <div className="rounded-xl p-3" style={{ backgroundColor: `${GOLD}22` }}>
            <Gift size={28} color={GOLD} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => setScreen("tombola")}
            className="rounded-2xl p-5 cursor-pointer"
            style={{ backgroundColor: PANEL, border: `1px solid ${GOLD}33` }}
          >
            <Gift size={20} color={GOLD} className="mb-2" />
            <p className="font-semibold mb-1">{t.sections.loyaltyTitle}</p>
            <p className="text-sm" style={{ color: MUTED }}>{t.sections.loyaltyDesc}</p>
          </div>
          <div className="rounded-2xl p-5" style={{ backgroundColor: PANEL, border: `1px solid ${BRONZE}33` }}>
            <MessageSquareWarning size={20} color={BRONZE} className="mb-2" />
            <p className="font-semibold mb-1">{t.sections.claimsTitle}</p>
            <p className="text-sm" style={{ color: MUTED }}>{t.sections.claimsDesc}</p>
          </div>
        </div>

        {!profile && (
          <p className="text-xs" style={{ color: MUTED }}>Profil client en cours de chargement…</p>
        )}
      </main>
    </div>
  );
}
