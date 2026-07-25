import React from "react";
import { Sprout, Coffee, Flame, ImagePlus } from "lucide-react";
import { useLang, GOLD, BRONZE, INK, PANEL, CREAM, MUTED } from "../lib/theme.js";
import { useUI } from "../lib/i18n.js";
import { HISTORY_IMAGES, brandImageUrl } from "../lib/brandImages.js";

function PhotoSlot({ fileId, label, Icon }) {
  const url = brandImageUrl(fileId);
  return (
    <div className="flex-1 min-w-0">
      <div
        className="w-full aspect-square rounded-2xl overflow-hidden flex items-center justify-center relative"
        style={{
          backgroundColor: PANEL,
          border: `1px solid ${GOLD}33`,
        }}
      >
        {url ? (
          <img src={url} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-70">
            <Icon size={28} color={GOLD} />
            <ImagePlus size={14} color={MUTED} />
          </div>
        )}
      </div>
      <p className="text-xs text-center mt-2" style={{ color: MUTED }}>{label}</p>
    </div>
  );
}

export default function HistorySection() {
  const { t, lang } = useLang();
  const ui = useUI(lang);

  return (
    <section className="px-6 py-14 max-w-3xl mx-auto w-full" dir={t.dir}>
      <div className="text-center mb-8">
        <span
          className="text-xs uppercase tracking-[0.2em] rounded-full px-3 py-1 inline-block mb-4"
          style={{ color: GOLD, border: `1px solid ${GOLD}66` }}
        >
          {ui.historyEyebrow}
        </span>
        <h2 className="text-2xl md:text-3xl font-semibold mb-3" style={{ color: CREAM }}>
          {ui.historyTitle}
        </h2>
        <p className="text-sm md:text-base max-w-xl mx-auto leading-relaxed" style={{ color: MUTED }}>
          {ui.historyText}
        </p>
      </div>

      <div className="flex items-center justify-center gap-4 mb-10">
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold" style={{ color: GOLD }}>{ui.since1929}</span>
          <span className="text-xs" style={{ color: MUTED }}>{ui.since1929Label}</span>
        </div>
        <div className="flex-1 max-w-[100px] h-px" style={{ backgroundColor: `${GOLD}55` }} />
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: GOLD }} />
        <div className="flex-1 max-w-[100px] h-px" style={{ backgroundColor: `${GOLD}55` }} />
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold" style={{ color: GOLD }}>{ui.since2016}</span>
          <span className="text-xs" style={{ color: MUTED }}>{ui.since2016Label}</span>
        </div>
      </div>

      <div className="flex gap-3 md:gap-4">
        <PhotoSlot fileId={HISTORY_IMAGES.fields} label={ui.imgFields} Icon={Sprout} />
        <PhotoSlot fileId={HISTORY_IMAGES.beans} label={ui.imgBeans} Icon={Coffee} />
        <PhotoSlot fileId={HISTORY_IMAGES.roasting} label={ui.imgRoasting} Icon={Flame} />
      </div>
    </section>
  );
}
