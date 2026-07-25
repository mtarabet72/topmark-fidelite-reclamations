import React, { useState, useEffect } from "react";
import { ArrowLeft, TrendingUp, TrendingDown, Gift, Wrench } from "lucide-react";
import { useAuth } from "../lib/AuthContext.jsx";
import { listTransactions, listEquipment, equipmentLabel } from "../lib/history.js";
import { listClientSpins, listAllPrizes, photoUrl } from "../lib/tombola.js";
import { useLang, GOLD, BRONZE, INK, PANEL, CREAM, MUTED } from "../lib/theme.js";
import { useUI } from "../lib/i18n.js";

export default function HistoryScreen({ setScreen }) {
  const { t, lang } = useLang();
  const ui = useUI(lang);
  const { user, profile } = useAuth();

  const [tx, setTx] = useState([]);
  const [spins, setSpins] = useState([]);
  const [prizes, setPrizes] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("points");

  const locale = lang === "ar" ? "ar-MA" : "fr-FR";

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
    { key: "points", label: ui.tabPurchases },
    { key: "lots", label: ui.tabPrizes },
    { key: "materiel", label: ui.tabEquipment },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-6 py-10" dir={t.dir} style={{ backgroundColor: INK, color: CREAM }}>
      <div className="w-full max-w-lg">
        <button onClick={() => setScreen("dashboard")} className="flex items-center gap-2 text-sm mb-6" style={{ color: MUTED }}>
          <ArrowLeft size={16} /> {ui.backToDashboard}
        </button>

        <h1 className="text-xl font-semibold mb-1">{ui.myHistory}</h1>
        <p className="text-sm mb-5" style={{ color: MUTED }}>
          {ui.currentBalance} : <strong style={{ color: GOLD }}>{profile?.loyaltyPoints || 0} {ui.points}</strong> · {ui.totalPurchased} : {totalKg} kg
        </p>

        <div className="flex gap-2 mb-5 flex-wrap">
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

        {loading && <p className="text-sm" style={{ color: MUTED }}>{ui.loading}</p>}

        {!loading && tab === "points" && (
          <div className="flex flex-col gap-2">
            {tx.length === 0 && <p className="text-sm" style={{ color: MUTED }}>{ui.noMovements}</p>}
            {tx.map((x) => {
              const positive = x.points > 0;
              return (
                <div key={x.$id} className="rounded-xl p-3 flex items-center gap-3" style={{ backgroundColor: PANEL, border: `1px solid ${CREAM}1A` }}>
                  <div className="rounded-lg p-2" style={{ backgroundColor: positive ? `${GOLD}22` : `${BRONZE}22` }}>
                    {positive ? <TrendingUp size={16} color={GOLD} /> : <TrendingDown size={16} color={BRONZE} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{x.reason || (positive ? ui.purchase : ui.debit)}</p>
                    <p className="text-xs" style={{ color: MUTED }}>
                      {new Date(x.$createdAt).toLocaleDateString(locale)}
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
            {spins.length === 0 && <p className="text-sm" style={{ color: MUTED }}>{ui.noPrizesWon}</p>}
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
                    <p className="text-sm truncate" style={{ color: GOLD }}>{prize?.label || "—"}</p>
                    <p className="text-xs" style={{ color: MUTED }}>
                      {ui.tier} {s.thresholdPoints} kg · {new Date(s.spunAt).toLocaleDateString(locale)}
                    </p>
                  </div>
                  <span className="text-[10px] rounded-full px-2 py-1 whitespace-nowrap" style={{
                    backgroundColor: s.delivered ? `${CREAM}14` : `${GOLD}22`,
                    color: s.delivered ? MUTED : GOLD,
                    border: `1px solid ${s.delivered ? CREAM + "22" : GOLD + "55"}`,
                  }}>
                    {s.delivered ? ui.delivered : ui.toCollect}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {!loading && tab === "materiel" && (
          <div className="flex flex-col gap-2">
            {equipment.length === 0 && <p className="text-sm" style={{ color: MUTED }}>{ui.noEquipment}</p>}
            {equipment.map((e) => (
              <div key={e.$id} className="rounded-xl p-3 flex items-center gap-3" style={{ backgroundColor: PANEL, border: `1px solid ${CREAM}1A` }}>
                <div className="rounded-lg p-2" style={{ backgroundColor: `${BRONZE}22` }}>
                  <Wrench size={16} color={BRONZE} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{equipmentLabel(e.equipmentType, lang)}</p>
                  <p className="text-xs" style={{ color: MUTED }}>
                    {[e.brand, e.model].filter(Boolean).join(" ") || ui.brandNotSpecified}
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
