"use client";

import * as React from "react";
import { registerUsage } from "@/ai/client/registerUsage";
import { useSession } from "next-auth/react";

/* =========================================================
   📦 Tipos
========================================================= */
type Message = {
  id: string;
  role: "user" | "assistant";
  text?: string;
  audioUrl?: string;
};

type Attachment = { name: string; type: string; data: string };

const uid = () => Math.random().toString(36).slice(2, 9);

/* =========================================================
   🌍 Traducciones i18n
========================================================= */
const TR = {
  es: {
    title: "Super Rowi",
    placeholder: "Escribe un mensaje…",
    mic: "🎙",
    attach: "📎",
    send: "➤",
    greeting:
      "👋 Hola, soy Super Rowi. Puedes escribir, grabar un audio 🎙 o adjuntar un archivo 📎 para analizarlo juntos.",
    micError: "No se pudo acceder al micrófono.",
    typingText: "Rowi está escribiendo… 💭",
    typingAudio: "Rowi está grabando una respuesta 🎧…",
  },
  en: {
    title: "Super Rowi",
    placeholder: "Type a message…",
    mic: "🎙",
    attach: "📎",
    send: "➤",
    greeting:
      "👋 Hi, I'm Super Rowi. You can type, record 🎙 or attach 📎 a file to analyze together.",
    micError: "Could not access the microphone.",
    typingText: "Rowi is typing… 💭",
    typingAudio: "Rowi is recording an answer 🎧…",
  },
  pt: {
    title: "Super Rowi",
    placeholder: "Digite uma mensagem…",
    mic: "🎙",
    attach: "📎",
    send: "➤",
    greeting:
      "👋 Olá, sou o Super Rowi. Você pode digitar, gravar 🎙 ou anexar 📎 um arquivo para analisarmos juntos.",
    micError: "Não foi possível acessar o microfone.",
    typingText: "Rowi está escrevendo… 💭",
    typingAudio: "Rowi está gravando uma resposta 🎧…",
  },
  it: {
    title: "Super Rowi",
    placeholder: "Scrivi un messaggio…",
    mic: "🎙",
    attach: "📎",
    send: "➤",
    greeting:
      "👋 Ciao, sono Super Rowi. Puoi scrivere, registrare 🎙 o allegare 📎 un file per analizziarlo insieme.",
    micError: "Impossibile accedere al microfono.",
    typingText: "Rowi sta scrivendo… 💭",
    typingAudio: "Rowi sta registrando una risposta 🎧…",
  },
};

/* =========================================================
   💬 COMPONENTE PRINCIPAL — REFACTORIZADO SIN ERRORES DE HOOKS
========================================================= */
export default function RowiCoach() {
  const { data: session } = useSession();

  /* =========================================================
     🔥 TODOS LOS HOOKS VAN AQUÍ (ANTES DE CUALQUIER RETURN)
  ========================================================== */

  // Estados demo
  const [demoData, setDemoData] = React.useState<any>(null);
  const [checkingDemo, setCheckingDemo] = React.useState(true);

  // Estados del chat
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [recording, setRecording] = React.useState(false);
  const [attachments, setAttachments] = React.useState<Attachment[]>([]);
  const [mediaRecorder, setMediaRecorder] = React.useState<MediaRecorder | null>(null);
  const [typing, setTyping] = React.useState<"text" | "audio" | null>(null);
  const [playing, setPlaying] = React.useState<string | null>(null);
  const [audioPlayer, setAudioPlayer] = React.useState<HTMLAudioElement | null>(null);

  // Idioma
  const [locale, setLocale] = React.useState<keyof typeof TR>("es");
  const t = TR[locale];

  // Usuario
  const allowAI = session?.user?.allowAI ?? true;
  const userName = session?.user?.name || "Usuario";
  const tenantId = session?.user?.primaryTenantId || "rowi-master";

  const ENABLED = process.env.NEXT_PUBLIC_ROWICOACH_ENABLED === "true";

  /* =========================================================
     🔁 EFFECTS
  ========================================================== */

  // Cargar demo si no hay sesión
  React.useEffect(() => {
    const email = session?.user?.email ?? null;

    if (email) {
      setCheckingDemo(false);
      setDemoData(null);
      return;
    }

    async function run() {
      try {
        const res = await fetch("/api/rowi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessLevel: "visitor" }),
        });
        const json = await res.json();
        setDemoData(json);
      } catch (e) {
        console.error("Error modo demo:", e);
      } finally {
        setCheckingDemo(false);
      }
    }
    run();
  }, [session?.user]);

  // Abrir chat automáticamente en demo
  React.useEffect(() => {
    if (!session?.user?.email) setOpen(true);
  }, [session?.user?.email]);

  // Persistencia
  React.useEffect(() => {
    const saved = localStorage.getItem("rowiCoachHistory");
    if (saved) setMessages(JSON.parse(saved));
  }, []);

  React.useEffect(() => {
    localStorage.setItem("rowiCoachHistory", JSON.stringify(messages));
  }, [messages]);

  // Idioma dinámico
  React.useEffect(() => {
    const update = () => {
      const lang = document.documentElement.getAttribute("data-lang") || "es";
      setLocale(["es", "en", "pt", "it"].includes(lang) ? lang as any : "es");
    };

    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-lang"] });
    return () => obs.disconnect();
  }, []);

  /* =========================================================
     🔥 RETURNS CONDICIONALES (DESPUÉS DE HOOKS)
  ========================================================== */

  if (checkingDemo) {
    return (
      <div className="fixed bottom-20 right-5 p-4 bg-black/70 text-white rounded-xl shadow-lg">
        <p className="text-sm animate-pulse">Cargando Rowi…</p>
      </div>
    );
  }

  // Modo demo
  if (!session?.user?.email && demoData?.preview) {
    return (
      <div className="fixed bottom-20 right-5 w-[360px] max-w-[90vw] border border-amber-400 bg-amber-50 text-amber-900 rounded-2xl p-5 shadow-lg">
        <h2 className="text-lg font-semibold mb-2">🧠 Modo Demo Activo</h2>
        <p className="text-sm mb-4">{demoData?.text}</p>
        <button
          onClick={() => (window.location.href = "/hub/login")}
          className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
        >
          Iniciar sesión
        </button>
      </div>
    );
  }

  // IA deshabilitada
  if (!ENABLED || !allowAI) return null;

  /* =========================================================
     🎙️ AUDIO — START / STOP
  ========================================================== */

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/mp3" });
        const buf = new Uint8Array(await blob.arrayBuffer());
        const base64 = btoa(String.fromCharCode(...buf));

        setMessages((m) => [...m, { id: uid(), role: "user", audioUrl: `data:audio/mp3;base64,${base64}` }]);
        await sendMessage({ audio: base64 });
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch {
      alert(t.micError);
    }
  }

  function stopRecording() {
    mediaRecorder?.stop();
    setRecording(false);
  }

  /* =========================================================
     📎 ARCHIVOS
  ========================================================== */
  function handleAttachFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAttachments((prev) => [...prev, { name: file.name, type: file.type, data: reader.result as string }]);
    };
    reader.readAsDataURL(file);
  }

  /* =========================================================
     🚀 ENVIAR MENSAJE
  ========================================================== */
  async function sendMessage(extra?: { audio?: string }) {
    const text = input.trim();
    if (!text && !extra?.audio) return;

    if (text) setMessages((m) => [...m, { id: uid(), role: "user", text }]);
    setInput("");
    setTyping("text");

    try {
      const res = await fetch("/api/rowi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "super",
          ask: text,
          audio: extra?.audio || null,
          tenantId,
          locale,
          a: userName,
          attachments,
        }),
      });

      const json = await res.json();

      const reply: Message = {
        id: uid(),
        role: "assistant",
        text: json?.text || "…",
        audioUrl: json?.audioUrl || undefined,
      };

      setMessages((m) => [...m, reply]);
      setAttachments([]);

      await registerUsage({
        tenantId,
        feature: "ROWI_COACH",
        model: json.model || "gpt-4o-mini",
        tokensInput: 0,
        tokensOutput: 0,
      });
    } catch (e) {
      console.error("[RowiCoach] Error:", e);
      setMessages((m) => [...m, { id: uid(), role: "assistant", text: "⚠️ Error procesando tu mensaje." }]);
    } finally {
      setTyping(null);
    }
  }

  /* =========================================================
     🎧 AUDIO — PLAYBACK
  ========================================================== */
  function playAudio(url?: string, id?: string) {
    if (!url) return;

    if (audioPlayer && playing === id) {
      audioPlayer.pause();
      setPlaying(null);
      return;
    }

    if (audioPlayer) audioPlayer.pause();

    const audio = new Audio(url);
    setAudioPlayer(audio);
    setPlaying(id || null);
    audio.play();

    audio.onended = () => {
      setAudioPlayer(null);
      setPlaying(null);
    };
  }

  /* =========================================================
     💬 UI FINAL
  ========================================================== */

  const bubble = (
    <button
      onClick={() => setOpen(!open)}
      className="fixed bottom-5 right-5 z-50 rounded-full shadow-lg px-5 py-4 text-sm font-semibold
                 bg-gradient-to-r from-[#d797cf] to-[#31a2e3] text-white hover:scale-105 transition-transform"
    >
      {open ? "✖" : "Rowi"}
    </button>
  );

  if (!open) return bubble;

  return (
    <>
      {bubble}

      <div className="fixed bottom-20 right-5 w-[380px] max-w-[92vw] rounded-2xl border border-white/10 bg-black/85 text-white backdrop-blur-xl flex flex-col shadow-2xl z-50">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-[#d797cf] to-[#31a2e3] rounded-full flex items-center justify-center font-bold">
              R
            </div>
            <strong className="text-sm">{t.title}</strong>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            ✖
          </button>
        </div>

        {/* MENSAJES */}
        <div className="flex-1 max-h-[420px] overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-[#31a2e3]/30 scrollbar-track-transparent">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "ml-auto bg-gradient-to-r from-[#31a2e3]/40 to-[#d797cf]/40"
                  : "mr-auto bg-white/10"
              }`}
            >
              {m.text}
              {m.audioUrl && (
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => playAudio(m.audioUrl!, m.id)}
                    className={`text-xs ${playing === m.id ? "text-blue-400 scale-110" : "text-gray-300 hover:text-white"}`}
                  >
                    {playing === m.id ? "⏸" : "▶"}
                  </button>
                </div>
              )}
            </div>
          ))}

          {typing && (
            <div className="mr-auto text-xs text-gray-400 italic animate-pulse">
              {typing === "audio" ? t.typingAudio : t.typingText}
            </div>
          )}

          {messages.length === 0 && <div className="opacity-70 text-sm">{t.greeting}</div>}
        </div>

        {/* INPUT */}
        <div className="flex items-end gap-2 border-t border-white/10 bg-black/70 p-2">
          <button
            onClick={recording ? stopRecording : startRecording}
            className={`rounded-full w-10 h-10 flex items-center justify-center text-xl ${
              recording ? "bg-red-500 animate-pulse" : "bg-gradient-to-r from-[#31a2e3] to-[#d797cf]"
            }`}
          >
            {t.mic}
          </button>

          <label className="cursor-pointer p-2 text-lg text-gray-300 hover:text-white">
            {t.attach}
            <input type="file" className="hidden" onChange={handleAttachFile} />
          </label>

          <textarea
            rows={1}
            placeholder={t.placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-400 outline-none resize-none px-2"
          />

          <button
            onClick={() => sendMessage()}
            className="rounded-full bg-gradient-to-r from-[#d797cf] to-[#31a2e3] px-3 py-2 text-sm text-white hover:scale-105"
          >
            {t.send}
          </button>
        </div>

      </div>
    </>
  );
}