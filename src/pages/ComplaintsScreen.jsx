import React, { useState, useEffect } from "react";
import { ArrowLeft, Plus, Paperclip, X, MessageSquareWarning } from "lucide-react";
import { useAuth } from "../lib/AuthContext.jsx";
import {
  listCategories,
  listMyComplaints,
  createComplaint,
  categoryLabel,
  attachmentUrl,
  STATUS_LABELS,
} from "../lib/complaints.js";
import { useLang, GOLD, BRONZE, INK, PANEL, CREAM, MUTED } from "../lib/theme.js";

export default function ComplaintsScreen({ setScreen }) {
  const { t, lang } = useLang();
  const { user } = useAuth();

  const [categories, setCategories] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true);
    const [cats, mine] = await Promise.all([listCategories(), listMyComplaints(user.$id)]);
    setCategories(cats);
    setComplaints(mine);
    if (cats.length > 0 && !categoryId) setCategoryId(cats[0].$id);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addFiles(e) {
    setFiles((prev) => [...prev, ...Array.from(e.target.files)]);
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await createComplaint({ clientId: user.$id, categoryId, description, files });
      setShowForm(false);
      setDescription("");
      setFiles([]);
      refresh();
    } catch (err) {
      setError(err.message || "Erreur lors de l'envoi.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = { backgroundColor: INK, border: `1px solid ${CREAM}33`, color: CREAM };

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-6 py-10" dir={t.dir} style={{ backgroundColor: INK, color: CREAM }}>
      <div className="w-full max-w-lg">
        <button onClick={() => setScreen("dashboard")} className="flex items-center gap-2 text-sm mb-6" style={{ color: MUTED }}>
          <ArrowLeft size={16} /> {t.nav.home}
        </button>

        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-semibold">{t.sections.claimsTitle}</h1>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold"
              style={{ backgroundColor: GOLD, color: INK }}
            >
              <Plus size={16} /> Nouvelle
            </button>
          )}
        </div>

        {showForm && (
          <div className="rounded-2xl p-5 mb-6" style={{ backgroundColor: PANEL, border: `1px solid ${GOLD}44` }}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold">Nouvelle réclamation</p>
              <button onClick={() => setShowForm(false)}><X size={18} color={MUTED} /></button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="rounded-lg px-3 py-2.5 text-sm"
                style={inputStyle}
              >
                {categories.map((c) => (
                  <option key={c.$id} value={c.$id}>{categoryLabel(c, lang)}</option>
                ))}
              </select>

              <textarea
                required
                rows={4}
                placeholder="Décrivez le problème..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-lg px-3 py-2.5 text-sm resize-none"
                style={inputStyle}
              />

              <label
                className="flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm cursor-pointer"
                style={{ border: `1px dashed ${GOLD}66`, color: GOLD }}
              >
                <Paperclip size={16} /> Ajouter des photos
                <input type="file" accept="image/*" multiple onChange={addFiles} className="hidden" />
              </label>

              {files.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {files.map((f, i) => (
                    <div key={i} className="relative">
                      <img src={URL.createObjectURL(f)} alt="" className="w-16 h-16 rounded-lg object-cover" />
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="absolute -top-1 -right-1 rounded-full p-0.5"
                        style={{ backgroundColor: BRONZE }}
                      >
                        <X size={12} color={CREAM} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {error && <p className="text-xs" style={{ color: "#E07A5F" }}>{error}</p>}

              <button type="submit" disabled={submitting} className="rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ backgroundColor: GOLD, color: INK }}>
                {submitting ? "Envoi…" : "Envoyer la réclamation"}
              </button>
            </form>
          </div>
        )}

        {loading && <p className="text-sm" style={{ color: MUTED }}>Chargement…</p>}

        {!loading && complaints.length === 0 && !showForm && (
          <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: PANEL, border: `1px solid ${CREAM}1A` }}>
            <MessageSquareWarning size={28} color={MUTED} className="mx-auto mb-2" />
            <p className="text-sm" style={{ color: MUTED }}>Aucune réclamation pour le moment.</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {complaints.map((c) => {
            const cat = categories.find((x) => x.$id === c.categoryId);
            const st = STATUS_LABELS[c.status] || STATUS_LABELS.nouveau;
            return (
              <div key={c.$id} className="rounded-2xl p-4" style={{ backgroundColor: PANEL, border: `1px solid ${CREAM}1A` }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold" style={{ color: GOLD }}>{categoryLabel(cat, lang)}</p>
                  <span className="text-[10px] rounded-full px-2 py-1" style={{ backgroundColor: `${st.color}22`, color: st.color, border: `1px solid ${st.color}55` }}>
                    {st[lang] || st.fr}
                  </span>
                </div>

                <p className="text-sm mb-2">{c.description}</p>

                {c.attachmentFileIds?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {c.attachmentFileIds.map((id) => (
                      <img key={id} src={attachmentUrl(id)} alt="" className="w-14 h-14 rounded-lg object-cover" />
                    ))}
                  </div>
                )}

                {c.adminResponse && (
                  <div className="rounded-lg p-3 mt-2" style={{ backgroundColor: `${GOLD}14`, border: `1px solid ${GOLD}33` }}>
                    <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: GOLD }}>Réponse TOP MARK</p>
                    <p className="text-sm">{c.adminResponse}</p>
                  </div>
                )}

                <p className="text-xs mt-2" style={{ color: MUTED }}>
                  {new Date(c.$createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
