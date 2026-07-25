import React from "react";
import { useLang, GOLD, INK, CREAM } from "../lib/theme.js";

const LANG_ORDER = ["fr", "ar", "zgh"];
const LANG_LABEL = { fr: "FR", ar: "ع", zgh: "ⵣ" };

export default function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="flex items-center gap-1.5 rounded-full p-1" style={{ border: `1px solid ${GOLD}59` }}>
      {LANG_ORDER.map((code) => {
        const isActive = lang === code;
        return (
          <button
            key={code}
            type="button"
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
