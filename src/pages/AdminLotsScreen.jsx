import React, { useState, useEffect } from "react";
import { ArrowLeft, Plus, Trash2, Pencil, ImagePlus, X } from "lucide-react";
import {
  RANGES,
  listAllPrizes,
  createPrize,
  updatePrize,
  deletePrize,
  uploadLotPhoto,
  photoUrl,
} from "../lib/tombola.js";
import { useLang, GOLD, BRONZE, INK, PANEL, CREAM, MUTED } from "../lib/theme.js";

function rangeLabel(r) {
  return `${r.min} – ${r.max} kg`;
}

function emptyForm(rangeMin) {
  return { $id: null, label: "", rangeMin, probability: "0.33", photoFileId: "", photoFile: null };
}

export default function AdminLotsScreen({ setScreen }) {
  const { t } = useLang();
  const [prizes, setPrizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true);
    const data = await listAllPrizes();
    setPrizes(data);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  function openAdd(rangeMin) {
    setForm(emptyForm(rangeMin));
    setError("");
  }

  function openEdit(prize) {
    setForm({
      $id: prize.$id,
      label: prize.label,
      rangeMin: prize.rangeMin,
      probability: String(prize.probability),
      photoFileId: prize.photoFileId || "",
      photoFile: null,
    });
    setError("");
  }

  async function handleDelete(prize) {
    if (!confirm(`Supprimer le lot "${prize.label}" ?`)) return;
    await deletePrize(prize.$id);
    refresh();
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      let photoFileId = form.photoFileId;
      if (form.photoFile) {
        photoFileId = await uploadLotPhoto(form.photoFile);
      }

      if (form.$id) {
        await updatePrize(form.$id, {
          label: form.label,
          rangeMin: Number(form.rangeMin),
          probability: Number(form.probability),
          photoFileId,
        });
      } else {
        await createPrize({
          label: form.label,
          rangeMin: form.rangeMin,
          probability: form.probability,
          photoFileId,
        });
      }
      setForm(null);
      refresh();
    } catch (err) {
      setError(err.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = { backgroundColor: INK, border: `1px solid ${CREAM}33`, color: CREAM };

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-6 py-10" dir={t.dir} style={{ backgroundColor: INK, color: CREAM }}>
      <div className="w-full max-w-2xl">
        <button onClick={() => setScreen("admin")} className="flex items-center gap-2 text-sm mb-6" style={{ color: MUTED }}>
          <ArrowLeft size={16} /> Retour
        </button>

        <h1 className="text-xl font-semibold mb-1">Lots Tombola</h1>
        <p className="text-sm mb-6" style={{ color: MUTED }}>
          13 tranches, plusieurs lots possibles par tranche (tirage pondéré par probabilité).
        </p>

        {loading && <p className="text-sm" style={{ color: MUTED }}>Chargement…</p>}

        {!loading &&
          RANGES.map((r) => {
            const lotsInRange = prizes.filter((p) => p.rangeMin === r.min);
            return (
              <div key={r.min} className="mb-6 rounded-2xl p-4" style={{ backgroundColor: PANEL, border: `1px solid ${GOLD}22` }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold" style={{ color: GOLD }}>{rangeLabel(r)}</p>
                  <button
                    onClick={() => openAdd(r.min)}
                    className="flex items-center gap-1 text-xs rounded-full px-3 py-1.5"
                    style={{ border: `1px dashed ${GOLD}66`, color: GOLD }}
                  >
                    <Plus size={14} /> Ajouter un lot
                  </button>
                </div>

                {lotsInRange.length === 0 && (
                  <p className="text-xs" style={{ color: MUTED }}>Aucun lot défini pour cette tranche.</p>
                )}

                <div className="flex flex-col gap-2">
                  {lotsInRange.map((p) => (
                    <div key={p.$id} className="flex items-center gap-3 rounded-lg p-2" style={{ border: `1px solid ${CREAM}1A` }}>
                      {p.photoFileId ? (
                        <img src={photoUrl(p.photoFileId)} alt={p.label} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${BRONZE}22` }}>
                          <ImagePlus size={18} color={BRONZE} />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{p.label}</p>
                        <p className="text-xs" style={{ color: MUTED }}>Probabilité relative : {p.probability}</p>
                      </div>
                      <button onClick={() => openEdit(p)} style={{ color: GOLD }}>
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(p)} style={{ color: BRONZE }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

        {form && (
          <div className="fixed inset-0 flex items-center justify-center p-6" style={{ backgroundColor: "#000000CC" }}>
            <div className="w-full max-w-sm rounded-2xl p-5" style={{ backgroundColor: PANEL, border: `1px solid ${GOLD}44` }}>
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold">{form.$id ? "Modifier le lot" : "Nouveau lot"}</p>
                <button onClick={() => setForm(null)}><X size={18} color={MUTED} /></button>
              </div>

              <form onSubmit={handleSave} className="flex flex-col gap-3">
                <select
                  value={form.rangeMin}
                  onChange={(e) => setForm({ ...form, rangeMin: Number(e.target.value) })}
                  className="rounded-lg px-3 py-2 text-sm"
                  style={inputStyle}
                >
                  {RANGES.map((r) => (
                    <option key={r.min} value={r.min}>{rangeLabel(r)}</option>
                  ))}
                </select>

                <input
                  required
                  placeholder="Nom du lot (ex. Mug TOP MARK)"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  className="rounded-lg px-3 py-2 text-sm"
                  style={inputStyle}
                />

                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="1"
                  placeholder="Probabilité (ex. 0.33)"
                  value={form.probability}
                  onChange={(e) => setForm({ ...form, probability: e.target.value })}
                  className="rounded-lg px-3 py-2 text-sm"
                  style={inputStyle}
                />

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setForm({ ...form, photoFile: e.target.files[0] })}
                  className="text-xs"
                  style={{ color: MUTED }}
                />

                {error && <p className="text-xs" style={{ color: "#E07A5F" }}>{error}</p>}

                <button type="submit" disabled={saving} className="rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ backgroundColor: GOLD, color: INK }}>
                  {saving ? "…" : "Enregistrer"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
