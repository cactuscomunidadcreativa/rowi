"use client";

import { useEffect, useState } from "react";
import {
  Loader2, Save, Upload, Brain, BarChart2, UserCircle2,
  Sparkles, Eye, Link2, FileSpreadsheet, CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

/* =========================================================
   🧠 Rowi Profile Hub 4.0
========================================================= */
export default function MeProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [prefs, setPrefs] = useState<any>({
    values: [],
    commSelf: [],
    commPref: [],
    talents: [],
    activates: [],
    drains: [],
    workMode: "WM_SQUAD",
    workTime: "WT_AM",
    visibility: true,
    linkedIn: "",
    website: "",
  });
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  /* ==============================================
     🔹 Load profile from DB
  ============================================== */
  useEffect(() => {
    async function loadProfile() {
      const res = await fetch("/api/me");
      const data = await res.json();
      setUser(data.user || {});
      if (data.user?.brainProfile) setPrefs((p: any) => ({ ...p, talents: data.user.brainProfile.talents || [] }));
    }
    loadProfile();
  }, []);

  /* ==============================================
     💾 Save profile
  ============================================== */
  async function saveProfile() {
    try {
      setSaving(true);
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      toast.success("Perfil actualizado 💾");
    } catch {
      toast.error("Error guardando perfil");
    } finally {
      setSaving(false);
    }
  }

  /* ==============================================
     📤 Upload CSV Brain / SEI
  ============================================== */
  async function handleCsv(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("dataset", "brain_profile");
    const res = await fetch("/api/upload-csv/self", { method: "POST", body: formData });
    const json = await res.json();
    setCsvPreview(json.preview || []);
    setUploading(false);
    if (json.ok) toast.success(json.message);
    else toast.error("Error al importar CSV");
  }

  /* ==============================================
     🌈 UI
  ============================================== */
  return (
    <main className="max-w-5xl mx-auto p-8 space-y-8">
      {/* HEADER */}
      <header className="text-center space-y-2">
        <UserCircle2 className="w-14 h-14 text-rowi-blueDay mx-auto" />
        <h1 className="text-3xl font-bold bg-gradient-to-r from-rowi-blueDay to-rowi-pinkDay bg-clip-text text-transparent">
          Mi Perfil Cognitivo
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Integra tu identidad emocional, talentos y estilo único.
        </p>
      </header>

      {/* INFORMACIÓN BÁSICA */}
      <section className="p-6 border rounded-2xl bg-white/60 dark:bg-gray-900/40 backdrop-blur-md space-y-3">
        <Field label="Nombre" value={user?.name || ""} />
        <Field label="Titular" value={user?.headline || ""} />
        <Textarea label="Biografía" value={user?.bio || ""} />
        <div className="flex gap-3">
          <Input label="LinkedIn" value={prefs.linkedIn} onChange={(v) => setPrefs({ ...prefs, linkedIn: v })} />
          <Input label="Sitio web" value={prefs.website} onChange={(v) => setPrefs({ ...prefs, website: v })} />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={prefs.visibility}
            onChange={(e) => setPrefs({ ...prefs, visibility: e.target.checked })}
          />
          <span className="text-sm text-gray-500">Perfil visible públicamente</span>
        </div>
      </section>

      {/* VALORES / COMUNICACIÓN */}
      <GridTwo>
        <Block title="💎 Valores principales">
          <ChipGroup
            options={["Propósito", "Aprendizaje", "Creatividad", "Empatía", "Impacto", "Autonomía", "Justicia", "Colaboración"]}
            selected={prefs.values}
            onToggle={(v) => toggle(prefs, setPrefs, "values", v, 5)}
          />
        </Block>

        <Block title="💬 Estilo de comunicación">
          <ChipGroup
            options={["Directo", "Empático", "Estructurado", "Spontáneo", "Analítico", "Inspirador"]}
            selected={prefs.commSelf}
            onToggle={(v) => toggle(prefs, setPrefs, "commSelf", v, 3)}
          />
        </Block>
      </GridTwo>

      {/* TALENTOS Y BRAIN PROFILE */}
      <section className="p-6 border rounded-2xl bg-white/60 dark:bg-gray-900/40 shadow-sm space-y-4 backdrop-blur-md">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Brain className="w-4 h-4 text-rowi-blueDay" /> Talentos Cognitivos
        </h3>
        {prefs.talents.length > 0 ? (
          <ul className="grid sm:grid-cols-2 gap-2 text-sm">
            {prefs.talents.map((t: string) => (
              <li key={t} className="rounded-md border px-3 py-2 bg-white/40 dark:bg-gray-800/40">{t}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">Aún no has subido tu Brain Profile.</p>
        )}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <FileSpreadsheet className="w-4 h-4" />
            Subir CSV Brain Profile / SEI
            <input type="file" accept=".csv" onChange={handleCsv} hidden />
          </label>
          {uploading && <Loader2 className="w-4 h-4 animate-spin text-rowi-blueDay" />}
          {csvPreview.length > 0 && (
            <table className="mt-2 text-xs border-collapse border border-gray-300 w-full">
              <tbody>
                {csvPreview.map((r, i) => (
                  <tr key={i}>
                    {Object.values(r).map((v, j) => (
                      <td key={j} className="border px-2 py-1">{String(v)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ENERGÍA / MOTIVADORES */}
      <GridTwo>
        <Block title="⚡ Me activa">
          <ChipGroup
            options={["Resolver problemas", "Aprender", "Mentorear", "Construir", "Organizar", "Inspirar"]}
            selected={prefs.activates}
            onToggle={(v) => toggle(prefs, setPrefs, "activates", v, 6)}
          />
        </Block>

        <Block title="🌧️ Me drena">
          <ChipGroup
            options={["Microgestión", "Falta de propósito", "Reuniones largas", "Ambigüedad", "Trabajo solitario", "Caos"]}
            selected={prefs.drains}
            onToggle={(v) => toggle(prefs, setPrefs, "drains", v, 6)}
          />
        </Block>
      </GridTwo>

      {/* 🌐 Afinidad Visual */}
      <AffinityPanel prefs={prefs} />

      {/* GUARDAR */}
      <div className="sticky bottom-4 flex justify-end items-center gap-3 bg-white/60 dark:bg-gray-900/40 backdrop-blur-md p-3 rounded-xl border shadow-sm">
        <button
          onClick={saveProfile}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-rowi-blueDay to-rowi-pinkDay text-white rounded-lg font-medium hover:opacity-90 transition"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar Perfil
        </button>
        {saving && <CheckCircle2 className="w-5 h-5 text-green-500" />}
      </div>
    </main>
  );
}

/* =========================================================
   🔧 Subcomponentes y utilidades
========================================================= */
const toggle = (prefs: any, setPrefs: any, key: string, val: string, limit = 3) => {
  setPrefs((p: any) => {
    const set = new Set(p[key]);
    if (set.has(val)) set.delete(val);
    else if (set.size < limit) set.add(val);
    return { ...p, [key]: Array.from(set) };
  });
};
const Block = ({ title, children }: any) => (
  <div className="p-5 border rounded-2xl bg-white/70 dark:bg-gray-900/50 shadow-sm backdrop-blur-md space-y-3">
    <h3 className="font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
    {children}
  </div>
);
const GridTwo = ({ children }: any) => (
  <section className="grid lg:grid-cols-2 gap-8">{children}</section>
);
const Input = ({ label, value, onChange }: any) => (
  <div className="space-y-1">
    <label className="text-sm text-gray-600">{label}</label>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-gray-300 bg-white/70 dark:bg-gray-800/70 px-3 py-2 text-sm focus:ring-2 focus:ring-rowi-blueDay outline-none"
    />
  </div>
);
const Textarea = ({ label, value }: any) => (
  <div className="space-y-1">
    <label className="text-sm text-gray-600">{label}</label>
    <textarea
      rows={3}
      value={value}
      className="w-full rounded-md border border-gray-300 bg-white/70 dark:bg-gray-800/70 px-3 py-2 text-sm outline-none"
      readOnly
    />
  </div>
);
const ChipGroup = ({ options, selected, onToggle }: any) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt: string) => {
      const active = selected.includes(opt);
      return (
        <button
          key={opt}
          onClick={() => onToggle(opt)}
          className={`px-3 py-2 text-xs rounded-full border transition-all ${
            active
              ? "bg-gradient-to-r from-rowi-blueDay to-rowi-pinkDay text-white"
              : "border-gray-300 text-gray-600 hover:border-rowi-blueDay/50"
          }`}
        >
          {opt}
        </button>
      );
    })}
  </div>
);
const Field = ({ label, value }: any) => (
  <div className="space-y-1">
    <label className="text-sm text-gray-500">{label}</label>
    <div className="rounded-md border px-3 py-2 bg-white/70 dark:bg-gray-800/70 text-sm">{value}</div>
  </div>
);
const AffinityPanel = ({ prefs }: any) => {
  const score =
    (prefs.values.length * 10 +
      prefs.commSelf.length * 8 +
      prefs.talents.length * 6 +
      prefs.activates.length * 6 -
      prefs.drains.length * 4) /
    5;
  const pct = Math.min(100, Math.max(0, score));
  const mood =
    pct > 80 ? "💎 Inspirado" : pct > 60 ? "🌈 En equilibrio" : pct > 40 ? "🌤 En búsqueda" : "🌧 Desalineado";
  return (
    <section className="p-6 border rounded-2xl bg-gradient-to-br from-rowi-blueDay/10 to-rowi-pinkDay/10 backdrop-blur-md text-center space-y-3 shadow-md">
      <h3 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2">
        <Sparkles className="w-5 h-5 text-rowi-pinkDay" /> Afinidad Emocional
      </h3>
      <div className="text-5xl font-bold text-rowi-blueNight dark:text-rowi-blueDay">{pct.toFixed(0)}%</div>
      <p className="text-sm text-gray-500">{mood}</p>
      <div className="w-full bg-gray-200/40 rounded-full h-2">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-rowi-blueDay to-rowi-pinkDay"
          style={{ width: `${pct}%` }}
        />
      </div>
    </section>
  );
};