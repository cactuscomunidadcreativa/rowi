"use client";
import { useI18n } from "@/lib/i18n/react";
// src/components/shared/ChatDock.tsx
import { useEffect, useRef, useState, useMemo } from "react";

type Scope = "super" | "eq" | "community" | "affinity" | "eco";

type Msg = { role: "yo" | "rowi"; text: string };

const SUGGESTIONS: Record<Scope, string[]> = {
  super: [
    "Quiero trabajar mi IE",
    "Necesito un plan con alguien",
    "Ayúdame a redactar un WhatsApp",
  ],
  eq: ["Me siento…", "En el cuerpo noto…", "Creo que es por…"],
  community: ["¿Qué novedades hay?", "Quiero invitar gente", "Pedir SEI de nuevo"],
  affinity: ["Quiero acercarme a…", "Necesito plan con el equipo", "Conversación difícil"],
  eco: ["WhatsApp corto", "Email de 3 párrafos", "Guion para 1:1"],
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
  const { locale, t } = useI18n();
  const [input, setInput] = useState(seed);
  const [loading, setLoading] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);

  // auto-scroll
  useEffect(() => {
    boxRef.current?.scrollTo({
      top: boxRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [msgs]);

  // saludo inicial (Super Rowi o especialista)
  useEffect(() => {
    (async () => {
      setLoading(true);
      const r = await fetch("/api/rowi", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}), // sin intent/ask -> saludo natural
      }).catch(() => null);
      const j = r && r.ok ? await r.json() : null;
      setLoading(false);
      if (j?.coach) {
        const text = [j.coach.pause, ...(j.coach.questions || [])]
          .filter(Boolean)
          .join("\n\n");
        if (text) setMsgs([{ role: "rowi", text }]);
      }
    })();
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
      body: JSON.stringify({ scope, ask }),
    }).catch(() => null);
    const j = r && r.ok ? await r.json() : null;
    setLoading(false);
    if (j?.coach) {
      const text = [j.coach.pause, ...(j.coach.questions || [])]
        .filter(Boolean)
        .join("\n\n");
      if (text) setMsgs((m) => [...m, { role: "rowi", text }]);
    }
    if (j?.handoff) {
      const to =
        j.handoff === "super"
          ? "Super Rowi"
          : j.handoff === "eq"
          ? "Rowi IE"
          : j.handoff === "community"
          ? "Rowi Comunidad"
          : j.handoff === "affinity"
          ? "Rowi Afinidad"
          : "Rowi Comunicación";
      setMsgs((m) => [
        ...m,
        {
          role: "rowi",
          text: `Esto lo ve mejor ${to}. Puedes abrir su módulo y seguimos allí ✨`,
        },
      ]);
    }
  }

  const sug = SUGGESTIONS[scope] || SUGGESTIONS.super;

  return (
    <div className="rowi-card">
      {/* borde animado sutil */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-20 [mask-image:linear-gradient(#000,transparent)]">
        <div className="absolute inset-0 rounded-2xl blur-md"
             style={{background:"linear-gradient(90deg,#d797cf33,#31a2e333)"}} />
      </div>

      <div className="relative z-10 space-y-1">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">
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
            <div className="text-xs text-gray-400">
              {subtitle ?? "Conversación limpia, enfocada y amable."}
            </div>
          </div>
          {/* puntito de estado */}
          <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            online
          </span>
        </div>

        <div
          ref={boxRef}
          className="mt-2 h-[60vh] min-h-[18rem] w-full overflow-auto rounded-xl border   p-3"
        >
          {msgs.map((m, i) => (
            <Bubble key={i} role={m.role} text={m.text} />
          ))}
          {loading && <Typing />}
        </div>

        {/* sugerencias */}
        <div className="mt-2 flex flex-wrap gap-2">
          {sug.map((s) => (
            <button
              key={s}
              className="rowi-chip"
              onClick={() => send(s)}
            >
              {s}
            </button>
          ))}
        </div>

        {/* input */}
        <div className="mt-2 flex items-center gap-2">
          <input
            className="flex-1 rounded-md border  bg-transparent px-3 py-2 text-sm outline-none"
            placeholder="Escribe aquí… Enter para enviar"
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
            style={{
              background: "linear-gradient(90deg,#d797cf,#31a2e3)",
              borderImage:
                "linear-gradient(90deg,#d797cf,#31a2e3) 1 / 1 / 0 stretch",
            }}
            onClick={() => send()}
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ======= UI subcomponentes ======= */

function Bubble({ role, text }: { role: "yo" | "rowi"; text: string }) {
  const mine = role === "yo";
  return (
    <div className={`mb-2 flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg border p-2 text-sm shadow-sm ${
          mine
            ? " bg-white/[0.06]"
            : " bg-white/[0.03]"
        }`}
      >
        <div
          className={`mb-1 text-[10px] ${
            mine ? "text-gray-300" : "text-gray-400"
          }`}
        >
          {mine ? "Tú" : "Rowi"}
        </div>
        <div className="whitespace-pre-line leading-relaxed">{text}</div>
      </div>
    </div>
  );
}

function Typing() {
  return (
    <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
      <span className="rowi-chip">
        <Dot /> <Dot delay="150ms" /> <Dot delay="300ms" />
      </span>
      Rowi está pensando…
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