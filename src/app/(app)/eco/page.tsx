"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Sparkles, Send, Users, MessageCircle } from "lucide-react";

type Member = { id: string; name: string; brainStyle?: string };
type Free = { name: string; brainStyle?: string; bio?: string };
type Channel = "email" | "whatsapp" | "sms" | "call" | "speech";

export default function EcoPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [free, setFree] = useState<Free[]>([]);
  const [goal, setGoal] = useState("");
  const [channel, setChannel] = useState<Channel>("email");
  const [refine, setRefine] = useState(false);
  const [ask, setAsk] = useState("");
  const [out, setOut] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const dashRes = await fetch("/api/eco/dashboard", { cache: "no-store" }).catch(() => null);
      const dash = dashRes && dashRes.ok ? await dashRes.json() : null;
      setDashboard(dash);

      const r = await fetch("/api/community/members", { cache: "no-store" }).catch(() => null);
      const j = r && r.ok ? await r.json() : { members: [] };
      setMembers(Array.isArray(j.members) ? j.members : []);
    })();
  }, []);

  async function compose() {
    setLoading(true);
    setOut(null);
    try {
      const body = {
        goal,
        channel,
        memberIds: picked,
        freeTargets: free.filter((f) => f.name.trim()),
        refine,
        ask,
      };
      const r = await fetch("/api/eco/compose", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      setOut(j);
    } catch {
      setOut({ ok: false, error: "Error" });
    } finally {
      setLoading(false);
    }
  }

  const copyText = (txt: string) => navigator.clipboard.writeText(txt).catch(() => {});

  return (
    <main className="space-y-6 p-6 bg-gradient-to-b from-rowi-blueDay/10 to-rowi-pinkDay/10 dark:from-zinc-900 dark:to-zinc-950 min-h-screen">
      {/* HEADER */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-rowi-blueDay to-rowi-pinkDay bg-clip-text text-transparent">
          ECO · Comunicación Inteligente
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Diseña tu mensaje desde la inteligencia emocional y tu estilo cerebral.
        </p>
      </motion.header>

      {/* PANEL COGNITIVO */}
      {dashboard?.ok && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl p-5 bg-white/80 dark:bg-zinc-900/70 shadow-md border border-rowi-blueDay/10 space-y-2"
        >
          <h2 className="font-semibold flex items-center gap-2 text-rowi-blueDay">
            <Sparkles className="w-4 h-4" /> Tu perfil cognitivo–emocional
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {dashboard.user.name} · {dashboard.user.brainStyle} · {dashboard.user.commPattern}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.entries(dashboard.eqStatus).map(([k, v]) => (
              <span
                key={k}
                className="px-2 py-1 text-xs rounded-full bg-gradient-to-r from-rowi-blueDay/20 to-rowi-pinkDay/20 text-gray-700 dark:text-gray-200"
              >
                {k.toUpperCase()}: {v}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-500 italic">
            Riesgo: {dashboard.user.commRisk}
          </p>
        </motion.section>
      )}

      {/* SELECCIÓN DE PERSONA DESTINO */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="rowi-card space-y-3"
      >
        <h3 className="text-base font-semibold flex items-center gap-2">
          <Users className="w-4 h-4 text-rowi-blueDay" /> ¿Con quién te vas a comunicar?
        </h3>

        <div className="grid md:grid-cols-2 gap-2">
          {members.map((m) => (
            <label
              key={m.id}
              className={`flex items-center justify-between border rounded-md p-3 cursor-pointer transition-all ${
                picked.includes(m.id)
                  ? "bg-gradient-to-r from-rowi-blueDay/20 to-rowi-pinkDay/20 border-rowi-blueDay"
                  : "bg-transparent hover:border-rowi-blueDay/40"
              }`}
            >
              <div>
                <p className="font-medium">{m.name}</p>
                <p className="text-xs text-gray-500">{m.brainStyle || "Desconocido"}</p>
              </div>
              <input
                type="checkbox"
                checked={picked.includes(m.id)}
                onChange={(e) =>
                  setPicked((v) =>
                    e.target.checked ? [...v, m.id] : v.filter((x) => x !== m.id)
                  )
                }
              />
            </label>
          ))}
        </div>

        {/* Externo */}
        <button onClick={() => setFree((v) => [...v, { name: "", brainStyle: "Strategist" }])} className="rowi-btn mt-2">
          + Agregar externo
        </button>

        {free.length > 0 && (
          <div className="grid md:grid-cols-2 gap-2">
            {free.map((f, i) => (
              <div key={i} className="border rounded-md p-3 bg-white dark:bg-zinc-900 space-y-2">
                <input
                  className="w-full text-sm border rounded-md p-2"
                  placeholder="Nombre o LinkedIn"
                  value={f.name}
                  onChange={(e) => setFree((v) => v.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                />
                <select
                  className="w-full text-sm border rounded-md p-2"
                  value={f.brainStyle}
                  onChange={(e) => setFree((v) => v.map((x, j) => (j === i ? { ...x, brainStyle: e.target.value } : x)))}
                >
                  {["Strategist", "Scientist", "Guardian", "Deliverer", "Inventor", "Energizer", "Sage"].map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </motion.section>

      {/* COMPOSER */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="rowi-card space-y-3"
      >
        <h3 className="text-base font-semibold flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-rowi-blueDay" /> Diseña tu mensaje
        </h3>

        <textarea
          rows={3}
          className="w-full rounded-md border p-3 text-sm bg-transparent"
          placeholder="¿Qué querés lograr con este mensaje?"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
        />

        <div className="grid md:grid-cols-3 gap-2">
          <select
            className="border rounded-md px-3 py-2 bg-transparent text-sm"
            value={channel}
            onChange={(e) => setChannel(e.target.value as Channel)}
          >
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="sms">SMS</option>
            <option value="call">Llamada</option>
            <option value="speech">Speech</option>
          </select>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={refine} onChange={(e) => setRefine(e.target.checked)} />
            Refinar con IA (modo Pro)
          </label>
        </div>

        <textarea
          rows={2}
          className="w-full border rounded-md p-2 text-sm bg-transparent"
          placeholder="Matiz para ECO (ej: tono más empático, breve, orientado a resultados...)"
          value={ask}
          onChange={(e) => setAsk(e.target.value)}
        />

        <button
          onClick={compose}
          disabled={!goal || loading}
          className="rowi-btn-primary flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {loading ? "Generando..." : "Generar mensaje"}
        </button>
      </motion.section>

      {/* RESULTADO */}
      {out?.ok && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="rowi-card space-y-2"
        >
          <h3 className="text-base font-semibold flex items-center gap-2 text-rowi-blueDay">
            <Sparkles className="w-4 h-4" /> Resultado
          </h3>
          <p className="text-xs text-gray-500">{out.mode === "pro-llm" ? "Modo Pro (IA avanzada)" : "Modo Base"}</p>

          <div className="p-3 bg-white dark:bg-zinc-900 border rounded-md text-sm">
            <strong>{out.refined?.subject || out.base.subject}</strong>
            <p className="mt-2 whitespace-pre-wrap">{out.refined?.text || out.base.text}</p>
          </div>

          <div className="flex gap-2">
            <button onClick={() => copyText(out.refined?.text || out.base.text)} className="rowi-btn">
              Copiar
            </button>
          </div>
        </motion.section>
      )}
    </main>
  );
}