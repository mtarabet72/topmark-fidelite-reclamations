import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "../lib/AuthContext.jsx";
import { equipmentLabel } from "../lib/history.js";
import { useLang, GOLD, BRONZE, INK, PANEL, CREAM, MUTED } from "../lib/theme.js";
import { useUI } from "../lib/i18n.js";

const EQUIPMENT_TYPES = ["presse_cafe", "moulin_barista", "moulin_vrac", "machine_espresso", "autre"];

function emptyItem() {
  return { equipmentType: "presse_cafe", brand: "", model: "", quantity: 1 };
}

export default function TechnicalFileScreen() {
  const { t, lang } = useLang();
  const ui = useUI(lang);
  const { completeTechnicalFile, logout } = useAuth();

  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [items, setItems] = useState([emptyItem()]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateItem(index, field, value) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await completeTechnicalFile({ companyName, address, city, equipmentList: items });
    } catch (err) {
      setError(err.message || ui.errorOccurred);
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = { backgroundColor: INK, border: `1px solid ${CREAM}33`, color: CREAM };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-6 py-10" dir={t.dir} style={{ backgroundColor: INK, color: CREAM }}>
      <div className="w-full max-w-lg">
        <div className="rounded-2xl p-6" style={{ backgroundColor: PANEL, border: `1px solid ${GOLD}33` }}>
          <h1 className="text-xl font-semibold mb-1">{ui.technicalFile}</h1>
          <p className="text-sm mb-5" style={{ color: MUTED }}>{ui.technicalFileIntro}</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-wider" style={{ color: GOLD }}>{ui.contactDetails}</p>
              <input required placeholder={ui.companyName} value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="rounded-lg px-4 py-2.5 text-sm focus:outline-none" style={inputStyle} />
              <input required placeholder={ui.address} value={address} onChange={(e) => setAddress(e.target.value)} className="rounded-lg px-4 py-2.5 text-sm focus:outline-none" style={inputStyle} />
              <input required placeholder={ui.city} value={city} onChange={(e) => setCity(e.target.value)} className="rounded-lg px-4 py-2.5 text-sm focus:outline-none" style={inputStyle} />
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-wider" style={{ color: GOLD }}>{ui.equipmentUsed}</p>

              {items.map((item, index) => (
                <div key={index} className="rounded-xl p-3 flex flex-col gap-2" style={{ border: `1px solid ${CREAM}22` }}>
                  <div className="flex gap-2">
                    <select
                      value={item.equipmentType}
                      onChange={(e) => updateItem(index, "equipmentType", e.target.value)}
                      className="flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none"
                      style={inputStyle}
                    >
                      {EQUIPMENT_TYPES.map((type) => (
                        <option key={type} value={type}>{equipmentLabel(type, lang)}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", e.target.value)}
                      className="w-20 rounded-lg px-3 py-2 text-sm focus:outline-none"
                      style={inputStyle}
                    />
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(index)} className="rounded-lg px-2" style={{ color: BRONZE }}>
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      placeholder={ui.brandOptional}
                      value={item.brand}
                      onChange={(e) => updateItem(index, "brand", e.target.value)}
                      className="flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none"
                      style={inputStyle}
                    />
                    <input
                      placeholder={ui.modelOptional}
                      value={item.model}
                      onChange={(e) => updateItem(index, "model", e.target.value)}
                      className="flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none"
                      style={inputStyle}
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addItem}
                className="flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm"
                style={{ border: `1px dashed ${GOLD}66`, color: GOLD }}
              >
                <Plus size={16} /> {ui.addEquipment}
              </button>
            </div>

            {error && <p className="text-xs" style={{ color: "#E07A5F" }}>{error}</p>}

            <button type="submit" disabled={submitting} className="rounded-full px-6 py-3 text-sm font-semibold disabled:opacity-60" style={{ backgroundColor: GOLD, color: INK }}>
              {submitting ? "…" : ui.validateFile}
            </button>

            <button type="button" onClick={logout} className="text-xs text-center" style={{ color: MUTED }}>
              {ui.logout}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
