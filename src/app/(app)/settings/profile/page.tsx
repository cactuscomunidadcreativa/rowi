"use client";

import { useEffect, useState } from "react";
import {
  Row,
  Toggle,
  Select,
  Text,
  TextArea,
  Chips,
} from "../../../../components/settings/ProfileFields";
import {
  Upload,
  Brain,
  FileText,
  MessageSquare,
  Sparkles,
  User,
  Eye,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/react";

/* ====== Colores base Rowi ====== */
const R = {
  purple: "#7a59c9",
  blue: "#31a2e3",
  pink: "#d797cf",
};

/* ====== Sugerencias ====== */
const SUGGESTED_VALUES = [
  "Honestidad", "Respeto", "Aprendizaje", "Familia", "Impacto", "Colaboración",
  "Creatividad", "Excelencia", "Transparencia", "Autonomía"
];
const SUGGESTED_HOBBIES = [
  "Correr", "Leer", "Gimnasio", "Cocinar", "Viajar", "Fotografía", "Música",
  "Pintura", "Jardinería", "Gaming"
];
const COMM_STYLES_ME = [
  "Directo", "Empático", "Detallado", "Breve", "Visual", "Inspirador"
];
const COMM_STYLES_TO_OTHERS = [
  "Necesito contexto", "Prefiero brevedad", "Muéstrame datos",
  "Aclaremos riesgos", "Vamos al siguiente paso", "Valida emoción primero"
];

/* ====== Tipado de preferencias ====== */
type Prefs = {
  channels: { email: boolean; whatsapp: boolean; sms: boolean; call: boolean };
  tone: "directo" | "empatico" | "neutral";
  meeting: "5-10min" | "15-20min" | "30min";
  language: "es" | "en" | "pt" | "it";
  availability: string;
  visibility: { showBrain: boolean; showTalents: boolean; showContact: boolean };
  bio: string;
  interests: string[];
  values: string[];
  hobbies: string[];
  commStyleSelf: string[];
  commExpectations: string[];
  dataset?: "actual" | "feedback";
};

/* ====== Página principal ====== */
export default function ProfileSettingsPage() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [csvMsg, setCsvMsg] = useState("");
  const [preview, setPreview] = useState<Record<string, any>[]>([]);

  const [prefs, setPrefs] = useState<Prefs>({
    channels: { email: true, whatsapp: true, sms: false, call: false },
    tone: "neutral",
    meeting: "15-20min",
    language: "es",
    availability: "",
    visibility: { showBrain: true, showTalents: true, showContact: false },
    bio: "",
    interests: [],
    values: [],
    hobbies: [],
    commStyleSelf: [],
    commExpectations: [],
    dataset: "actual",
  });

  /* ====== Cargar perfil existente ====== */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/profile", { cache: "no-store" }).catch(() => null);
        const j = r && r.ok ? await r.json() : null;
        const from = j?.prefs || j?.profile || null;
        if (from) {
          setPrefs(prev => ({
            ...prev,
            ...from,
          }));
        }
      } catch { }
      finally { setLoading(false); }
    })();
  }, []);

  /* ====== Guardar perfil ====== */
  async function save() {
    setMsg("Guardando…");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prefs })
    }).catch(() => null);
    setMsg(res && res.ok ? "Guardado ✅" : "Error al guardar");
    setTimeout(() => setMsg(""), 2000);
  }

  /* ====== Subir CSV (Self o Feedback) ====== */
  async function uploadSelfCsv(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      setCsvMsg("Subiendo CSV… ⏳");
      const fd = new FormData();
      fd.append("file", file);
      fd.append("dataset", prefs.dataset || "actual");

      const r = await fetch("/api/upload-csv/self", { method: "POST", body: fd });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j?.ok) {
        setCsvMsg("CSV importado ✅");
        setPreview(j.preview || []);
      } else {
        setCsvMsg("No se pudo importar el CSV ⚠️");
      }
      setTimeout(() => setCsvMsg(""), 2500);

       // 🔒 Protección: solo limpiar si el input aún existe
      if (e?.target instanceof HTMLInputElement) {
       e.target.value = "";
      };
    } catch (err) {
      console.error(err);
      setCsvMsg("Error de red ❌");
      setTimeout(() => setCsvMsg(""), 2500);
    }
  }

  /* ====== Helpers UI ====== */
  const addSuggestion = (key: keyof Prefs, v: string) => {
    setPrefs(p => {
      const arr = Array.isArray(p[key]) ? (p[key] as string[]) : [];
      return { ...p, [key]: arr.includes(v) ? arr : [...arr, v] };
    });
  };

  return (
    <main className="space-y-6 animate-fadeIn">
      {/* 💾 CSV Upload Section */}
      <section className="grid md:grid-cols-2 gap-4">
        <div className="rowi-card space-y-3">
          <h2 className="font-medium flex items-center gap-2 text-lg">
            <Upload size={18} style={{ color: R.blue }} /> {t("profile.csvTitle") || "Mi CSV (SEI / Self)"}
          </h2>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="dataset"
                value="actual"
                checked={prefs.dataset === "actual"}
                onChange={() => setPrefs(p => ({ ...p, dataset: "actual" }))}
              />
              <span>📘 {t("profile.myProfile") || "Mi Perfil"}</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="dataset"
                value="feedback"
                checked={prefs.dataset === "feedback"}
                onChange={() => setPrefs(p => ({ ...p, dataset: "feedback" }))}
              />
              <span>📗 {t("profile.feedback") || "Feedback 360°"}</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <label className="rowi-btn cursor-pointer">
              <Upload size={16} />
              {t("profile.uploadCSV") || "Subir CSV"}
              <input type="file" accept=".csv" className="hidden" onChange={uploadSelfCsv} />
            </label>
            {csvMsg && <span className="text-xs rowi-muted">{csvMsg}</span>}
          </div>

          {preview.length > 0 && (
            <div className="border-t pt-2 text-xs rowi-muted-weak">
              <div className="font-medium mb-1 flex items-center gap-1">
                <FileText size={14} /> 📄 {t("profile.preview") || "Previsualización (primeras filas)"}
              </div>
              <div className="overflow-x-auto text-[11px]">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {Object.keys(preview[0]).map(k => (
                        <th key={k} className="border px-1 py-0.5 text-left">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 3).map((r, i) => (
                      <tr key={i}>
                        {Object.values(r).map((v, j) => (
                          <td key={j} className="border px-1 py-0.5">{v}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="text-xs rowi-muted-weak flex items-center gap-1">
            <Brain size={12} /> 🧠 {t("profile.csvHint") || "Actualiza K/C/G, competencias, talentos y outcomes."}
          </div>
        </div>

        {/* Comunicación */}
        <div className="rowi-card space-y-3">
          <h2 className="font-medium flex items-center gap-2 text-lg">
            <MessageSquare size={18} style={{ color: R.purple }} /> {t("profile.communication") || "Comunicación"}
          </h2>
          <div className="grid gap-2 text-sm">
            <div className="rowi-muted">{t("profile.channels") || "Canales preferidos"}</div>
            <div className="flex flex-wrap gap-2">
              {(["email", "whatsapp", "sms", "call"] as const).map(ch => (
                <label key={ch} className="rowi-chip inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={prefs.channels[ch]}
                    onChange={e => setPrefs(p => ({ ...p, channels: { ...p.channels, [ch]: e.target.checked } }))}
                  />
                  <span>{ch.toUpperCase()}</span>
                </label>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs rowi-muted mb-1">🗣️ {t("profile.tone") || "Tono preferido"}</div>
                <Select value={prefs.tone} onChange={v => setPrefs(p => ({ ...p, tone: v as any }))} options={["directo", "empatico", "neutral"]} />
              </div>
              <div>
                <div className="text-xs rowi-muted mb-1">⏱️ {t("profile.meeting") || "Duración de reunión"}</div>
                <Select value={prefs.meeting} onChange={v => setPrefs(p => ({ ...p, meeting: v as any }))} options={["5-10min", "15-20min", "30min"]} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Estilos + Acerca de mí */}
      <section className="grid md:grid-cols-2 gap-4">
        <div className="rowi-card space-y-3">
          <h2 className="font-medium flex items-center gap-2 text-lg">
            <Sparkles size={18} style={{ color: R.pink }} /> ✨ {t("profile.commStyle") || "Estilos de comunicación"}
          </h2>
          <div className="text-sm rowi-muted">Cómo suelo comunicarme</div>
          <div className="flex flex-wrap gap-2 mb-2">
            {COMM_STYLES_ME.map(s => (
              <button key={s} className="rowi-chip" onClick={() => addSuggestion("commStyleSelf", s)}>{s}</button>
            ))}
          </div>
          <Chips value={prefs.commStyleSelf} onChange={v => setPrefs(p => ({ ...p, commStyleSelf: v }))} placeholder="Añade otro (Enter)" />

          <div className="text-sm rowi-muted mt-3">Cómo prefiero que se comuniquen conmigo</div>
          <div className="flex flex-wrap gap-2 mb-2">
            {COMM_STYLES_TO_OTHERS.map(s => (
              <button key={s} className="rowi-chip" onClick={() => addSuggestion("commExpectations", s)}>{s}</button>
            ))}
          </div>
          <Chips value={prefs.commExpectations} onChange={v => setPrefs(p => ({ ...p, commExpectations: v }))} placeholder="Añade otro (Enter)" />
        </div>

        <div className="rowi-card space-y-3">
          <h2 className="font-medium flex items-center gap-2 text-lg">
            <User size={18} style={{ color: R.blue }} /> 👤 {t("profile.aboutMe") || "Acerca de mí"}
          </h2>
          <div>
            <div className="text-xs rowi-muted mb-1">Bio</div>
            <TextArea value={prefs.bio} onChange={v => setPrefs(p => ({ ...p, bio: v }))} rows={3} placeholder="Cuéntanos sobre ti…" />
          </div>
          <div>
            <div className="text-xs rowi-muted mb-1">💎 Valores</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {SUGGESTED_VALUES.map(s => (
                <button key={s} className="rowi-chip" onClick={() => addSuggestion("values", s)}>{s}</button>
              ))}
            </div>
            <Chips value={prefs.values} onChange={v => setPrefs(p => ({ ...p, values: v }))} placeholder="Añade valor (Enter)" />
          </div>
          <div>
            <div className="text-xs rowi-muted mb-1">🎨 Hobbies</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {SUGGESTED_HOBBIES.map(s => (
                <button key={s} className="rowi-chip" onClick={() => addSuggestion("hobbies", s)}>{s}</button>
              ))}
            </div>
            <Chips value={prefs.hobbies} onChange={v => setPrefs(p => ({ ...p, hobbies: v }))} placeholder="Añade hobby (Enter)" />
          </div>
        </div>
      </section>

      {/* Visibilidad */}
      <section className="rowi-card space-y-4">
        <h2 className="font-medium flex items-center gap-2 text-lg">
          <Eye size={18} style={{ color: R.purple }} /> 👁️ {t("profile.visibility") || "Visibilidad"}
        </h2>
        <div className="grid md:grid-cols-3 gap-3">
          <div className="rowi-card">
            <div className="text-sm rowi-muted mb-2">Mostrar Brain style</div>
            <Toggle checked={prefs.visibility.showBrain} onChange={v => setPrefs(p => ({ ...p, visibility: { ...p.visibility, showBrain: v } }))} />
          </div>
          <div className="rowi-card">
            <div className="text-sm rowi-muted mb-2">Mostrar talentos</div>
            <Toggle checked={prefs.visibility.showTalents} onChange={v => setPrefs(p => ({ ...p, visibility: { ...p.visibility, showTalents: v } }))} />
          </div>
          <div className="rowi-card">
            <div className="text-sm rowi-muted mb-2">Mostrar contacto</div>
            <Toggle checked={prefs.visibility.showContact} onChange={v => setPrefs(p => ({ ...p, visibility: { ...p.visibility, showContact: v } }))} />
          </div>
        </div>
      </section>

      {/* Guardar */}
      <div className="flex items-center gap-2">
        <button className="rowi-btn-primary" onClick={save} disabled={loading}>💾 {t("actions.save") || "Guardar"}</button>
        {msg && <span className="text-xs rowi-muted">{msg}</span>}
      </div>
    </main>
  );
}