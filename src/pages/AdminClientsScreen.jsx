import React, { useState, useEffect } from "react";
import { ArrowLeft, Search, Building2, MapPin, Phone, Mail, Wrench, Gift, TrendingUp, X } from "lucide-react";
import { listClients } from "../lib/purchases.js";
import { listTransactions, listAllEquipment, equipmentLabel } from "../lib/history.js";
import { listClientSpins, listAllPrizes, photoUrl } from "../lib/tombola.js";
import { useLang, GOLD, BRONZE, INK, PANEL, CREAM, MUTED } from "../lib/theme.js";

export default function AdminClientsScreen({ setScreen }) {
  const { t } = useLang();
  const [clients, setClients] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [prizes, setPrizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState({ tx: [], spins: [], loading: false });

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [c, e, p] = await Promise.all([listClients(), listAllEquipment(), listAllPrizes()]);
      setClients(c);
      setEquipment(e);
      setPrizes(p);
      setLoading(false);
    })();
  }, []);

  async function openClient(client) {
    setSelected(client);
    setDetail({ tx: [], spins: [], loading: true });
    const [tx, spins] = await Promise.all([
      listTransactions(client.userId),
      listClientSpins(client.userId),
    ]);
    setDetail({ tx, spins, loading: false });
  }

  const term = search.toLowerCase();
  const visible = clients.filter(
    (c) =>
      (c.companyName || "").toLowerCase().includes(term) ||
      (c.fullName || "").toLowerCase().includes(term) ||
      (c.city || "").toLowerCase().includes(term)
  );

  const inputStyle = { backgroundColor: INK, border: `1px solid ${CREAM}33`, color: CREAM };

  // ---- Fiche détaillée d'un client ----
  if (selected) {
    const clientEquipment = equipment.filter((e) => e.clientId === selected.userId);
    const totalKg = detail.tx.filter((x) => x.points > 0).reduce((s, x) => s + x.points, 0);

    return (
      <div className="min-h-screen w-full flex flex-col items-center px-6 py-10" dir={t.dir} style={{ backgroundColor: INK, color: CREAM }}>
        <div className="w-full max-w-2xl">
          <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-sm mb-6" style={{ color: MUTED }}>
            <ArrowLeft size={16} /> Retour à la liste
          </button>

          {/* En-tête société */}
          <div className="rounded-2xl p-5 mb-4" style={{ backgroundColor: PANEL, border: `1px solid ${GOLD}44` }}>
            <div className="flex items-start gap-3 mb-3">
              <div className="rounded-xl p-3" style={{ backgroundColor: `${GOLD}22` }}>
                <Building2 size={22} color={GOLD} />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-semibold truncate">{selected.companyName || "—"}</h1>
                <p className="text-sm" style={{ color: MUTED }}>{selected.fullName}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold" style={{ color: GOLD }}>{selected.loyaltyPoints}</p>
                <p className="text-xs" style={{ color: MUTED }}>points</p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 text-sm" style={{ color: MUTED }}>
              {selected.address && (
                <p className="flex items-center gap-2"><MapPin size={14} /> {selected.address}, {selected.city}</p>
              )}
              {selected.phone && <p className="flex items-center gap-2"><Phone size={14} /> {selected.phone}</p>}
              {selected.email && <p className="flex items-center gap-2"><Mail size={14} /> {selected.email}</p>}
            </div>

            <div className="flex gap-4 mt-3 pt-3 text-xs" style={{ borderTop: `1px solid ${CREAM}1A`, color: MUTED }}>
              <span>Total acheté : <strong style={{ color: CREAM }}>{totalKg} kg</strong></span>
              <span>Palier : <strong style={{ color: CREAM }}>{selected.tier}</strong></span>
              <span>Langue : <strong style={{ color: CREAM }}>{selected.locale}</strong></span>
            </div>
          </div>

          {/* Matériel */}
          <div className="rounded-2xl p-5 mb-4" style={{ backgroundColor: PANEL, border: `1px solid ${BRONZE}33` }}>
            <p className="text-xs uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: BRONZE }}>
              <Wrench size={14} /> Matériel installé
            </p>
            {clientEquipment.length === 0 && (
              <p className="text-sm" style={{ color: MUTED }}>Aucun matériel enregistré.</p>
            )}
            <div className="flex flex-col gap-2">
              {clientEquipment.map((e) => (
                <div key={e.$id} className="flex items-center justify-between text-sm">
                  <span>{equipmentLabel(e.equipmentType)}</span>
                  <span style={{ color: MUTED }}>
                    {[e.brand, e.model].filter(Boolean).join(" ") || "—"} · ×{e.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {detail.loading && <p className="text-sm" style={{ color: MUTED }}>Chargement de l'historique…</p>}

          {/* Lots gagnés */}
          {!detail.loading && (
            <div className="rounded-2xl p-5 mb-4" style={{ backgroundColor: PANEL, border: `1px solid ${GOLD}33` }}>
              <p className="text-xs uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: GOLD }}>
                <Gift size={14} /> Lots gagnés ({detail.spins.length})
              </p>
              {detail.spins.length === 0 && <p className="text-sm" style={{ color: MUTED }}>Aucun lot.</p>}
              <div className="flex flex-col gap-2">
                {detail.spins.map((s) => {
                  const prize = prizes.find((p) => p.$id === s.prizeId);
                  return (
                    <div key={s.$id} className="flex items-center gap-2 text-sm">
                      {prize?.photoFileId && (
                        <img src={photoUrl(prize.photoFileId)} alt="" className="w-8 h-8 rounded object-cover" />
                      )}
                      <span className="flex-1 truncate">{prize?.label || "Lot"}</span>
                      <span className="text-xs" style={{ color: s.delivered ? MUTED : GOLD }}>
                        {s.delivered ? "Remis" : "À retirer"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mouvements de points */}
          {!detail.loading && (
            <div className="rounded-2xl p-5" style={{ backgroundColor: PANEL, border: `1px solid ${CREAM}1A` }}>
              <p className="text-xs uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: MUTED }}>
                <TrendingUp size={14} /> Mouvements ({detail.tx.length})
              </p>
              {detail.tx.length === 0 && <p className="text-sm" style={{ color: MUTED }}>Aucun mouvement.</p>}
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                {detail.tx.map((x) => (
                  <div key={x.$id} className="flex items-center justify-between text-sm">
                    <span className="truncate">{x.reason || "—"}</span>
                    <span className="flex items-center gap-3 whitespace-nowrap">
                      <span className="text-xs" style={{ color: MUTED }}>
                        {new Date(x.$createdAt).toLocaleDateString("fr-FR")}
                      </span>
                      <strong style={{ color: x.points > 0 ? GOLD : BRONZE }}>
                        {x.points > 0 ? "+" : ""}{x.points}
                      </strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- Liste des clients ----
  return (
    <div className="min-h-screen w-full flex flex-col items-center px-6 py-10" dir={t.dir} style={{ backgroundColor: INK, color: CREAM }}>
      <div className="w-full max-w-2xl">
        <button onClick={() => setScreen("admin")} className="flex items-center gap-2 text-sm mb-6" style={{ color: MUTED }}>
          <ArrowLeft size={16} /> Retour
        </button>

        <h1 className="text-xl font-semibold mb-1">Clients</h1>
        <p className="text-sm mb-5" style={{ color: MUTED }}>{clients.length} client{clients.length > 1 ? "s" : ""} enregistré{clients.length > 1 ? "s" : ""}</p>

        <div className="flex items-center gap-2 rounded-lg px-3 py-2 mb-4" style={inputStyle}>
          <Search size={16} color={MUTED} />
          <input
            placeholder="Rechercher par société, nom ou ville..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm focus:outline-none"
            style={{ color: CREAM }}
          />
        </div>

        {loading && <p className="text-sm" style={{ color: MUTED }}>Chargement…</p>}

        <div className="flex flex-col gap-2">
          {visible.map((c) => {
            const count = equipment.filter((e) => e.clientId === c.userId).length;
            return (
              <button
                key={c.$id}
                onClick={() => openClient(c)}
                className="rounded-2xl p-4 flex items-center gap-3 text-left"
                style={{ backgroundColor: PANEL, border: `1px solid ${CREAM}1A` }}
              >
                <div className="rounded-lg p-2.5" style={{ backgroundColor: `${GOLD}1A` }}>
                  <Building2 size={18} color={GOLD} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{c.companyName || c.fullName}</p>
                  <p className="text-xs truncate" style={{ color: MUTED }}>
                    {c.city || "Ville non précisée"} · {count} équipement{count > 1 ? "s" : ""}
                    {!c.technicalFileCompleted && " · fiche incomplète"}
                  </p>
                </div>
                <p className="text-sm font-semibold" style={{ color: GOLD }}>{c.loyaltyPoints} pts</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
