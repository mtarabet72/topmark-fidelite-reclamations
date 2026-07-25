import React, { useState, useEffect } from "react";
import { ArrowLeft, TrendingUp, TrendingDown, Gift, Wrench } from "lucide-react";
import { useAuth } from "../lib/AuthContext.jsx";
import { listTransactions, listEquipment, equipmentLabel } from "../lib/history.js";
import { listClientSpins, listAllPrizes, photoUrl } from "../lib/tombola.js";
import { useLang, GOLD, BRONZE, INK, PANEL, CREAM, MUTED } from "../lib/theme.js";

export default function HistoryScreen({ setScreen }) {
  const { t } = useLang();
  const { user, profile } = useAuth();

  const [tx, setTx] = useState([]);
  const [spins, setSpins] = useState([]);
  const [prizes, setPrizes] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("points");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [a, b, c, d] = await Promise.all([
        listTransactions(user.$id),
        listClientSpins(user.$id),
        listAllPrizes(),
        listEquipment(user.$id),
      ]);
      setTx(a);
      setSpins(b);
      setPrizes(c);
      setEquipment(d);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalKg = tx.filter((x) => x.points > 0).reduce((s, x) => s + x.points, 0);

  const tabs = [
    { key: "points", label: "Achats" },
    { key: "lots", label: "Lots gagnés" },
    { key: "materiel", label: "Mon matériel" },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-6 py-10" dir={t.dir} style={{ backgroundColor: INK, color: CREAM }}>
      <div className="w-full max-w-lg">
        <button onClick={() => setScreen("dashboard")} className="flex items-center gap-2 text-sm mb-6" style={{ color: MUTED }}>
          <ArrowLeft size={16} /> {t.nav.home}
        </button>

        <h1 className="text-xl font-semibold mb-1">Mon historique</h1>
        <p className="text-sm mb-5" style={{ color: MUTED }}>
          Solde actuel : <strong style={{ color: GOLD }}>{profile?.loyaltyPoints || 0} pts</strong> · Total acheté : {totalKg} kg
        </p>

        <div className="flex gap-2 mb-5">
          {tabs.map((f) => (
            <button
              key={f.key}
              onClick={() => setTab(f.key)}
              className="rounded-full px-4 py-1.5 text-sm"
              style={{
                backgroundColor: tab === f.key ? GOLD : "transparent",
                color: tab === f.key ? INK : CREAM,
                border: `1px solid ${tab === f.key ? GOLD : CREAM + "33"}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading && <p className="text-sm" style={{ color: MUTED }}>Chargement…</p>}

        {!loading && tab === "points" && (
          <div className="flex flex-col gap-2">
            {tx.length === 0 && <p className="text-sm" style={{ color: MUTED }}>Aucun mouvement.</p>}
            {tx.map((x) => {
              const positive = x.points > 0;
              return (
                <div key={x.$id} className="rounded-xl p-3 flex items-center gap-3" style={{ backgroundColor: PANEL, border: `1px solid ${CREAM}1A` }}>
                  <div className="rounded-lg p-2" style={{ backgroundColor: positive ? `${GOLD}22` : `${BRONZE}22` }}>
                    {positive ? <TrendingUp size={16} color={GOLD} /> : <TrendingDown size={16} color={BRONZE} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{x.reason || (positive ? "Achat" : "Débit")}</p>
                    <p className="text-xs" style={{ color: MUTED }}>
                      {new Date(x.$createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: positive ? GOLD : BRONZE }}>
                    {positive ? "+" : ""}{x.points}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {!loading && tab === "lots" && (
          <div className="flex flex-col gap-2">
            {spins.length === 0 && <p className="text-sm" style={{ color: MUTED }}>Aucun lot gagné.</p>}
            {spins.map((s) => {
              const prize = prizes.find((p) => p.$id === s.prizeId);
              return (
                <div key={s.$id} className="rounded-xl p-3 flex items-center gap-3" style={{ backgroundColor: PANEL, border: `1px solid ${CREAM}1A` }}>
                  {prize?.photoFileId ? (
                    <img src={photoUrl(prize.photoFileId)} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${GOLD}22` }}>
                      <Gift size={18} color={GOLD} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" style={{ color: GOLD }}>{prize?.label || "Lot"}</p>
                    <p className="text-xs" style={{ color: MUTED }}>
                      Palier {s.thresholdPoints} kg · {new Date(s.spunAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <span className="text-[10px] rounded-full px-2 py-1 whitespace-nowrap" style={{
                    backgroundColor: s.delivered ? `${CREAM}14` : `${GOLD}22`,
                    color: s.delivered ? MUTED : GOLD,
                    border: `1px solid ${s.delivered ? CREAM + "22" : GOLD + "55"}`,
                  }}>
                    {s.delivered ? "Remis" : "À retirer"}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {!loading && tab === "materiel" && (
          <div className="flex flex-col gap-2">
            {equipment.length === 0 && <p className="text-sm" style={{ color: MUTED }}>Aucun matériel enregistré.</p>}
            {equipment.map((e) => (
              <div key={e.$id} className="rounded-xl p-3 flex items-center gap-3" style={{ backgroundColor: PANEL, border: `1px solid ${CREAM}1A` }}>
                <div className="rounded-lg p-2" style={{ backgroundColor: `${BRONZE}22` }}>
                  <Wrench size={16} color={BRONZE} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{equipmentLabel(e.equipmentType)}</p>
                  <p className="text-xs" style={{ color: MUTED }}>
                    {[e.brand, e.model].filter(Boolean).join(" ") || "Marque non précisée"}
                  </p>
                </div>
                <p className="text-sm" style={{ color: GOLD }}>×{e.quantity}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
