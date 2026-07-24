import React, { useState, useEffect } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { listClients, recordPurchase } from "../lib/purchases.js";
import { useAuth } from "../lib/AuthContext.jsx";
import { useLang, GOLD, BRONZE, INK, PANEL, CREAM, MUTED } from "../lib/theme.js";

export default function AdminPurchaseScreen({ setScreen, standalone = false }) {
  const { t } = useLang();
  const { logout } = useAuth();
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [kg, setKg] = useState("");
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listClients(search).then(setClients).catch(() => setClients([]));
  }, [search]);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("");
    setMessage("");
    if (!selected) {
      setStatus("error");
      setMessage("Sélectionnez un client.");
      return;
    }
    setSubmitting(true);
    try {
      const newBalance = await recordPurchase({ client: selected, kg });
      setStatus("success");
      setMessage(`+${Math.round(Number(kg))} points crédités. Nouveau solde : ${newBalance}.`);
      setKg("");
      setSelected(null);
      setSearch("");
    } catch (err) {
      setStatus("error");
      setMessage(err.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = { backgroundColor: INK, border: `1px solid ${CREAM}33`, color: CREAM };
  const previewPoints = kg ? Math.round(Number(kg)) : 0;

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-6 py-10" dir={t.dir} style={{ backgroundColor: INK, color: CREAM }}>
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          {standalone ? (
            <button onClick={logout} className="flex items-center gap-2 text-sm" style={{ color: MUTED }}>
              Se déconnecter
            </button>
          ) : (
            <button onClick={() => setScreen("dashboard")} className="flex items-center gap-2 text-sm" style={{ color: MUTED }}>
              <ArrowLeft size={16} /> Retour au tableau de bord
            </button>
          )}
          <div className="flex gap-2">
            <button onClick={() => setScreen("admin-spins")} className="text-sm rounded-full px-3 py-1.5" style={{ border: `1px solid ${GOLD}55`, color: GOLD }}>
              Tirages
            </button>
            <button onClick={() => setScreen("admin-lots")} className="text-sm rounded-full px-3 py-1.5" style={{ border: `1px solid ${GOLD}55`, color: GOLD }}>
              Gérer les lots
            </button>
          </div>
        </div>

        <div className="rounded-2xl p-6" style={{ backgroundColor: PANEL, border: `1px solid ${GOLD}33` }}>
          <h1 className="text-xl font-semibold mb-1">Enregistrer un achat</h1>
          <p className="text-sm mb-5" style={{ color: MUTED }}>Règle : 1 kg acheté = 1 point</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs uppercase tracking-wider mb-2 block" style={{ color: GOLD }}>Client</label>
              <div className="flex items-center gap-2 rounded-lg px-3 py-2 mb-2" style={inputStyle}>
                <Search size={16} color={MUTED} />
                <input
                  placeholder="Rechercher par établissement ou nom..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setSelected(null); }}
                  className="flex-1 bg-transparent text-sm focus:outline-none"
                  style={{ color: CREAM }}
                />
              </div>

              {!selected && (
                <div className="max-h-48 overflow-y-auto rounded-lg" style={{ border: `1px solid ${CREAM}1F` }}>
                  {clients.length === 0 && (
                    <p className="text-xs p-3" style={{ color: MUTED }}>Aucun client trouvé.</p>
                  )}
                  {clients.map((c) => (
                    <button
                      type="button"
                      key={c.$id}
                      onClick={() => setSelected(c)}
                      className="w-full text-left px-3 py-2 text-sm"
                      style={{ borderBottom: `1px solid ${CREAM}11`, color: CREAM }}
                    >
                      <span className="font-medium">{c.companyName || c.fullName}</span>
                      {c.companyName && <span style={{ color: MUTED }}> — {c.fullName}</span>}
                      <span style={{ color: GOLD }}> · {c.loyaltyPoints} pts</span>
                    </button>
                  ))}
                </div>
              )}

              {selected && (
                <div className="rounded-lg px-3 py-2 flex items-center justify-between" style={{ backgroundColor: `${GOLD}1A`, border: `1px solid ${GOLD}55` }}>
                  <span className="text-sm">
                    <strong>{selected.companyName || selected.fullName}</strong> — {selected.loyaltyPoints} pts actuels
                  </span>
                  <button type="button" onClick={() => setSelected(null)} className="text-xs" style={{ color: BRONZE }}>
                    Changer
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider mb-2 block" style={{ color: GOLD }}>Quantité achetée (kg)</label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                required
                placeholder="Ex. 12.5"
                value={kg}
                onChange={(e) => setKg(e.target.value)}
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none"
                style={inputStyle}
              />
              {kg && (
                <p className="text-xs mt-1" style={{ color: GOLD }}>= {previewPoints} points à créditer</p>
              )}
            </div>

            {message && (
              <p className="text-xs" style={{ color: status === "success" ? "#7FB88A" : "#E07A5F" }}>{message}</p>
            )}

            <button type="submit" disabled={submitting} className="rounded-full px-6 py-3 text-sm font-semibold disabled:opacity-60" style={{ backgroundColor: GOLD, color: INK }}>
              {submitting ? "…" : "Confirmer l'achat"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
