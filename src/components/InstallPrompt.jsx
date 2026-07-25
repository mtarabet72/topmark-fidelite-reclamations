import React, { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { useLang, GOLD, INK, PANEL, CREAM, MUTED } from "../lib/theme.js";
import { useUI } from "../lib/i18n.js";

export default function InstallPrompt() {
  const { lang } = useLang();
  const ui = useUI(lang);

  const [deferred, setDeferred] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    // Déjà installée ?
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    setStandalone(isStandalone);

    // iOS ne supporte pas beforeinstallprompt : on affiche une consigne manuelle
    const ua = window.navigator.userAgent.toLowerCase();
    setIsIos(/iphone|ipad|ipod/.test(ua));

    function onPrompt(e) {
      e.preventDefault();
      setDeferred(e);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  async function handleInstall() {
    if (!deferred) return;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") setDismissed(true);
    setDeferred(null);
  }

  if (standalone || dismissed) return null;
  if (!deferred && !isIos) return null;

  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-3"
      style={{ backgroundColor: PANEL, border: `1px solid ${GOLD}44` }}
    >
      <div className="rounded-xl p-2.5" style={{ backgroundColor: `${GOLD}22` }}>
        <Download size={20} color={GOLD} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{ui.installApp}</p>
        <p className="text-xs" style={{ color: MUTED }}>
          {isIos && !deferred ? ui.installIosHint : ui.installHint}
        </p>
      </div>

      {deferred && (
        <button
          onClick={handleInstall}
          className="rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap"
          style={{ backgroundColor: GOLD, color: INK }}
        >
          {ui.installApp}
        </button>
      )}

      <button onClick={() => setDismissed(true)} aria-label="Fermer">
        <X size={16} color={MUTED} />
      </button>
    </div>
  );
}
