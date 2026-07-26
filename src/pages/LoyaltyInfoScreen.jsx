import React from "react";
import { ArrowLeft, Coins, Gift, Sparkles, Package } from "lucide-react";
import { useLang, GOLD, BRONZE, INK, PANEL, CREAM, MUTED } from "../lib/theme.js";
import { useUI } from "../lib/i18n.js";
import LangToggle from "../components/LangToggle.jsx";

export default function LoyaltyInfoScreen({ setScreen }) {
  const { t, lang } = useLang();
  const ui = useUI(lang);

  const steps = [
    { icon: Coins, title: ui.loyaltyStep1Title, desc: ui.loyaltyStep1Desc },
    { icon: Package, title: ui.loyaltyStep2Title, desc: ui.loyaltyStep2Desc },
    { icon: Sparkles, title: ui.loyaltyStep3Title, desc: ui.loyaltyStep3Desc },
    { icon: Gift, title: ui.loyaltyStep4Title, desc: ui.loyaltyStep4Desc },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-6 py-10" dir={t.dir} style={{ backgroundColor: INK, color: CREAM }}>
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <button onClick={() => setScreen("landing")} className="flex items-center gap-2 text-sm" style={{ color: MUTED }}>
            <ArrowLeft size={16} /> {t.nav.home}
          </button>
          <LangToggle />
        </div>

        <div className="text-center mb-8">
          <span
            className="text-xs uppercase tracking-[0.2em] rounded-full px-3 py-1 inline-block mb-4"
            style={{ color: GOLD, border: `1px solid ${GOLD}66` }}
          >
            {t.sections.loyaltyTitle}
          </span>
          <h1 className="text-2xl md:text-3xl font-semibold mb-3">{ui.loyaltyInfoTitle}</h1>
          <p className="text-sm md:text-base" style={{ color: MUTED }}>{ui.loyaltyInfoIntro}</p>
        </div>

        <div className="flex flex-col gap-3 mb-8">
          {steps.map(({ icon: Icon, title, desc }, i) => (
            <div key={i} className="rounded-2xl p-4 flex gap-3" style={{ backgroundColor: PANEL, border: `1px solid ${GOLD}33` }}>
              <div className="rounded-xl p-2.5 h-fit shrink-0" style={{ backgroundColor: `${GOLD}22` }}>
                <Icon size={20} color={GOLD} />
              </div>
              <div>
                <p className="font-semibold mb-1">{title}</p>
                <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => setScreen("register")}
            className="rounded-full px-6 py-3 text-sm font-semibold"
            style={{ backgroundColor: GOLD, color: INK }}
          >
            {t.hero.ctaSecondary}
          </button>
          <button
            onClick={() => setScreen("login")}
            className="rounded-full px-6 py-3 text-sm font-semibold"
            style={{ border: `1px solid ${CREAM}4D`, color: CREAM }}
          >
            {t.hero.cta}
          </button>
        </div>
      </div>
    </div>
  );
}
