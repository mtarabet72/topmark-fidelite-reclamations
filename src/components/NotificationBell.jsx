import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "../lib/AuthContext.jsx";
import { listMyNotifications } from "../lib/notifications.js";
import { GOLD, CREAM } from "../lib/theme.js";

export default function NotificationBell({ setScreen }) {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    listMyNotifications(user.$id)
      .then((list) => setUnread(list.filter((n) => !n.read).length))
      .catch(() => setUnread(0));
  }, [user]);

  return (
    <button
      onClick={() => setScreen("notifications")}
      className="relative flex items-center justify-center rounded-full p-2.5"
      style={{ border: `1px solid ${CREAM}33` }}
    >
      <Bell size={18} color={CREAM} />
      {unread > 0 && (
        <span
          className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-[10px] font-bold"
          style={{ backgroundColor: GOLD, color: "#0D0C09", minWidth: 16, height: 16, padding: "0 3px" }}
        >
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </button>
  );
}
