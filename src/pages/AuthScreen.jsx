import React, { useState } from "react";
import { useAuth } from "../lib/AuthContext.jsx";
import { useLang, GOLD, BRONZE, INK, PANEL, CREAM, MUTED } from "../lib/theme.js";

const LOCALE_OPTIONS = [
  { value: "fr", label: "Français" },
  { value: "ar", label: "العربية" },
  { value: "zgh", label: "ⵜⴰⵎⴰⵣⵉⵖⵜ" },
];

export default function AuthScreen({ mode, setScreen }) {
  const { t, lang } = useLang();
  const { login, register } = useAuth();
  const isRegister = mode === "register";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [locale, setLocale] = useState(lang);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (isRegister) {
        await register({ fullName, email, password, locale });
      } else {
        await login({ email, password });
      }
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-6"
      dir={t.dir}
      style={{ backgroundColor: INK, color: CREAM }}
    >
      <div className="w-full max-w-sm">
        <button
          onClick={() => setScreen("landing")}
          className="text-sm mb-6"
          style={{ color: MUTED }}
        >
          ← {t.appName}
        </button>

        <div className="rounded-2xl p-6" style={{ backgroundColor: PANEL, border: `1px solid ${GOLD}33` }}>
          <h1 className="text-xl font-semibold mb-1" style={{ color: CREAM }}>
            {isRegister ? t.hero.ctaSecondary : t.hero.cta}
          </h1>
          <p className="text-sm mb-5" style={{ color: MUTED }}>{t.appName} — {t.tagline}</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {isRegister && (
              <input
                type="text"
                required
                placeholder="Nom complet"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="rounded-lg px-4 py-2.5 text-sm focus:outline-none"
                style={{ backgroundColor: INK, border: `1px solid ${CREAM}33`, color: CREAM }}
              />
            )}

            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg px-4 py-2.5 text-sm focus:outline-none"
              style={{ backgroundColor: INK, border: `1px solid ${CREAM}33`, color: CREAM }}
            />

            <input
              type="password"
              required
              minLength={8}
              placeholder="Mot de passe (8 caractères min.)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg px-4 py-2.5 text-sm focus:outline-none"
              style={{ backgroundColor: INK, border: `1px solid ${CREAM}33`, color: CREAM }}
            />

            {isRegister && (
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                className="rounded-lg px-4 py-2.5 text-sm focus:outline-none"
                style={{ backgroundColor: INK, border: `1px solid ${CREAM}33`, color: CREAM }}
              >
                {LOCALE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            )}

            {error && (
              <p className="text-xs" style={{ color: "#E07A5F" }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-full px-6 py-3 text-sm font-semibold mt-2 disabled:opacity-60"
              style={{ backgroundColor: GOLD, color: INK }}
            >
              {submitting ? "…" : isRegister ? t.hero.ctaSecondary : t.hero.cta}
            </button>
          </form>

          <button
            onClick={() => setScreen(isRegister ? "login" : "register")}
            className="text-xs mt-4 w-full text-center"
            style={{ color: BRONZE }}
          >
            {isRegister ? `${t.hero.cta} ?` : `${t.hero.ctaSecondary} ?`}
          </button>
        </div>
      </div>
    </div>
  );
}
