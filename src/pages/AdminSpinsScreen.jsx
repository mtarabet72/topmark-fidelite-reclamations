import React, { useState, useEffect } from "react";
import { ArrowLeft, Check, Package } from "lucide-react";
import { listAllSpins, listAllPrizes, markSpinDelivered, photoUrl } from "../lib/tombola.js";
import { listClients } from "../lib/purchases.js";
import { useLang, GOLD, BRONZE, INK, PANEL, CREAM, MUTED } from "../lib/theme.js";

export default function AdminSpinsScreen({ setScreen }) {
  const { t } = useLang();
  const [spins, setSpins] = useState([]);
  const [prizes, setPrizes] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | pending | delivered

  async function refresh() {
    setLoading(true);
    const [s, p, c] = await Promise.all([listAllSpins(), listAllPrizes(), listClients()]);
    setSpins(s);
    setPrizes(p);
    setClients(c);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  function prizeOf(spin) {
    return prizes.find((p) => p.$id === spin.prizeId);
  }

  function clientOf(spin) {
    return clients.find((c) => c.userId === spin.clientId);
  }

  async function toggleDelivered(spin) {
    await markSpinDelivered(spin.$id, !spin.delivered);
    setSpins((prev) =>
      prev.map((s) => (s.$id === spin.$id ? { ...s, delivered: !s.delivered } : s))
    );
  }

  const visibleSpins = spins.filter((s) => {
    if (filter === "pending") return !s.delivered;
    if (filter === "delivered") return s.delivered;
    return true;
  });

  const pendingCount = spins.filter((s) => !s.delivered).length;

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-6 py-10" dir={t.dir} style={{ backgroundColor: INK, color: CREAM }}>
      <div className="w-full max-w-2xl">
        <button onClick={() => setScreen("admin")} className="flex items-center gap-2 text-sm mb-6" style={{ color: MUTED }}>
          <ArrowLeft size={16} /> Retour
        </button>

        <h1 className="text-xl font-semibold mb-1">Tirages clients</h1>
        <p className="text-sm mb-5" style={{ color: MUTED }}>
          {pendingCount} lot{pendingCount > 1 ? "s" : ""} en attente de remise
        </p>

        <div className="flex gap-2 mb-5">
          {[
            { key: "all", label: "Tous" },
            { key: "pending", label: "À remettre" },
            { key: "delivered", label: "Remis" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="rounded-full px-4 py-1.5 text-sm"
              style={{
                backgroundColor: filter === f.key ? GOLD : "transparent",
                color: filter === f.key ? INK : CREAM,
                border: `1px solid ${filter === f.key ? GOLD : CREAM + "33"}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading && <p className="text-sm" style={{ color: MUTED }}>Chargement…</p>}

        {!loading && visibleSpins.length === 0 && (
          <p className="text-sm" style={{ color: MUTED }}>Aucun tirage à afficher.</p>
        )}

        <div className="flex flex-col gap-3">
          {visibleSpins.map((spin) => {
            const prize = prizeOf(spin);
            const client = clientOf(spin);
            return (
              <div
                key={spin.$id}
                className="rounded-2xl p-4 flex items-center gap-3"
                style={{
                  backgroundColor: PANEL,
                  border: `1px solid ${spin.delivered ? CREAM + "1A" : GOLD + "44"}`,
                  opacity: spin.delivered ? 0.6 : 1,
                }}
              >
                {prize?.photoFileId ? (
                  <img src={photoUrl(prize.photoFileId)} alt={prize.label} className="w-14 h-14 rounded-lg object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${BRONZE}22` }}>
                    <Package size={20} color={BRONZE} />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {client?.companyName || client?.fullName || "Client inconnu"}
                  </p>
                  <p className="text-sm truncate" style={{ color: GOLD }}>
                    {prize?.label || "Lot supprimé"}
                  </p>
                  <p className="text-xs" style={{ color: MUTED }}>
                    Palier {spin.thresholdPoints} kg · {new Date(spin.spunAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>

                <button
                  onClick={() => toggleDelivered(spin)}
                  className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs whitespace-nowrap"
                  style={{
                    backgroundColor: spin.delivered ? `${CREAM}1A` : GOLD,
                    color: spin.delivered ? MUTED : INK,
                    border: spin.delivered ? `1px solid ${CREAM}33` : "none",
                  }}
                >
                  <Check size={14} />
                  {spin.delivered ? "Remis" : "Marquer remis"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
