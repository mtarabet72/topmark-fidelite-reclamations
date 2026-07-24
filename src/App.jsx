import React, { useState, useEffect, createContext, useContext } from "react";
import { Globe2, Gift, MessageSquareWarning, UserCircle2, Download, WifiOff, ShieldCheck, ChevronRight, ChevronLeft } from "lucide-react";
import { useAuth } from "./lib/AuthContext.jsx";
import AuthScreen from "./pages/AuthScreen.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import TechnicalFileScreen from "./pages/TechnicalFileScreen.jsx";
import AdminPurchaseScreen from "./pages/AdminPurchaseScreen.jsx";
import WheelScreen from "./pages/WheelScreen.jsx";
import AdminLotsScreen from "./pages/AdminLotsScreen.jsx";

const translations = {
  fr: {
    dir: "ltr",
    appName: "TOP MARK",
    tagline: "Distribution sarl",
    nav: { home: "Accueil", loyalty: "Fidélité", claims: "Réclamations", profile: "Profil" },
    hero: {
      eyebrow: "Espace client",
      welcome: "Bienvenue chez vous",
      subtitle: "Cumulez des points à chaque commande, tournez la roue et suivez vos réclamations en temps réel.",
      cta: "Se connecter",
      ctaSecondary: "Créer un compte",
    },
    badges: { installable: "Installable", offline: "Hors ligne", secure: "Données sécurisées" },
    sections: {
      loyaltyTitle: "Programme Fidélité",
      loyaltyDesc: "Points, historique d'achats et roue de la fortune.",
      claimsTitle: "Réclamations",
      claimsDesc: "Signalez un problème, suivez le ticket en direct.",
      comingSoon: "Phase suivante",
    },
    footer: "TOP MARK Distribution sarl — Maroc",
    langSwitch: "العربية",
  },
  ar: {
    dir: "rtl",
    appName: "TOP MARK",
    tagline: "توب مارك للتوزيع ش.ذ.م.م",
    nav: { home: "الرئيسية", loyalty: "الولاء", claims: "الشكاوى", profile: "الملف الشخصي" },
    hero: {
      eyebrow: "فضاء العملاء",
      welcome: "مرحباً بكم في فضائكم",
      subtitle: "اجمعوا النقاط مع كل طلبية، أديروا العجلة، وتابعوا شكاواكم لحظة بلحظة.",
      cta: "تسجيل الدخول",
      ctaSecondary: "إنشاء حساب",
    },
    badges: { installable: "قابل للتثبيت", offline: "بدون اتصال", secure: "بيانات آمنة" },
    sections: {
      loyaltyTitle: "برنامج الولاء",
      loyaltyDesc: "النقاط، سجل المشتريات وعجلة الحظ.",
      claimsTitle: "الشكاوى",
      claimsDesc: "أبلغوا عن مشكلة وتابعوا التذكرة مباشرة.",
      comingSoon: "المرحلة القادمة",
    },
    footer: "TOP MARK Distribution sarl — المغرب",
    langSwitch: "Français",
  },
  zgh: {
    dir: "ltr",
    appName: "TOP MARK",
    tagline: "ⵜⵓⴱ ⵎⴰⵔⴽ ⴰⵣⴻⴳⴳⴰⵖ",
    nav: { home: "ⴰⵙⴰⵜⵉⵍ", loyalty: "ⴰⵎⵓⵢⴰ", claims: "ⵜⵉⵖⵓⵔⵉⵡⵉⵏ", profile: "ⴰⵎⵢⴰⵡⴰⵙ" },
    hero: {
      eyebrow: "ⴰⵙⴰⵜⵉⵍ ⵏ ⵢⵉⵎⵙⴰⵖⵏ",
      welcome: "ⴰⵏⵙⵓⴼ ⵖⵔ ⵓⵙⵎⵎⵓⵜⵜⴳ ⵏⵏⵓⵏ",
      subtitle: "ⵙⵎⵓⵜⵜⴳ ⵜⵉⵏⵇⵇⵉⴹⵉⵏ ⵙ ⵢⴰⵜ ⵜⵓⵜⵜⵔⴰ, ⵙⵙⵓⴼⵖ ⴰⴼⵕⴰⴷ, ⵜⵟⵟⴼ ⵜⵉⵖⵓⵔⵉⵡⵉⵏ ⵏⵏⵓⵏ ⴷⵖⵉ.",
      cta: "ⴽⵛⵎ",
      ctaSecondary: "ⵙⵏⵓⵍⴼⵓ ⴰⵎⵢⴰⵡⴰⵙ",
    },
    badges: { installable: "ⵢⵣⴹⴰⵕ ⴰⴷ ⵉⵜⵜⵓⵙⴱⴰⴷⴰ", offline: "ⴱⵍⴰ ⴰⵔⵎⵢⴰⵙⴰ", secure: "ⵉⵙⴼⴽⴰ ⵢⴰⵎⵓⵏⵏ" },
    sections: {
      loyaltyTitle: "ⴰⵙⵏⴼⴰⵔ ⵏ ⵓⵎⵓⵢⴰ",
      loyaltyDesc: "ⵜⵉⵏⵇⵇⵉⴹⵉⵏ, ⴰⵎⵣⵔⵓⵢ ⴷ ⵓⴼⵕⴰⴷ ⵏ ⵍⵇⴰⴹ.",
      claimsTitle: "ⵜⵉⵖⵓⵔⵉⵡⵉⵏ",
      claimsDesc: "ⵎⵍ ⴰⵎⵛⵛⵓⵎ, ⵟⵟⴼ ⵜⵉⵜⴰⵔⴳⵉⵜ ⴷⵖⵉ.",
      comingSoon: "ⴰⵙⴱⴰⴷⴷⵓ ⵉⵜⵜⴰⵍⵉⵏ",
    },
    footer: "TOP MARK Distribution sarl — ⵍⵎⵖⵔⵉⴱ",
    langSwitch: "ⵜⴰⵎⴰⵣⵉⵖⵜ",
  },
};

const LANG_ORDER = ["fr", "ar", "zgh"];
const LANG_LABEL = { fr: "FR", ar: "ع", zgh: "ⵣ" };
const FONT_BY_LANG = { fr: "var(--font-body)", ar: "var(--font-ar)", zgh: "var(--font-zgh)" };
const DISPLAY_FONT_BY_LANG = { fr: "var(--font-display)", ar: "var(--font-ar)", zgh: "var(--font-zgh)" };

import { GOLD, BRONZE, INK, PANEL, CREAM, MUTED, LangContext, useLang } from "./lib/theme.js";

function BrandMark({ size = 120, opacity = 1, ringOnly = false }) {
  const id = React.useId ? React.useId() : "bm";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ opacity }}>
      <defs>
        <linearGradient id={`g-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={GOLD} />
          <stop offset="100%" stopColor={BRONZE} />
        </linearGradient>
      </defs>
      {!ringOnly && (
        <circle cx="50" cy="50" r="30" fill="none" stroke={`url(#g-${id})`} strokeWidth="1.4" />
      )}
      <ellipse cx="50" cy="52" rx="46" ry="12" fill="none" stroke={`url(#g-${id})`} strokeWidth="3" transform="rotate(-8 50 52)" />
      {!ringOnly && (
        <>
          <path d="M26 34c6-4 14-6 24-6s18 2 24 6" fill="none" stroke={GOLD} strokeWidth="0.8" opacity="0.6" />
          <path d="M24 60c8 5 16 7 26 7s18-2 26-7" fill="none" stroke={GOLD} strokeWidth="0.8" opacity="0.6" />
        </>
      )}
    </svg>
  );
}

function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="flex items-center gap-1.5 rounded-full p-1" style={{ border: `1px solid ${GOLD}59` }}>
      {LANG_ORDER.map((code) => {
        const isActive = lang === code;
        return (
          <button
            key={code}
            onClick={() => setLang(code)}
            className="rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2"
            style={{ color: isActive ? INK : CREAM, backgroundColor: isActive ? GOLD : "transparent" }}
            aria-pressed={isActive}
          >
            {LANG_LABEL[code]}
          </button>
        );
      })}
    </div>
  );
}

function NavShell({ active, setActive }) {
  const { t } = useLang();
  const items = [
    { key: "home", label: t.nav.home, icon: Globe2 },
    { key: "loyalty", label: t.nav.loyalty, icon: Gift },
    { key: "claims", label: t.nav.claims, icon: MessageSquareWarning },
    { key: "profile", label: t.nav.profile, icon: UserCircle2 },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 flex justify-around py-2 md:static md:justify-start md:gap-1 md:py-0" style={{ backgroundColor: PANEL, borderTop: `1px solid ${GOLD}33` }}>
      {items.map(({ key, label, icon: Icon }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => setActive(key)}
            className="flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-none md:rounded-full text-xs md:text-sm transition-colors focus:outline-none focus-visible:ring-2"
            style={{ color: isActive ? GOLD : MUTED, backgroundColor: isActive ? `${GOLD}1F` : "transparent", fontWeight: isActive ? 600 : 400 }}
          >
            <Icon size={18} strokeWidth={isActive ? 2.4 : 1.8} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function StatusBadges() {
  const { t } = useLang();
  const items = [
    { icon: Download, label: t.badges.installable },
    { icon: WifiOff, label: t.badges.offline },
    { icon: ShieldCheck, label: t.badges.secure },
  ];
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {items.map(({ icon: Icon, label }, i) => (
        <span key={i} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs" style={{ backgroundColor: `${CREAM}0F`, color: MUTED, border: `1px solid ${CREAM}1F` }}>
          <Icon size={13} />
          {label}
        </span>
      ))}
    </div>
  );
}

function PlaceholderCard({ title, desc, icon: Icon, accent }) {
  const { t, lang } = useLang();
  const Chevron = lang === "ar" ? ChevronLeft : ChevronRight;
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ backgroundColor: PANEL, border: `1px solid ${accent}33` }}>
      <div className="flex items-center justify-between">
        <div className="rounded-xl p-2.5" style={{ backgroundColor: `${accent}22` }}>
          <Icon size={20} color={accent} />
        </div>
        <span className="text-[10px] uppercase tracking-wider rounded-full px-2 py-1" style={{ color: accent, border: `1px solid ${accent}55` }}>
          {t.sections.comingSoon}
        </span>
      </div>
      <div>
        <h3 className="font-semibold mb-1" style={{ color: CREAM, fontFamily: DISPLAY_FONT_BY_LANG[lang] }}>{title}</h3>
        <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{desc}</p>
      </div>
      <div className="flex items-center gap-1 text-sm mt-auto" style={{ color: accent }}>
        <Chevron size={16} />
      </div>
    </div>
  );
}

function AppShell({ setScreen }) {
  const { t, lang } = useLang();
  const [active, setActive] = useState("home");

  return (
    <div className="min-h-screen w-full flex flex-col" dir={t.dir} lang={lang} style={{ backgroundColor: INK, fontFamily: FONT_BY_LANG[lang], color: CREAM }}>
      <header className="flex items-center justify-between px-5 py-4 md:px-10" style={{ borderBottom: `1px solid ${GOLD}26` }}>
        <div className="flex items-center gap-3">
          <BrandMark size={36} />
          <div className="flex flex-col leading-none">
            <span className="text-lg font-bold tracking-wide" style={{ fontFamily: DISPLAY_FONT_BY_LANG[lang], color: CREAM }}>{t.appName}</span>
            <span className="text-[10px] italic" style={{ color: GOLD }}>{t.tagline}</span>
          </div>
        </div>
        <div className="hidden md:block">
          <NavShell active={active} setActive={setActive} />
        </div>
        <LangToggle />
      </header>

      <section className="relative overflow-hidden px-6 py-14 md:py-20 flex flex-col items-center text-center gap-5">
        <div className="absolute pointer-events-none" style={{ top: "-50px", [lang === "ar" ? "left" : "right"]: "-50px" }}>
          <BrandMark size={240} opacity={0.07} ringOnly />
        </div>
        <div className="absolute pointer-events-none" style={{ bottom: "-70px", [lang === "ar" ? "right" : "left"]: "-70px" }}>
          <BrandMark size={200} opacity={0.06} />
        </div>

        <span className="text-xs uppercase tracking-[0.2em] rounded-full px-3 py-1" style={{ color: GOLD, border: `1px solid ${GOLD}66` }}>{t.hero.eyebrow}</span>
        <h1 className="text-3xl md:text-5xl font-semibold max-w-xl leading-tight" style={{ fontFamily: DISPLAY_FONT_BY_LANG[lang], color: CREAM }}>{t.hero.welcome}</h1>
        <p className="max-w-md text-sm md:text-base" style={{ color: MUTED }}>{t.hero.subtitle}</p>

        <div className="flex flex-wrap gap-3 justify-center mt-2">
          <button onClick={() => setScreen("login")} className="rounded-full px-6 py-3 text-sm font-semibold transition-transform hover:scale-[1.02] focus:outline-none focus-visible:ring-2" style={{ backgroundColor: GOLD, color: INK }}>{t.hero.cta}</button>
          <button onClick={() => setScreen("register")} className="rounded-full px-6 py-3 text-sm font-semibold focus:outline-none focus-visible:ring-2" style={{ border: `1px solid ${CREAM}4D`, color: CREAM }}>{t.hero.ctaSecondary}</button>
        </div>

        <div className="mt-4">
          <StatusBadges />
        </div>
      </section>

      <section className="px-6 pb-24 md:pb-16 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto w-full">
        <PlaceholderCard title={t.sections.loyaltyTitle} desc={t.sections.loyaltyDesc} icon={Gift} accent={GOLD} />
        <PlaceholderCard title={t.sections.claimsTitle} desc={t.sections.claimsDesc} icon={MessageSquareWarning} accent={BRONZE} />
      </section>

      <footer className="hidden md:block text-center text-xs py-4" style={{ color: `${MUTED}99` }}>{t.footer}</footer>

      <div className="md:hidden">
        <NavShell active={active} setActive={setActive} />
      </div>
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState("fr");
  const [screen, setScreen] = useState("landing");
  const t = translations[lang];
  const { user, profile, isAdmin, loading } = useAuth();

  useEffect(() => {
    const link1 = document.createElement("link");
    link1.rel = "stylesheet";
    link1.href = "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;700&family=Inter:wght@400;500;600&family=Noto+Kufi+Arabic:wght@400;600;700&family=Noto+Sans+Tifinagh:wght@400;700&display=swap";
    document.head.appendChild(link1);

    const style = document.createElement("style");
    style.innerHTML = `
      :root {
        --font-display: 'Bricolage Grotesque', sans-serif;
        --font-body: 'Inter', sans-serif;
        --font-ar: 'Noto Kufi Arabic', sans-serif;
        --font-zgh: 'Noto Sans Tifinagh', sans-serif;
      }
      @media (prefers-reduced-motion: reduce) {
        * { transition: none !important; animation: none !important; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(link1);
      document.head.removeChild(style);
    };
  }, []);

  let content;
  if (loading) {
    content = <div style={{ minHeight: "100vh", backgroundColor: INK }} />;
  } else if (user) {
    if (isAdmin && !profile) {
      if (screen === "admin-lots") {
        content = <AdminLotsScreen setScreen={setScreen} />;
      } else {
        content = <AdminPurchaseScreen standalone setScreen={setScreen} />;
      }
    } else if (profile && !profile.technicalFileCompleted) {
      content = <TechnicalFileScreen />;
    } else if (screen === "admin-lots" && isAdmin) {
      content = <AdminLotsScreen setScreen={setScreen} />;
    } else if (screen === "admin" && isAdmin) {
      content = <AdminPurchaseScreen setScreen={setScreen} />;
    } else if (screen === "tombola") {
      content = <WheelScreen setScreen={setScreen} />;
    } else {
      content = <Dashboard setScreen={setScreen} />;
    }
  } else if (screen === "login" || screen === "register") {
    content = <AuthScreen mode={screen} setScreen={setScreen} />;
  } else {
    content = <AppShell setScreen={setScreen} />;
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {content}
    </LangContext.Provider>
  );
}
