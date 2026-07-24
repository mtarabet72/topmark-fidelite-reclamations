import React, { useState, useEffect } from "react";
import { ArrowLeft, MessageSquareWarning } from "lucide-react";
import {
  listAllComplaints,
  listCategories,
  updateComplaint,
  categoryLabel,
  attachmentUrl,
  STATUS_LABELS,
} from "../lib/complaints.js";
import { listClients } from "../lib/purchases.js";
import { useLang, GOLD, BRONZE, INK, PANEL, CREAM, MUTED } from "../lib/theme.js";

const STATUS_ORDER = ["nouveau", "en_cours", "resolu", "rejete"];

export default function AdminComplaintsScreen({ setScreen }) {
  const { t, lang } = useLang();
  const [complaints, setComplaints] = useState([]);
  const [categories, setCategories] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);

  async function refresh() {
    setLoading(true);
    const [comps, cats, cls] = await Promise.all([listAllComplaints(), listCategories(), listClients()]);
    setComplaints(comps);
    setCategories(cats);
    setClients(cls);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  function clientOf(c) {
    return clients.find((x) => x.userId === c.clientId);
  }

  async function handleStatusChange(complaint, newStatus) {
    await updateComplaint(complaint.$id, { status: newStatus });
    setComplaints((prev) => prev.map((c) => (c.$id === complaint.$id ? { ...c, status: newStatus } : c)));
  }

  async function handleSaveResponse(complaint) {
    const text = drafts[complaint.$id];
    if (text === undefined) return;
    setSavingId(complaint.$id);
    await updateComplaint(complaint.$id, { adminResponse: text });
    setComplaints((prev) => prev.map((c) => (c.$id === complaint.$id ? { ...c, adminResponse: text } : c)));
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[complaint.$id];
      return next;
    });
    setSavingId(null);
  }

  const visible = complaints.filter((c) => (filter === "all" ? true : c.status === filter));
  const newCount = complaints.filter((c) => c.status === "nouveau").length;

  const inputStyle = { backgroundColor: INK, border: `1px solid ${CREAM}33`, color: CREAM };

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-6 py-10" dir={t.dir} style={{ backgroundColor: INK, color: CREAM }}>
      <div className="w-full max-w-2xl">
        <button onClick={() => setScreen("admin")} className="flex items-center gap-2 text-sm mb-6" style={{ color: MUTED }}>
          <ArrowLeft size={16} /> Retour
        </button>

        <h1 className="text-xl font-semibold mb-1">Réclamations</h1>
        <p className="text-sm mb-5" style={{ color: MUTED }}>
          {newCount} nouvelle{newCount > 1 ? "s" : ""} réclamation{newCount > 1 ? "s" : ""}
        </p>

        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setFilter("all")}
            className="rounded-full px-4 py-1.5 text-sm"
            style={{
              backgroundColor: filter === "all" ? GOLD : "transparent",
              color: filter === "all" ? INK : CREAM,
              border: `1px solid ${filter === "all" ? GOLD : CREAM + "33"}`,
            }}
          >
            Toutes
          </button>
          {STATUS_ORDER.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="rounded-full px-4 py-1.5 text-sm"
              style={{
                backgroundColor: filter === s ? STATUS_LABELS[s].color : "transparent",
                color: filter === s ? INK : CREAM,
                border: `1px solid ${filter === s ? STATUS_LABELS[s].color : CREAM + "33"}`,
              }}
            >
              {STATUS_LABELS[s].fr}
            </button>
          ))}
        </div>

        {loading && <p className="text-sm" style={{ color: MUTED }}>Chargement…</p>}

        {!loading && visible.length === 0 && (
          <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: PANEL, border: `1px solid ${CREAM}1A` }}>
            <MessageSquareWarning size={28} color={MUTED} className="mx-auto mb-2" />
            <p className="text-sm" style={{ color: MUTED }}>Aucune réclamation à afficher.</p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {visible.map((c) => {
            const cat = categories.find((x) => x.$id === c.categoryId);
            const client = clientOf(c);
            const st = STATUS_LABELS[c.status] || STATUS_LABELS.nouveau;
            const draft = drafts[c.$id];
            return (
              <div key={c.$id} className="rounded-2xl p-4" style={{ backgroundColor: PANEL, border: `1px solid ${st.color}44` }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {client?.companyName || client?.fullName || "Client inconnu"}
                    </p>
                    <p className="text-xs" style={{ color: GOLD }}>{categoryLabel(cat, lang)}</p>
                  </div>
                  <span className="text-[10px] rounded-full px-2 py-1 whitespace-nowrap" style={{ backgroundColor: `${st.color}22`, color: st.color, border: `1px solid ${st.color}55` }}>
                    {st.fr}
                  </span>
                </div>

                <p className="text-sm mb-2">{c.description}</p>

                {c.attachmentFileIds?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {c.attachmentFileIds.map((id) => (
                      <a key={id} href={attachmentUrl(id)} target="_blank" rel="noreferrer">
                        <img src={attachmentUrl(id)} alt="" className="w-16 h-16 rounded-lg object-cover" />
                      </a>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {STATUS_ORDER.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(c, s)}
                      className="rounded-full px-3 py-1 text-xs"
                      style={{
                        backgroundColor: c.status === s ? STATUS_LABELS[s].color : "transparent",
                        color: c.status === s ? INK : MUTED,
                        border: `1px solid ${c.status === s ? STATUS_LABELS[s].color : CREAM + "22"}`,
                      }}
                    >
                      {STATUS_LABELS[s].fr}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={2}
                  placeholder="Répondre au client..."
                  value={draft !== undefined ? draft : c.adminResponse || ""}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [c.$id]: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2 text-sm resize-none mb-2"
                  style={inputStyle}
                />

                {draft !== undefined && draft !== (c.adminResponse || "") && (
                  <button
                    onClick={() => handleSaveResponse(c)}
                    disabled={savingId === c.$id}
                    className="rounded-full px-4 py-1.5 text-xs font-semibold disabled:opacity-60"
                    style={{ backgroundColor: GOLD, color: INK }}
                  >
                    {savingId === c.$id ? "…" : "Envoyer la réponse"}
                  </button>
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
