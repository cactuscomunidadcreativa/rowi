"use client";

/**
 * Relaciones — la "lista de vínculos" de la cadena SIA (tab Relaciones de la
 * espina). Lista las díadas del usuario con su nivel de sintonía y permite
 * invitar a alguien (el HOOK) generando un deep link para compartir.
 */
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";

interface Relationship {
  id: string;
  name: string | null;
  relationType: string;
  otherJoined: boolean;
  attunement: { level: string; step: number; labelKey: string } | null;
}

const RELATION_TYPES = ["partner", "child", "parent", "friend", "colleague", "boss", "other"];

export default function RelationshipsPage() {
  const { t, lang } = useI18n();
  const [list, setList] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [relationType, setRelationType] = useState("friend");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function load() {
    const res = await fetch("/api/relationships", { cache: "no-store" });
    const json = await res.json();
    if (json.ok) setList(json.relationships);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function invite() {
    if (!name.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/relationships/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), relationType, locale: lang }),
      });
      const json = await res.json();
      if (json.ok) {
        setInviteUrl(json.inviteUrl);
        setName("");
        load();
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-8">
      <h1 className="text-2xl font-bold text-[var(--rowi-fg)] mb-1">
        {t("relationships.title", "Tus relaciones")}
      </h1>
      <p className="text-sm text-[var(--rowi-muted)] mb-6">
        {t("relationships.subtitle", "Invita a alguien que te importa para ver y mejorar el vínculo.")}
      </p>

      {/* Invitar */}
      <div className="rowi-card mb-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            className="flex-1 rounded-lg border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] px-3 py-2 text-sm"
            placeholder={t("relationships.inviteName", "Nombre")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <select
            className="rounded-lg border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] px-3 py-2 text-sm"
            value={relationType}
            onChange={(e) => setRelationType(e.target.value)}
            aria-label={t("relationships.inviteRelation", "Tipo de relación")}
          >
            {RELATION_TYPES.map((r) => (
              <option key={r} value={r}>
                {t(`relInvite.framing.${r}`, r).split(".")[0].slice(0, 24)}
              </option>
            ))}
          </select>
          <button onClick={invite} disabled={sending || !name.trim()} className="rowi-btn-primary disabled:opacity-40">
            {t("relationships.send", "Crear invitación")}
          </button>
        </div>
        {inviteUrl && (
          <div className="mt-3 text-sm">
            <p className="text-[var(--rowi-muted)] mb-1">{t("relationships.linkReady", "Comparte este enlace:")}</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded bg-[var(--rowi-chip)] px-2 py-1 text-xs">{inviteUrl}</code>
              <button
                onClick={() => navigator.clipboard?.writeText(inviteUrl)}
                className="rowi-btn text-xs"
              >
                {t("relationships.copy", "Copiar enlace")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <p className="text-center text-[var(--rowi-muted)]">…</p>
      ) : list.length === 0 ? (
        <p className="text-center text-[var(--rowi-muted)] py-8">
          {t("relationships.empty", "Aún no tienes relaciones. Invita a tu primera persona.")}
        </p>
      ) : (
        <ul className="space-y-2">
          {list.map((r) => (
            <li key={r.id} className="rowi-card flex items-center justify-between">
              <div>
                <p className="font-medium text-[var(--rowi-fg)]">{r.name || "—"}</p>
                <p className="text-xs text-[var(--rowi-muted)]">
                  {t(`relInvite.framing.${r.relationType}`, r.relationType)}
                </p>
              </div>
              <div className="text-right">
                {r.attunement ? (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5" aria-hidden>
                      {[0, 1, 2, 3].map((i) => (
                        <span
                          key={i}
                          className={`h-1.5 w-3 rounded-full ${
                            i <= r.attunement!.step ? "bg-[var(--rowi-primary)]" : "bg-[var(--rowi-chip)]"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-[var(--rowi-muted)]">{t(r.attunement.labelKey)}</span>
                  </div>
                ) : (
                  <span className="text-xs text-[var(--rowi-muted-weak)]">
                    {t("relationships.pending", "Invitación pendiente")}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
