import React, { useState, useEffect } from "react";
import { ArrowLeft, Sparkles, RotateCcw, Check } from "lucide-react";
import { useAuth } from "../lib/AuthContext.jsx";
import {
  listActivePrizesForRange,
  listClientSpins,
  findAvailableRange,
  findNextLockedRange,
  findPendingSpin,
  drawPrize,
  startSpin,
  retrySpin,
  confirmSpin,
  photoUrl,
  MAX_ATTEMPTS,
} from "../lib/tombola.js";
import { useLang, GOLD, BRONZE, INK, PANEL, CREAM, MUTED } from "../lib/theme.js";
import { useUI } from "../lib/i18n.js";
import LangToggle from "../components/LangToggle.jsx";

const SLICE_COLORS = [GOLD, BRONZE];

export default function WheelScreen({ setScreen }) {
  const { t, lang } = useLang();
  const ui = useUI(lang);
  const { user, profile, refreshSession } = useAuth();

  const [loading, setLoading] = useState(true);
  const [availableRange, setAvailableRange] = useState(null);
  const [nextLocked, setNextLocked] = useState(null);
  const [prizes, setPrizes] = useState([]);
  const [pending, setPending] = useState(null);      // tirage en attente de confirmation
  const [currentPrize, setCurrentPrize] = useState(null); // lot affiché après animation
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [balance, setBalance] = useState(profile?.loyaltyPoints || 0);

  async function load() {
    setLoading(true);
    const spins = await listClientSpins(user.$id);
    const points = profile?.loyaltyPoints || 0;
    setBalance(points);

    const inProgress = findPendingSpin(spins);
    if (inProgress) {
      setPending(inProgress);
      const list = await listActivePrizesForRange(inProgress.thresholdPoints);
      setPrizes(list);
      setCurrentPrize(list.find((p) => p.$id === inProgress.prizeId) || null);
      setAvailableRange({ min: inProgress.thresholdPoints, max: inProgress.thresholdPoints });
      setLoading(false);
      return;
    }

    const range = findAvailableRange(points, spins);
    setAvailableRange(range);
    if (range) {
      const list = await listActivePrizesForRange(range.min);
      setPrizes(list);
    }
    setNextLocked(findNextLockedRange(points, spins));
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function animateTo(prize) {
    const index = prizes.findIndex((p) => p.$id === prize.$id);
    const anglePerSlice = 360 / prizes.length;
    const landing = 360 - (index * anglePerSlice + anglePerSlice / 2);
    const current = rotation % 360;
    const delta = ((landing - current) % 360 + 360) % 360;
    setRotation(rotation + 6 * 360 + delta);
  }

  async function handleSpin() {
    if (spinning || prizes.length === 0 || !profile) return;
    setError("");
    setSpinning(true);
    setCurrentPrize(null);

    const winner = drawPrize(prizes);

    try {
      if (!pending) {
        const created = await startSpin({
          client: profile,
          prize: winner,
          thresholdPoints: availableRange.min,
        });
        setPending(created);
      } else {
        const updated = await retrySpin({ spin: pending, prize: winner });
        setPending(updated);
      }
    } catch (err) {
      setSpinning(false);
      setError(err.message || ui.errorOccurred);
      return;
    }

    animateTo(winner);

    setTimeout(() => {
      setCurrentPrize(winner);
      setSpinning(false);
    }, 4200);
  }

  async function handleConfirm() {
    if (!pending || !profile) return;
    setConfirming(true);
    setError("");
    try {
      await confirmSpin({ client: profile, spin: pending });
      setBalance(0);
      setDone(true);
      if (refreshSession) refreshSession();
    } catch (err) {
      setError(err.message || ui.errorOccurred);
    } finally {
      setConfirming(false);
    }
  }

  const panel = { backgroundColor: PANEL, border: `1px solid ${GOLD}33` };
  const attempts = pending?.attemptNumber || 0;
  const canRetry = attempts > 0 && attempts < MAX_ATTEMPTS;
  const noDrawPossible = !availableRange || prizes.length === 0;

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-6 py-10" dir={t.dir} style={{ backgroundColor: INK, color: CREAM }}>
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <button onClick={() => setScreen("dashboard")} className="flex items-center gap-2 text-sm" style={{ color: MUTED }}>
            <ArrowLeft size={16} /> {ui.backToDashboard}
          </button>
          <LangToggle />
        </div>

        <h1 className="text-xl font-semibold mb-1 text-center">{ui.tombolaTitle}</h1>
        <p className="text-sm mb-6 text-center" style={{ color: MUTED }}>
          {ui.currentBalance} : <strong style={{ color: GOLD }}>{balance} {ui.kgCumulated}</strong>
        </p>

        {loading && <p className="text-sm text-center" style={{ color: MUTED }}>{ui.loading}</p>}

        {/* Écran final après confirmation */}
        {done && currentPrize && (
          <div className="rounded-2xl p-6 text-center flex flex-col items-center gap-3" style={panel}>
            <Sparkles size={32} color={GOLD} />
            <p className="text-lg font-semibold">{ui.congrats}</p>
            {currentPrize.photoFileId && (
              <img src={photoUrl(currentPrize.photoFileId)} alt={currentPrize.label} className="w-32 h-32 rounded-xl object-cover" />
            )}
            <p style={{ color: GOLD }}>{currentPrize.label}</p>
            <p className="text-xs" style={{ color: MUTED }}>{ui.contactRep}</p>
            <button
              onClick={() => setScreen("dashboard")}
              className="rounded-full px-6 py-2.5 text-sm font-semibold mt-2"
              style={{ backgroundColor: GOLD, color: INK }}
            >
              {ui.backToDashboard}
            </button>
          </div>
        )}

        {/* Aucun tirage possible */}
        {!loading && !done && noDrawPossible && (
          <div className="rounded-2xl p-6 text-center" style={panel}>
            <p className="mb-2">
              {availableRange && prizes.length === 0
                ? `${availableRange.min}-${availableRange.max} ${ui.noPrizesConfigured}`
                : ui.noDrawAvailable}
            </p>
            {!availableRange && nextLocked ? (
              <p className="text-sm" style={{ color: MUTED }}>
                {ui.stillNeed} <strong style={{ color: GOLD }}>{nextLocked.min - balance} kg</strong> {ui.toUnlock} ({nextLocked.min}–{nextLocked.max} kg).
              </p>
            ) : !availableRange ? (
              <p className="text-sm" style={{ color: MUTED }}>{ui.allTiersReached}</p>
            ) : null}
          </div>
        )}

        {/* Roue */}
        {!loading && !done && !noDrawPossible && (
          <div className="flex flex-col items-center gap-5">
            {pending ? (
              <p className="text-sm text-center rounded-full px-4 py-2" style={{ backgroundColor: `${GOLD}22`, color: GOLD, border: `1px solid ${GOLD}55` }}>
                {ui.attempt} {attempts} {ui.of} {MAX_ATTEMPTS}
              </p>
            ) : (
              <p className="text-sm text-center rounded-full px-4 py-2" style={{ backgroundColor: `${GOLD}22`, color: GOLD, border: `1px solid ${GOLD}55` }}>
                {ui.drawUnlocked} {availableRange.min}-{availableRange.max} kg 🎉
              </p>
            )}

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

            {/* Résultat provisoire */}
            {currentPrize && !spinning && (
              <div className="w-full rounded-xl p-4 text-center flex flex-col items-center gap-2" style={{ backgroundColor: `${GOLD}14`, border: `1px solid ${GOLD}44` }}>
                {currentPrize.photoFileId && (
                  <img src={photoUrl(currentPrize.photoFileId)} alt="" className="w-20 h-20 rounded-lg object-cover" />
                )}
                <p className="font-semibold" style={{ color: GOLD }}>{currentPrize.label}</p>
                <p className="text-xs" style={{ color: MUTED }}>
                  {canRetry ? ui.confirmWarning : ui.lastAttempt}
                </p>
              </div>
            )}

            {error && <p className="text-xs text-center" style={{ color: "#E07A5F" }}>{error}</p>}

            {/* Boutons d'action */}
            {!currentPrize && (
              <button
                onClick={handleSpin}
                disabled={spinning}
                className="flex items-center gap-2 rounded-full px-8 py-3 text-sm font-semibold disabled:opacity-60"
                style={{ backgroundColor: GOLD, color: INK }}
              >
                <Sparkles size={16} />
                {spinning ? ui.spinning : ui.spinWheel}
              </button>
            )}

            {currentPrize && !spinning && (
              <div className="flex flex-col gap-2 w-full">
                <button
                  onClick={handleConfirm}
                  disabled={confirming}
                  className="flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold disabled:opacity-60"
                  style={{ backgroundColor: GOLD, color: INK }}
                >
                  <Check size={16} />
                  {confirming ? ui.confirming : ui.confirmSpin}
                </button>

                {canRetry && (
                  <button
                    onClick={handleSpin}
                    disabled={spinning || confirming}
                    className="flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold disabled:opacity-60"
                    style={{ border: `1px solid ${CREAM}4D`, color: CREAM }}
                  >
                    <RotateCcw size={16} /> {ui.retrySpin}
                  </button>
                )}
              </div>
            )}

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
      </div>
    </div>
  );
}
