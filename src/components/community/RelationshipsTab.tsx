"use client";

/**
 * Pestaña "Relaciones" dentro de Comunidad (decisión Eduardo: las relaciones
 * viven dentro de community). Lista las díadas del usuario con su sintonía,
 * permite editar CERCANÍA y tipo, e invitar (el hook de la cadena SIA).
 *
 * Reusa /api/relationships (GET lista, PATCH edita). Antes era la página suelta
 * /relationships; ahora es un tab — una sola entrada "Comunidad".
 */
import { useEffect, useState } from "react";
import { Heart, Send, Loader2, Pencil, Check } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

interface Relationship {
  id: string;
  name: string | null;
  relationType: string;
  closeness: string | null;
  otherJoined: boolean;
  otherSeiDone: boolean;
  attunement: { level: string; step: number; labelKey: string } | null;
}

const RELATION_TYPES = ["partner", "child", "parent", "friend", "colleague", "boss", "other"];
const CLOSENESS = ["Cercano", "Neutral", "Lejano"];

export default function RelationshipsTab() {
  const { t } = useI18n();
  const [list, setList] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);

  // Invitar (el hook)
  const [name, setName] = useState("");
  const [relationType, setRelationType] = useState("friend");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const json = await fetch("/api/relationships", { cache: "no-store" }).then((r) => r.json());
      if (json.ok) setList(json.relationships);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function invite() {
    if (!name.trim()) return;
    setSending(true);
    setInviteUrl(null);
    try {
      const json = await fetch("/api/relationships/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherName: name.trim(), relationType }),
      }).then((r) => r.json());
      if (json.ok && json.inviteUrl) {
        setInviteUrl(json.inviteUrl);
        setName("");
        load();
      }
    } finally {
      setSending(false);
    }
  }

  async function patch(id: string, data: { closeness?: string; relationType?: string }) {
    const json = await fetch("/api/relationships", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    }).then((r) => r.json());
    if (json.ok) {
      setList((l) => l.map((r) => (r.id === id ? { ...r, ...data } : r)));
      setEditing(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Invitar — el hook de la cadena SIA */}
      <div className="rounded-2xl border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] p-4">
        <h3 className="font-semibold text-[var(--rowi-fg)] mb-2 flex items-center gap-2">
          <Send className="w-4 h-4" /> {t("relationships.invite.title", "Invitar a alguien")}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("relationships.invite.name", "Nombre")}
            className="rounded-md border border-[var(--rowi-card-border)] bg-transparent px-3 py-2 text-sm flex-1 min-w-[140px]"
          />
          <select value={relationType} onChange={(e) => setRelationType(e.target.value)} className="rounded-md border border-[var(--rowi-card-border)] bg-transparent px-2 py-2 text-sm">
            {RELATION_TYPES.map((rt) => (
              <option key={rt} value={rt}>{t(`relationships.type.${rt}`, rt)}</option>
            ))}
          </select>
          <button onClick={invite} disabled={sending} className="rowi-btn-primary px-4 py-2 text-sm">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : t("relationships.invite.send", "Generar invitación")}
          </button>
        </div>
        {inviteUrl && (
          <div className="mt-2 text-xs text-[var(--rowi-muted)] break-all">
            {t("relationships.invite.share", "Comparte este enlace:")}{" "}
            <span className="font-mono">{inviteUrl}</span>
          </div>
        )}
      </div>

      {/* Lista de relaciones */}
      {loading ? (
        <p className="text-sm text-[var(--rowi-muted)]">…</p>
      ) : list.length === 0 ? (
        <p className="text-sm text-[var(--rowi-muted)]">
          {t("relationships.empty", "Aún no tienes relaciones. Invita a alguien arriba.")}
        </p>
      ) : (
        <div className="space-y-2">
          {list.map((r) => (
            <div key={r.id} className="rounded-xl border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Heart className="w-4 h-4 text-[var(--rowi-g2)] flex-shrink-0" />
                  <span className="font-medium text-[var(--rowi-fg)] truncate">{r.name || "—"}</span>
                  <span className="text-xs text-[var(--rowi-muted)]">· {t(`relationships.type.${r.relationType}`, r.relationType)}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {r.attunement && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--rowi-chip)] text-[var(--rowi-fg)]">
                      {t(r.attunement.labelKey, r.attunement.level)}
                    </span>
                  )}
                  <button onClick={() => setEditing(editing === r.id ? null : r.id)} className="text-[var(--rowi-muted)] hover:text-[var(--rowi-fg)]">
                    {editing === r.id ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Editor de cercanía + tipo */}
              {editing === r.id && (
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--rowi-card-border)] pt-3">
                  <span className="text-xs text-[var(--rowi-muted)]">{t("relationships.closeness.label", "Cercanía:")}</span>
                  {CLOSENESS.map((c) => (
                    <button
                      key={c}
                      onClick={() => patch(r.id, { closeness: c })}
                      className={`text-xs rounded-full px-3 py-1 border ${
                        r.closeness === c
                          ? "border-[var(--rowi-g2)] text-[var(--rowi-g2)]"
                          : "border-[var(--rowi-card-border)] text-[var(--rowi-muted)]"
                      }`}
                    >
                      {t(`relationships.closeness.${c}`, c)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
