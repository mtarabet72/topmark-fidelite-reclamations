import React, { useState, useEffect } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useAuth } from "../lib/AuthContext.jsx";
import {
  listActivePrizesForRange,
  listClientSpins,
  findAvailableRange,
  findNextLockedRange,
  drawPrize,
  recordSpin,
  photoUrl,
} from "../lib/tombola.js";
import { useLang, GOLD, BRONZE, INK, PANEL, CREAM, MUTED } from "../App.jsx";

const SLICE_COLORS = [GOLD, BRONZE];

export default function WheelScreen({ setScreen }) {
  const { t } = useLang();
  const { user, profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [availableRange, setAvailableRange] = useState(null);
  const [nextLocked, setNextLocked] = useState(null);
  const [prizes, setPrizes] = useState([]);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);

  async function load() {
    setLoading(true);
    const spins = await listClientSpins(user.$id);
    const points = profile?.loyaltyPoints || 0;
    const range = findAvailableRange(points, spins);
    setAvailableRange(range);
    if (range) {
      const list = await listActivePrizesForRange(range.min);
      setPrizes(list);
    } else {
      setNextLocked(findNextLockedRange(points, spins));
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSpin() {
    if (spinning || prizes.length === 0) return;
    const winner = drawPrize(prizes);
    const winnerIndex = prizes.findIndex((p) => p.$id === winner.$id);
    const anglePerSlice = 360 / prizes.length;
    const landingAngle = 360 - (winnerIndex * anglePerSlice + anglePerSlice / 2);
    const extraSpins = 6 * 360;
    const current = rotation % 360;
    const delta = ((landingAngle - current) % 360 + 360) % 360;
    const newRotation = rotation + extraSpins + delta;

    setSpinning(true);
    setRotation(newRotation);

    setTimeout(async () => {
      await recordSpin({ clientId: user.$id, prize: winner, thresholdPoints: availableRange.min });
      setResult(winner);
      setSpinning(false);
    }, 4200);
  }

  const inputPanel = { backgroundColor: PANEL, border: `1px solid ${GOLD}33` };

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-6 py-10" dir={t.dir} style={{ backgroundColor: INK, color: CREAM }}>
      <div className="w-full max-w-md">
        <button onClick={() => setScreen("dashboard")} className="flex items-center gap-2 text-sm mb-6" style={{ color: MUTED }}>
          <ArrowLeft size={16} /> Retour au tableau de bord
        </button>

        <h1 className="text-xl font-semibold mb-1 text-center">Tombola TOP MARK</h1>
        <p className="text-sm mb-6 text-center" style={{ color: MUTED }}>
          Solde actuel : <strong style={{ color: GOLD }}>{profile?.loyaltyPoints || 0} kg cumulés</strong>
        </p>

        {loading && <p className="text-sm text-center" style={{ color: MUTED }}>Chargement…</p>}

        {!loading && !availableRange && !result && (
          <div className="rounded-2xl p-6 text-center" style={inputPanel}>
            <p className="mb-2">Aucun tirage disponible pour le moment.</p>
            {nextLocked ? (
              <p className="text-sm" style={{ color: MUTED }}>
                Encore <strong style={{ color: GOLD }}>{nextLocked.min - (profile?.loyaltyPoints || 0)} kg</strong> à
                acheter pour débloquer le prochain tirage ({nextLocked.min}–{nextLocked.max} kg).
              </p>
            ) : (
              <p className="text-sm" style={{ color: MUTED }}>
                Vous avez atteint tous les paliers disponibles pour l'instant !
              </p>
            )}
          </div>
        )}

        {!loading && availableRange && prizes.length > 0 && !result && (
          <div className="flex flex-col items-center gap-6">
            <p className="text-sm text-center rounded-full px-4 py-2" style={{ backgroundColor: `${GOLD}22`, color: GOLD, border: `1px solid ${GOLD}55` }}>
              Tirage débloqué — palier {availableRange.min}-{availableRange.max} kg 🎉
            </p>

            <div className="relative" style={{ width: 260, height: 260 }}>
              <div
                className="absolute z-10"
                style={{
                  top: -6,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 0,
                  height: 0,
                  borderLeft: "10px solid transparent",
                  borderRight: "10px solid transparent",
                  borderTop: `18px solid ${CREAM}`,
                }}
              />
              <div
                className="rounded-full"
                style={{
                  width: 260,
                  height: 260,
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning ? "transform 4.2s cubic-bezier(0.17, 0.67, 0.16, 0.99)" : "none",
                  background: `conic-gradient(${prizes
                    .map((p, i) => {
                      const start = (360 / prizes.length) * i;
                      const end = (360 / prizes.length) * (i + 1);
                      return `${SLICE_COLORS[i % 2]} ${start}deg ${end}deg`;
                    })
                    .join(", ")})`,
                  border: `4px solid ${CREAM}33`,
                }}
              />
            </div>

            <button
              onClick={handleSpin}
              disabled={spinning}
              className="flex items-center gap-2 rounded-full px-8 py-3 text-sm font-semibold disabled:opacity-60"
              style={{ backgroundColor: GOLD, color: INK }}
            >
              <Sparkles size={16} />
              {spinning ? "Tirage en cours…" : "Tourner la roue"}
            </button>

            <div className="w-full flex flex-col gap-1">
              {prizes.map((p, i) => (
                <div key={p.$id} className="flex items-center gap-2 text-xs" style={{ color: MUTED }}>
                  <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: SLICE_COLORS[i % 2] }} />
                  {p.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {result && (
          <div className="rounded-2xl p-6 text-center flex flex-col items-center gap-3" style={inputPanel}>
            <Sparkles size={32} color={GOLD} />
            <p className="text-lg font-semibold">Félicitations !</p>
            {result.photoFileId && (
              <img src={photoUrl(result.photoFileId)} alt={result.label} className="w-32 h-32 rounded-xl object-cover" />
            )}
            <p style={{ color: GOLD }}>{result.label}</p>
            <p className="text-xs" style={{ color: MUTED }}>
              Contactez votre représentant TOP MARK pour récupérer votre lot.
            </p>
            <button
              onClick={() => setScreen("dashboard")}
              className="rounded-full px-6 py-2.5 text-sm font-semibold mt-2"
              style={{ backgroundColor: GOLD, color: INK }}
            >
              Retour au tableau de bord
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
