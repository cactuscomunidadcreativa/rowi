"use client";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/react";

type Scope = "super" | "eq" | "community" | "affinity" | "eco";
type Msg = { role: "yo" | "rowi"; text: string };

const SUGGESTIONS: Record<Scope, string[]> = {
  super: ["Quiero trabajar mi IE", "Necesito un plan con alguien", "Ayúdame a redactar un WhatsApp"],
  eq: ["Me siento…", "En el cuerpo noto…", "Creo que es por…"],
  community: ["¿Qué novedades hay?", "Invitar más gente", "Pedir SEI de nuevo"],
  affinity: ["Acercarme a …", "Plan con el equipo", "Conversación difícil"],
  eco: ["WhatsApp corto", "Email 3 párrafos", "Guion para 1:1"],
};

export default function ChatDock({
  scope = "super",
  seed = "",
  title,
  subtitle,
}: {
  scope?: Scope;
  seed?: string;
  title?: string;
  subtitle?: string;
}) {
  const { t } = useI18n();
  const [input, setInput] = useState(seed);
  const [loading, setLoading] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);

  // Idioma global desde <html data-lang>
  const locale =
    (typeof document !== "undefined"
      ? (document.documentElement.getAttribute("data-lang") as "es" | "en" | "pt" | "it" | null)
      : null) || "es";

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  // 🔹 Saludo inicial (en idioma actual)
  useEffect(() => {
    (async () => {
      setLoading(true);
      const r = await fetch("/api/rowi", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale }),
      }).catch(() => null);
      const j = r && r.ok ? await r.json() : null;
      setLoading(false);
      if (j?.coach) {
        const lines = [j.coach.pause, ...(j.coach.questions || [])].filter(Boolean);
        if (lines.length) setMsgs(lines.map((t: string) => ({ role: "rowi", text: t })));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  async function send(override?: string) {
    const ask = (override ?? input).trim();
    if (!ask) return;
    setMsgs((m) => [...m, { role: "yo", text: ask }]);
    setInput("");
    setLoading(true);
    const r = await fetch("/api/rowi", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scope, ask, locale }),
    }).catch(() => null);
    const j = r && r.ok ? await r.json() : null;
    setLoading(false);

    if (j?.coach) {
      const lines = [j.coach.pause, ...(j.coach.questions || [])].filter(Boolean);
      if (lines.length)
        setMsgs((m) => [...m, ...lines.map((t: string) => ({ role: "rowi", text: t }))]);
    }

    if (j?.handoff) {
      const name =
        j.handoff === "super"
          ? t("chat.rowi.super") || "Super Rowi"
          : j.handoff === "eq"
          ? t("chat.rowi.eq") || "Rowi IE"
          : j.handoff === "community"
          ? t("chat.rowi.community") || "Rowi Comunidad"
          : j.handoff === "affinity"
          ? t("chat.rowi.affinity") || "Rowi Afinidad"
          : t("chat.rowi.eco") || "Rowi Comunicación";

      setMsgs((m) => [
        ...m,
        {
          role: "rowi",
          text:
            t("chat.handoff", { name }) ||
            `Esto lo ve mejor ${name}. Puedes abrir su módulo y seguimos allí ✨`,
        },
      ]);
    }
  }

  const sug = SUGGESTIONS[scope] || SUGGESTIONS.super;

  return (
    <div className="relative rounded-2xl border border-white/15 bg-white/[0.06] p-3 shadow-sm">
      {/* borde fantasma */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-20 [mask-image:linear-gradient(#000,transparent)]">
        <div
          className="absolute inset-0 rounded-2xl blur-md"
          style={{ background: "linear-gradient(90deg,#d797cf33,#31a2e333)" }}
        />
      </div>

      <div className="relative z-10 space-y-2">
        {/* header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="bg-gradient-to-r from-[#d797cf] to-[#31a2e3] bg-clip-text text-base font-semibold text-transparent">
              {title ??
                (scope === "super"
                  ? "Rowi Coach"
                  : scope === "eq"
                  ? "Rowi · Inteligencia Emocional"
                  : scope === "community"
                  ? "Rowi · Comunidad"
                  : scope === "affinity"
                  ? "Rowi · Afinidad"
                  : "Rowi · Comunicación")}
            </div>
            <div className="text-[11px] text-gray-400">
              {subtitle || t("chat.subtitle") || "Conversación limpia y amable."}
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400"></span>
            {t("chat.online") || "online"}
          </span>
        </div>

        {/* box de chat */}
        <div
          ref={boxRef}
          className="mt-1 h-[62vh] min-h-[18rem] w-full overflow-auto rounded-xl border border-white/10 bg-white/[0.04] p-3"
        >
          {msgs.map((m, i) => (
            <Bubble key={i} role={m.role} text={m.text} />
          ))}
          {loading && <Typing />}
        </div>

        {/* sugerencias rápidas */}
        <div className="flex flex-wrap gap-2">
          {sug.map((s) => (
            <button
              key={s}
              className="rounded-full border border-white/20 bg-white/10 px-2 py-1 text-[11px] hover:border-white/40"
              onClick={() => send(s)}
            >
              {s}
            </button>
          ))}
        </div>

        {/* input */}
        <div className="flex items-center gap-2">
          <input
            className="flex-1 rounded-md border border-white/15 bg-white/[0.03] px-3 py-2 text-sm outline-none placeholder:text-gray-500"
            placeholder={t("chat.placeholder") || "Escribe aquí… Enter para enviar"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button
            className="rounded-full px-4 py-2 text-xs text-white shadow-sm"
            style={{ background: "linear-gradient(90deg,#d797cf,#31a2e3)" }}
            onClick={() => send()}
          >
            {t("chat.send") || "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ======= subcomponentes ======= */
function Bubble({ role, text }: { role: "yo" | "rowi"; text: string }) {
  const { t } = useI18n();
  const mine = role === "yo";
  return (
    <div className={`mb-2 flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] rounded-2xl border p-3 text-sm leading-relaxed shadow-sm ${
          mine
            ? "border-white/20 bg-gradient-to-br from-white/15 to-white/5 text-white"
            : "border-white/10 bg-white/8 text-gray-200"
        }`}
      >
        <div className={`mb-1 text-[10px] ${mine ? "text-gray-300" : "text-gray-400"}`}>
          {mine ? t("chat.you") || "Tú" : "Rowi"}
        </div>
        <div className="whitespace-pre-line">{text}</div>
      </div>
    </div>
  );
}

function Typing() {
  const { t } = useI18n();
  return (
    <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
      <span className="inline-flex h-5 items-center justify-center gap-1 rounded-full border border-white/15 bg-white/10 px-2">
        <Dot /> <Dot delay="150ms" /> <Dot delay="300ms" />
      </span>
      {t("chat.typing") || "Rowi está pensando…"}
    </div>
  );
}

function Dot({ delay = "0ms" }: { delay?: string }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-gray-300"
      style={{ animationDelay: delay }}
    />
  );
}