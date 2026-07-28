import React, { useState, useEffect } from "react";
import { ArrowLeft, Bell, Gift, MessageSquareWarning, Check } from "lucide-react";
import { useAuth } from "../lib/AuthContext.jsx";
import { notificationTitle } from "../lib/notifications.js";
import { secureListNotifications, secureMarkRead, secureMarkAllRead } from "../lib/secureActions.js";
import { useLang, GOLD, BRONZE, INK, PANEL, CREAM, MUTED } from "../lib/theme.js";
import { useUI } from "../lib/i18n.js";
import LangToggle from "../components/LangToggle.jsx";

export default function NotificationsScreen({ setScreen }) {
  const { t, lang } = useLang();
  const ui = useUI(lang);
  const { user } = useAuth();

  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      const list = await secureListNotifications();
      setNotifs(list);
      setError("");
    } catch (err) {
      setError(err.message || "Erreur inconnue");
      setNotifs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleClick(notif) {
    if (notif.read) return;
    await secureMarkRead(notif.$id);
    setNotifs((prev) => prev.map((n) => (n.$id === notif.$id ? { ...n, read: true } : n)));
  }

  async function handleMarkAll() {
    await secureMarkAllRead();
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  const unreadCount = notifs.filter((n) => !n.read).length;
  const locale = lang === "ar" ? "ar-MA" : "fr-FR";

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-6 py-10" dir={t.dir} style={{ backgroundColor: INK, color: CREAM }}>
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <button onClick={() => setScreen("dashboard")} className="flex items-center gap-2 text-sm" style={{ color: MUTED }}>
            <ArrowLeft size={16} /> {ui.backToDashboard}
          </button>
          <LangToggle />
        </div>

        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-semibold">{ui.notifications}</h1>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              className="flex items-center gap-1.5 text-xs rounded-full px-3 py-1.5"
              style={{ border: `1px solid ${GOLD}55`, color: GOLD }}
            >
              <Check size={13} /> {ui.markAllRead}
            </button>
          )}
        </div>

        {loading && <p className="text-sm" style={{ color: MUTED }}>{ui.loading}</p>}

        {error && (
          <p className="text-xs mb-3 rounded-lg p-3" style={{ color: "#E07A5F", backgroundColor: "#E07A5F1A", border: "1px solid #E07A5F44" }}>
            {error}
          </p>
        )}

        {!loading && !error && notifs.length === 0 && (
          <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: PANEL, border: `1px solid ${CREAM}1A` }}>
            <Bell size={28} color={MUTED} className="mx-auto mb-2" />
            <p className="text-sm" style={{ color: MUTED }}>{ui.noNotifications}</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {notifs.map((n) => {
            const Icon = n.relatedType === "loyalty" ? Gift : MessageSquareWarning;
            const accent = n.relatedType === "loyalty" ? GOLD : BRONZE;
            return (
              <button
                key={n.$id}
                onClick={() => handleClick(n)}
                className="rounded-2xl p-4 flex items-start gap-3 text-left"
                style={{
                  backgroundColor: n.read ? PANEL : `${GOLD}0F`,
                  border: `1px solid ${n.read ? CREAM + "1A" : GOLD + "44"}`,
                }}
              >
                <div className="rounded-lg p-2 shrink-0" style={{ backgroundColor: `${accent}22` }}>
                  <Icon size={16} color={accent} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ fontWeight: n.read ? 400 : 600 }}>
                    {notificationTitle(n, lang)}
                  </p>
                  <p className="text-xs mt-1" style={{ color: MUTED }}>
                    {new Date(n.$createdAt).toLocaleDateString(locale)}
                  </p>
                </div>
                {!n.read && (
                  <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: GOLD }} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
