"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Row,
  Toggle,
  Select,
  Text,
  TextArea,
  Chips,
} from "../../../../components/settings/ProfileFields";
import {
  Brain,
  MessageSquare,
  Sparkles,
  User,
  Eye,
  Mail,
  Plus,
  X,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  DollarSign,
  Heart,
  Briefcase,
  GraduationCap,
  MapPin,
  Globe,
  Users,
  Zap,
  Star,
  Shield,
  RefreshCw,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/react";

/* ====== Frases del borrador del Rowi Test (claves i18n → texto) ======
   El CommunicationProfile sembrado por el mini-SEI guarda CLAVES (no texto);
   aquí las resolvemos a frases editables para prellenar los estilos.
   Cada entrada referencia una clave i18n + fallback ES para t(). */
const COMM_DRAFT_PHRASES: Record<string, { key: string; es: string }> = {
  "profile.comm.self.EL.high": { key: "settingsProfilePg.commDraft.selfElHigh", es: "Sé nombrar con precisión lo que siento" },
  "profile.comm.self.ACT.high": { key: "settingsProfilePg.commDraft.selfActHigh", es: "Voy al grano y pienso en las consecuencias" },
  "profile.comm.self.NE.high": { key: "settingsProfilePg.commDraft.selfNeHigh", es: "Mantengo la calma cuando hay tensión" },
  "profile.comm.self.IM.high": { key: "settingsProfilePg.commDraft.selfImHigh", es: "Me mueve un porqué propio" },
  "profile.comm.self.OP.high": { key: "settingsProfilePg.commDraft.selfOpHigh", es: "Tiendo a ver posibilidades" },
  "profile.comm.self.EMP.high": { key: "settingsProfilePg.commDraft.selfEmpHigh", es: "Me sintonizo con cómo se siente el otro" },
  "profile.comm.self.NG.high": { key: "settingsProfilePg.commDraft.selfNgHigh", es: "Conecto lo que hago con algo más grande" },
  "profile.comm.pref.EL.low": { key: "settingsProfilePg.commDraft.prefElLow", es: "Dame espacio para procesar lo que siento" },
  "profile.comm.pref.ACT.low": { key: "settingsProfilePg.commDraft.prefActLow", es: "Dame contexto antes del pedido" },
  "profile.comm.pref.NE.low": { key: "settingsProfilePg.commDraft.prefNeLow", es: "Cuida el tono cuando hay carga emocional" },
  "profile.comm.pref.IM.low": { key: "settingsProfilePg.commDraft.prefImLow", es: "Ayúdame a ver el sentido de las cosas" },
  "profile.comm.pref.EMP.high": { key: "settingsProfilePg.commDraft.prefEmpHigh", es: "Háblame con calidez" },
  "profile.comm.pref.EMP.low": { key: "settingsProfilePg.commDraft.prefEmpLow", es: "Dime de forma explícita cómo te sientes" },
};

function resolveCommDraft(
  keys: unknown,
  translate: (key: string, fallback: string) => string
): string[] {
  if (!Array.isArray(keys)) return [];
  return keys
    .map((k) => {
      const entry = COMM_DRAFT_PHRASES[String(k)];
      return entry ? translate(entry.key, entry.es) : undefined;
    })
    .filter((s): s is string => Boolean(s));
}

/* ====== Sugerencias traducibles (clave i18n + fallback ES) ====== */
type Suggestion = { key: string; es: string };

const SUGGESTED_VALUES: Suggestion[] = [
  { key: "settingsProfilePg.suggestedValues.honesty", es: "Honestidad" },
  { key: "settingsProfilePg.suggestedValues.respect", es: "Respeto" },
  { key: "settingsProfilePg.suggestedValues.learning", es: "Aprendizaje" },
  { key: "settingsProfilePg.suggestedValues.family", es: "Familia" },
  { key: "settingsProfilePg.suggestedValues.impact", es: "Impacto" },
  { key: "settingsProfilePg.suggestedValues.collaboration", es: "Colaboración" },
  { key: "settingsProfilePg.suggestedValues.creativity", es: "Creatividad" },
  { key: "settingsProfilePg.suggestedValues.excellence", es: "Excelencia" },
  { key: "settingsProfilePg.suggestedValues.transparency", es: "Transparencia" },
  { key: "settingsProfilePg.suggestedValues.autonomy", es: "Autonomía" },
];
const SUGGESTED_HOBBIES: Suggestion[] = [
  { key: "settingsProfilePg.suggestedHobbies.running", es: "Correr" },
  { key: "settingsProfilePg.suggestedHobbies.reading", es: "Leer" },
  { key: "settingsProfilePg.suggestedHobbies.gym", es: "Gimnasio" },
  { key: "settingsProfilePg.suggestedHobbies.cooking", es: "Cocinar" },
  { key: "settingsProfilePg.suggestedHobbies.traveling", es: "Viajar" },
  { key: "settingsProfilePg.suggestedHobbies.photography", es: "Fotografía" },
  { key: "settingsProfilePg.suggestedHobbies.music", es: "Música" },
  { key: "settingsProfilePg.suggestedHobbies.painting", es: "Pintura" },
  { key: "settingsProfilePg.suggestedHobbies.gardening", es: "Jardinería" },
  { key: "settingsProfilePg.suggestedHobbies.gaming", es: "Gaming" },
];
const COMM_STYLES_ME: Suggestion[] = [
  { key: "settingsProfilePg.commStylesMe.direct", es: "Directo" },
  { key: "settingsProfilePg.commStylesMe.empathetic", es: "Empático" },
  { key: "settingsProfilePg.commStylesMe.detailed", es: "Detallado" },
  { key: "settingsProfilePg.commStylesMe.brief", es: "Breve" },
  { key: "settingsProfilePg.commStylesMe.visual", es: "Visual" },
  { key: "settingsProfilePg.commStylesMe.inspiring", es: "Inspirador" },
];
const COMM_STYLES_TO_OTHERS: Suggestion[] = [
  { key: "settingsProfilePg.commStylesToOthers.needContext", es: "Necesito contexto" },
  { key: "settingsProfilePg.commStylesToOthers.preferBrevity", es: "Prefiero brevedad" },
  { key: "settingsProfilePg.commStylesToOthers.showData", es: "Muéstrame datos" },
  { key: "settingsProfilePg.commStylesToOthers.clarifyRisks", es: "Aclaremos riesgos" },
  { key: "settingsProfilePg.commStylesToOthers.moveForward", es: "Vamos al siguiente paso" },
  { key: "settingsProfilePg.commStylesToOthers.validateEmotion", es: "Valida emoción primero" },
];
const SUGGESTED_INTERESTS: Suggestion[] = [
  { key: "settingsProfilePg.suggestedInterests.leadership", es: "Liderazgo" },
  { key: "settingsProfilePg.suggestedInterests.innovation", es: "Innovación" },
  { key: "settingsProfilePg.suggestedInterests.ai", es: "IA" },
  { key: "settingsProfilePg.suggestedInterests.sustainability", es: "Sostenibilidad" },
  { key: "settingsProfilePg.suggestedInterests.entrepreneurship", es: "Emprendimiento" },
  { key: "settingsProfilePg.suggestedInterests.personalDevelopment", es: "Desarrollo personal" },
  { key: "settingsProfilePg.suggestedInterests.coaching", es: "Coaching" },
  { key: "settingsProfilePg.suggestedInterests.wellness", es: "Bienestar" },
  { key: "settingsProfilePg.suggestedInterests.technology", es: "Tecnología" },
  { key: "settingsProfilePg.suggestedInterests.education", es: "Educación" },
];
const SUGGESTED_GOALS: Suggestion[] = [
  { key: "settingsProfilePg.suggestedGoals.professionalGrowth", es: "Crecimiento profesional" },
  { key: "settingsProfilePg.suggestedGoals.workLifeBalance", es: "Balance vida-trabajo" },
  { key: "settingsProfilePg.suggestedGoals.startBusiness", es: "Emprender" },
  { key: "settingsProfilePg.suggestedGoals.leadTeams", es: "Liderar equipos" },
  { key: "settingsProfilePg.suggestedGoals.changeIndustry", es: "Cambiar de industria" },
  { key: "settingsProfilePg.suggestedGoals.socialImpact", es: "Impacto social" },
];

/* ====== Colores Rowi ====== */
const COLORS = {
  purple: "#7a59c9",
  blue: "#38bdf8",
  pink: "#d797cf",
  green: "#10b981",
  orange: "#f59e0b",
};

/* ====== Tipos ====== */
type UserEmail = {
  id: string;
  email: string;
  label: string | null;
  verified: boolean;
  primary: boolean;
};

type SeiLink = {
  id: string;
  code: string;
  name: string;
  url: string;
  language: string;
  isDefault: boolean;
  description: string | null;
};

type ProfileData = {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    headline: string | null;
    bio: string | null;
    language: string | null;
    country: string | null;
    region: string | null;
    city: string | null;
    timezone: string | null;
    allowAI: boolean;
    contributeToRowiverse: boolean;
  };
  emails: UserEmail[];
  plan: {
    name: string;
    slug: string;
    seiIncluded: boolean;
  } | null;
  sei: {
    requested: boolean;
    requestedAt: string | null;
    completedAt: string | null;
    daysSinceRequest: number | null;
    pendingArrival: boolean;
    lastSnapshot: { at: string; total: number; brainStyle: string } | null;
    snapshotCount: number;
    hasFreeSei: boolean;
    canRetakeFreely: boolean;
    retakeCost: number;
    nextRecommendedDate: string | null;
  };
  seiLinks: SeiLink[];
  affinity: {
    hasProfile: boolean;
    traits: Record<string, any>;
  };
};

type Prefs = {
  channels: { email: boolean; whatsapp: boolean; sms: boolean; call: boolean };
  tone: "directo" | "empatico" | "neutral";
  meeting: "5-10min" | "15-20min" | "30min";
  visibility: { showBrain: boolean; showTalents: boolean; showContact: boolean };
  bio: string;
  values: string[];
  hobbies: string[];
  commStyleSelf: string[];
  commExpectations: string[];
};

type AffinityData = {
  profession: string;
  industry: string;
  yearsExperience: string;
  education: string;
  languages: string[];
  interests: string[];
  goals: string[];
  lookingFor: string[];
  workStyle: string;
  teamSize: string;
};

/* ====== Componente Principal ====== */
export default function ProfileSettingsPage() {
  const { locale, t } = useI18n();
  const lang = locale; // kept for date formatting + API locale

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [commIsDraft, setCommIsDraft] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newEmailLabel, setNewEmailLabel] = useState<"work" | "personal" | "alt">("work");
  const [showAddEmail, setShowAddEmail] = useState(false);
  // Mostrar links SEI automáticamente si no tiene evaluación
  const [showSeiLinks, setShowSeiLinks] = useState(true);

  const [prefs, setPrefs] = useState<Prefs>({
    channels: { email: true, whatsapp: true, sms: false, call: false },
    tone: "neutral",
    meeting: "15-20min",
    visibility: { showBrain: true, showTalents: true, showContact: false },
    bio: "",
    values: [],
    hobbies: [],
    commStyleSelf: [],
    commExpectations: [],
  });

  const [affinity, setAffinity] = useState<AffinityData>({
    profession: "",
    industry: "",
    yearsExperience: "",
    education: "",
    languages: [],
    interests: [],
    goals: [],
    lookingFor: [],
    workStyle: "",
    teamSize: "",
  });

  const [location, setLocation] = useState({
    country: "",
    region: "",
    city: "",
    timezone: "",
  });

  const [privacy, setPrivacy] = useState({
    allowAI: true,
    contributeToRowiverse: true,
  });

  /* ====== Cargar datos ====== */
  useEffect(() => {
    (async () => {
      try {
        // Cargar perfil extendido
        const profileRes = await fetch("/api/user/profile", { cache: "no-store" });
        const profileData = profileRes.ok ? await profileRes.json() : null;

        if (profileData?.ok) {
          setProfile(profileData);

          // Cargar ubicación
          setLocation({
            country: profileData.user.country || "",
            region: profileData.user.region || "",
            city: profileData.user.city || "",
            timezone: profileData.user.timezone || "",
          });

          // Cargar privacidad
          setPrivacy({
            allowAI: profileData.user.allowAI ?? true,
            contributeToRowiverse: profileData.user.contributeToRowiverse ?? true,
          });

          // Cargar datos de Affinity si existen
          if (profileData.affinity?.traits) {
            setAffinity((prev) => ({
              ...prev,
              ...profileData.affinity.traits,
            }));
          }

          // Cargar bio
          setPrefs((prev) => ({
            ...prev,
            bio: profileData.user.bio || "",
          }));
        }

        // Cargar preferencias desde API legacy
        const prefsRes = await fetch("/api/profile", { cache: "no-store" });
        const prefsData = prefsRes.ok ? await prefsRes.json() : null;
        if (prefsData?.prefs || prefsData?.profile) {
          const from = prefsData.prefs || prefsData.profile;
          setPrefs((prev) => ({
            ...prev,
            ...from,
          }));
        }

        // Cadena SIA: prellenar los estilos desde el borrador del Rowi Test.
        const cp = prefsData?.communicationProfile;
        if (cp) {
          setCommIsDraft(Boolean(cp.isDraft));
          const selfPhrases = resolveCommDraft(cp.commSelf, t);
          const prefPhrases = resolveCommDraft(cp.commPref, t);
          setPrefs((prev) => ({
            ...prev,
            commStyleSelf: prev.commStyleSelf?.length ? prev.commStyleSelf : selfPhrases,
            commExpectations: prev.commExpectations?.length ? prev.commExpectations : prefPhrases,
            tone: cp.tone && !prev.tone ? prev.tone : prev.tone,
          }));
        }
      } catch (e) {
        console.error("Error loading profile:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ====== Guardar ====== */
  async function save() {
    setSaving(true);
    setMsg(t("settingsProfilePg.saving", "Guardando..."));

    try {
      // Guardar en API extendida
      const profileRes = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          bio: prefs.bio,
          country: location.country,
          region: location.region,
          city: location.city,
          timezone: location.timezone,
          allowAI: privacy.allowAI,
          contributeToRowiverse: privacy.contributeToRowiverse,
          affinityData: affinity,
        }),
      });

      // Guardar preferencias en API legacy
      const prefsRes = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prefs }),
      });

      if (profileRes.ok && prefsRes.ok) {
        setMsg(t("settingsProfilePg.saved", "Guardado") + " ✅");
      } else {
        // Reportar específicamente qué parte falló, en vez de un error genérico
        // que oculta cuál de los dos guardados no se persistió.
        const failed: string[] = [];
        if (!profileRes.ok) failed.push(t("settingsProfilePg.savePartProfile", "perfil"));
        if (!prefsRes.ok) failed.push(t("settingsProfilePg.savePartPreferences", "preferencias"));
        setMsg(`${t("settingsProfilePg.error", "Error al guardar")}: ${failed.join(", ")} ⚠️`);
      }
    } catch (e) {
      setMsg(t("settingsProfilePg.error", "Error al guardar") + " ❌");
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(""), 3000);
    }
  }

  /* ====== Agregar email ====== */
  async function addEmail() {
    if (!newEmail || !newEmail.includes("@")) return;

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          addEmail: { email: newEmail, label: newEmailLabel },
        }),
      });

      if (res.ok) {
        setNewEmail("");
        setShowAddEmail(false);
        // Recargar perfil
        const profileRes = await fetch("/api/user/profile", { cache: "no-store" });
        const profileData = profileRes.ok ? await profileRes.json() : null;
        if (profileData?.ok) setProfile(profileData);
      }
    } catch (e) {
      console.error("Error adding email:", e);
    }
  }

  /* ====== Eliminar email ====== */
  async function removeEmail(emailId: string) {
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ removeEmailId: emailId }),
      });

      if (res.ok) {
        // Recargar perfil
        const profileRes = await fetch("/api/user/profile", { cache: "no-store" });
        const profileData = profileRes.ok ? await profileRes.json() : null;
        if (profileData?.ok) setProfile(profileData);
      }
    } catch (e) {
      console.error("Error removing email:", e);
    }
  }

  /* ====== Helpers ====== */
  const addSuggestion = (key: keyof Prefs | keyof AffinityData, v: string, target: "prefs" | "affinity") => {
    if (target === "prefs") {
      setPrefs((p) => {
        const arr = Array.isArray(p[key as keyof Prefs]) ? (p[key as keyof Prefs] as string[]) : [];
        return { ...p, [key]: arr.includes(v) ? arr : [...arr, v] };
      });
    } else {
      setAffinity((p) => {
        const arr = Array.isArray(p[key as keyof AffinityData]) ? (p[key as keyof AffinityData] as string[]) : [];
        return { ...p, [key]: arr.includes(v) ? arr : [...arr, v] };
      });
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString(lang !== "es" ? "en-US" : "es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
          {t("settingsProfilePg.title", "Mi Perfil Rowi")}
        </h1>
        <p className="text-sm rowi-muted mt-2">{t("settingsProfilePg.subtitle", "Configura tu perfil para obtener la mejor experiencia personalizada")}</p>
      </div>

      {/* ========== SEI SECTION ========== */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rowi-card border-2 border-purple-200 dark:border-purple-800"
      >
        <div className="flex items-start gap-4">
          <div
            className="p-3 rounded-xl"
            style={{ background: `linear-gradient(135deg, ${COLORS.purple}20, ${COLORS.blue}20)` }}
          >
            <Brain size={28} style={{ color: COLORS.purple }} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              {t("settingsProfilePg.seiTitle", "Evaluación SEI (Six Seconds)")}
              {profile?.sei?.lastSnapshot && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                  <CheckCircle2 size={12} className="inline mr-1" />
                  {t("settingsProfilePg.seiCompleted", "Evaluación completada")}
                </span>
              )}
            </h2>
            <p className="text-sm rowi-muted mt-1">{t("settingsProfilePg.seiDesc", "La evaluación SEI mide tu inteligencia emocional. Es la base de tu perfil Rowi.")}</p>
          </div>
        </div>

        {/* Estado SEI */}
        <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          {!profile?.sei?.requested && !profile?.sei?.lastSnapshot ? (
            /* No ha tomado ni solicitado SEI */
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-orange-500" />
              <div>
                <p className="font-medium">{t("settingsProfilePg.seiNotTaken", "Aún no has tomado la evaluación SEI")}</p>
                <p className="text-sm rowi-muted">{t("settingsProfilePg.seiRecommend", "Recomendamos tomar la evaluación cada 3 meses mínimo para ver tu progreso")}</p>
              </div>
            </div>
          ) : profile?.sei?.pendingArrival ? (
            /* Solicitado, esperando resultados */
            <div className="flex items-center gap-3">
              <Clock size={20} className="text-blue-500 animate-pulse" />
              <div>
                <p className="font-medium text-blue-600 dark:text-blue-400">{t("settingsProfilePg.seiRequested", "Evaluación solicitada")}</p>
                <p className="text-sm rowi-muted">{t("settingsProfilePg.seiPending", "Tus resultados llegarán en aproximadamente 48 horas")}</p>
                {profile.sei.requestedAt && (
                  <p className="text-xs rowi-muted mt-1">
                    {t("settingsProfilePg.requestedOn", "Solicitado el")}: {formatDate(profile.sei.requestedAt)}
                  </p>
                )}
              </div>
            </div>
          ) : profile?.sei?.lastSnapshot ? (
            /* Tiene evaluación completada */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-green-500" />
                  <div>
                    <p className="font-medium text-green-600 dark:text-green-400">
                      {t("settingsProfilePg.seiLastDate", "Última evaluación:")} {formatDate(profile.sei.lastSnapshot.at)}
                    </p>
                    {profile.sei.lastSnapshot.brainStyle && (
                      <p className="text-sm rowi-muted">
                        {t("settingsProfilePg.brainStyle", "Estilo Cerebral")}: <span className="font-medium">{profile.sei.lastSnapshot.brainStyle}</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold" style={{ color: COLORS.purple }}>
                    {profile.sei.lastSnapshot.total}
                  </div>
                  <div className="text-xs rowi-muted">{t("settingsProfilePg.eqTotal", "EQ Total")}</div>
                </div>
              </div>

              {/* Próxima recomendada */}
              {profile.sei.nextRecommendedDate && (
                <div className="flex items-center gap-2 text-sm p-2 rounded bg-purple-50 dark:bg-purple-900/20">
                  <Calendar size={16} style={{ color: COLORS.purple }} />
                  <span>{t("settingsProfilePg.seiNextRecommended", "Próxima evaluación recomendada:")}</span>
                  <span className="font-medium">{formatDate(profile.sei.nextRecommendedDate)}</span>
                </div>
              )}

              {/* Opción de retomar */}
              <div className="flex items-center justify-between pt-2 border-t dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <RefreshCw size={16} className="rowi-muted" />
                  <span className="text-sm">{t("settingsProfilePg.seiRetake", "Volver a Tomar SEI")}</span>
                </div>
                <div className="flex items-center gap-2">
                  {profile.sei.canRetakeFreely ? (
                    <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                      <Star size={14} />
                      {t("settingsProfilePg.seiRetakeFree", "Gratis (incluido en tu plan)")}
                    </span>
                  ) : (
                    <span className="text-sm text-orange-600 dark:text-orange-400 flex items-center gap-1">
                      <DollarSign size={14} />
                      {t("settingsProfilePg.seiRetakePaid", "Costo: $50 USD")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Botón para tomar/retomar SEI */}
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            className="rowi-btn-primary flex items-center gap-2"
            onClick={() => setShowSeiLinks(!showSeiLinks)}
          >
            <ExternalLink size={16} />
            {profile?.sei?.lastSnapshot ? t("settingsProfilePg.seiRetake", "Volver a Tomar SEI") : t("settingsProfilePg.seiTakeNow", "Tomar Evaluación SEI")}
          </button>
        </div>

        {/* Links SEI disponibles */}
        <AnimatePresence>
          {showSeiLinks && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 space-y-3"
            >
              <p className="text-sm font-medium">{t("settingsProfilePg.seiSelectLink", "Selecciona un link para comenzar:")}</p>
              {profile?.seiLinks && profile.seiLinks.length > 0 ? (
                <div className="grid gap-2">
                  {profile.seiLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-lg border hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                          <Globe size={16} style={{ color: COLORS.purple }} />
                        </div>
                        <div>
                          <p className="font-medium">{link.name}</p>
                          {link.description && (
                            <p className="text-xs rowi-muted">{link.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700">
                          {link.language.toUpperCase()}
                        </span>
                        {link.isDefault && (
                          <Star size={14} className="text-yellow-500" />
                        )}
                        <ExternalLink size={14} className="rowi-muted" />
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <AlertCircle size={24} className="mx-auto text-orange-500 mb-2" />
                  <p className="text-sm rowi-muted">
                    {t(
                      "settingsProfilePg.noSeiLinks",
                      "No hay links de SEI disponibles en este momento. Por favor contacta al administrador."
                    )}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* ========== EMAILS SECTION ========== */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rowi-card"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl" style={{ background: `${COLORS.blue}20` }}>
            <Mail size={24} style={{ color: COLORS.blue }} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{t("settingsProfilePg.emailsTitle", "Correos Electrónicos")}</h2>
            <p className="text-sm rowi-muted">{t("settingsProfilePg.emailsDesc", "Agrega correos adicionales para vincular tus cuentas corporativas")}</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {/* Email principal */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Mail size={14} style={{ color: COLORS.blue }} />
              </div>
              <div>
                <p className="font-medium">{profile?.user?.email}</p>
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  {t("settingsProfilePg.emailPrimary", "Principal")} · {t("settingsProfilePg.emailVerified", "Verificado")}
                </p>
              </div>
            </div>
            <Shield size={18} className="text-green-500" />
          </div>

          {/* Emails adicionales */}
          {profile?.emails?.filter((e) => e.email !== profile.user.email).map((email) => (
            <div
              key={email.id}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  {email.label === "work" ? (
                    <Briefcase size={14} className="rowi-muted" />
                  ) : (
                    <Mail size={14} className="rowi-muted" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{email.email}</p>
                  <p className="text-xs rowi-muted flex items-center gap-1">
                    {email.label === "work" ? t("settingsProfilePg.emailWork", "Trabajo") : email.label === "personal" ? t("settingsProfilePg.emailPersonal", "Personal") : t("settingsProfilePg.emailAlt", "Alternativo")}
                    {email.verified ? (
                      <span className="text-green-600 dark:text-green-400 flex items-center gap-1 ml-2">
                        <CheckCircle2 size={10} />
                        {t("settingsProfilePg.emailVerified", "Verificado")}
                      </span>
                    ) : (
                      <span className="text-orange-600 dark:text-orange-400 flex items-center gap-1 ml-2">
                        <Clock size={10} />
                        {t("settingsProfilePg.emailPendingVerification", "Pendiente de verificación")}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeEmail(email.id)}
                className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <X size={16} className="text-red-500" />
              </button>
            </div>
          ))}

          {/* Agregar email */}
          <AnimatePresence>
            {showAddEmail ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 rounded-lg border-2 border-dashed border-blue-200 dark:border-blue-800"
              >
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder={t("settingsProfilePg.emailAddPlaceholder", "correo@empresa.com")}
                    className="flex-1 px-3 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900"
                  />
                  <select
                    value={newEmailLabel}
                    onChange={(e) => setNewEmailLabel(e.target.value as any)}
                    className="px-3 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900"
                  >
                    <option value="work">{t("settingsProfilePg.emailWork", "Trabajo")}</option>
                    <option value="personal">{t("settingsProfilePg.emailPersonal", "Personal")}</option>
                    <option value="alt">{t("settingsProfilePg.emailAlt", "Alternativo")}</option>
                  </select>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={addEmail} className="rowi-btn-primary text-sm">
                    <Plus size={14} className="mr-1" />
                    {t("settingsProfilePg.emailAdd", "Agregar correo")}
                  </button>
                  <button
                    onClick={() => setShowAddEmail(false)}
                    className="rowi-btn text-sm"
                  >
                    {t("settingsProfilePg.cancel", "Cancelar")}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setShowAddEmail(true)}
                className="w-full p-3 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors flex items-center justify-center gap-2 rowi-muted hover:text-blue-600"
              >
                <Plus size={18} />
                {t("settingsProfilePg.emailAdd", "Agregar correo")}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.section>

      {/* ========== AFFINITY DATA SECTION ========== */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rowi-card"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl" style={{ background: `${COLORS.pink}20` }}>
            <Heart size={24} style={{ color: COLORS.pink }} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{t("settingsProfilePg.affinityTitle", "Datos para Affinity")}</h2>
            <p className="text-sm rowi-muted">{t("settingsProfilePg.affinityDesc", "Estos datos nos ayudan a conectarte con personas afines en el Rowiverse")}</p>
          </div>
        </div>

        <div className="mt-4 grid md:grid-cols-2 gap-4">
          {/* Profesión */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <Briefcase size={14} style={{ color: COLORS.purple }} />
              {t("settingsProfilePg.profession", "Profesión")}
            </label>
            <input
              type="text"
              value={affinity.profession}
              onChange={(e) => setAffinity((p) => ({ ...p, profession: e.target.value }))}
              placeholder={t("settingsProfilePg.professionPlaceholder", "Ej: Ingeniero de Software, Diseñador UX...")}
              className="w-full px-3 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900"
            />
          </div>

          {/* Industria */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <Zap size={14} style={{ color: COLORS.blue }} />
              {t("settingsProfilePg.industry", "Industria")}
            </label>
            <input
              type="text"
              value={affinity.industry}
              onChange={(e) => setAffinity((p) => ({ ...p, industry: e.target.value }))}
              placeholder={t("settingsProfilePg.industryPlaceholder", "Ej: Tecnología, Salud, Educación...")}
              className="w-full px-3 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900"
            />
          </div>

          {/* Años de experiencia */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <Clock size={14} style={{ color: COLORS.orange }} />
              {t("settingsProfilePg.yearsExperience", "Años de experiencia")}
            </label>
            <select
              value={affinity.yearsExperience}
              onChange={(e) => setAffinity((p) => ({ ...p, yearsExperience: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900"
            >
              <option value="">--</option>
              <option value="0-2">0-2</option>
              <option value="3-5">3-5</option>
              <option value="6-10">6-10</option>
              <option value="11-20">11-20</option>
              <option value="20+">20+</option>
            </select>
          </div>

          {/* Nivel educativo */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <GraduationCap size={14} style={{ color: COLORS.green }} />
              {t("settingsProfilePg.education", "Nivel educativo")}
            </label>
            <select
              value={affinity.education}
              onChange={(e) => setAffinity((p) => ({ ...p, education: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900"
            >
              <option value="">--</option>
              {[
                { value: "Secundaria", label: t("settingsProfilePg.eduOptHighSchool", "Secundaria") },
                { value: "Técnico", label: t("settingsProfilePg.eduOptTechnical", "Técnico") },
                { value: "Universitario", label: t("settingsProfilePg.eduOptBachelor", "Universitario") },
                { value: "Maestría", label: t("settingsProfilePg.eduOptMaster", "Maestría") },
                { value: "Doctorado", label: t("settingsProfilePg.eduOptPhd", "Doctorado") },
              ].map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Estilo de trabajo */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <Users size={14} style={{ color: COLORS.purple }} />
              {t("settingsProfilePg.workStyle", "Estilo de trabajo")}
            </label>
            <select
              value={affinity.workStyle}
              onChange={(e) => setAffinity((p) => ({ ...p, workStyle: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900"
            >
              <option value="">--</option>
              {[
                { value: "Remoto", label: t("settingsProfilePg.workStyleRemote", "Remoto") },
                { value: "Híbrido", label: t("settingsProfilePg.workStyleHybrid", "Híbrido") },
                { value: "Presencial", label: t("settingsProfilePg.workStyleOnsite", "Presencial") },
                { value: "Flexible", label: t("settingsProfilePg.workStyleFlexible", "Flexible") },
              ].map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Tamaño de equipo */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <Users size={14} style={{ color: COLORS.blue }} />
              {t("settingsProfilePg.teamSize", "Tamaño de equipo preferido")}
            </label>
            <select
              value={affinity.teamSize}
              onChange={(e) => setAffinity((p) => ({ ...p, teamSize: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900"
            >
              <option value="">--</option>
              {[
                { value: "Solo", label: t("settingsProfilePg.teamSizeSolo", "Solo") },
                { value: "Pequeño (2-5)", label: t("settingsProfilePg.teamSizeSmall", "Pequeño (2-5)") },
                { value: "Mediano (6-15)", label: t("settingsProfilePg.teamSizeMedium", "Mediano (6-15)") },
                { value: "Grande (15+)", label: t("settingsProfilePg.teamSizeLarge", "Grande (15+)") },
              ].map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Idiomas */}
        <div className="mt-4">
          <label className="text-sm font-medium flex items-center gap-2 mb-2">
            <Globe size={14} style={{ color: COLORS.purple }} />
            {t("settingsProfilePg.languages", "Idiomas que hablas")}
          </label>
          <Chips
            value={affinity.languages}
            onChange={(v) => setAffinity((p) => ({ ...p, languages: v }))}
            placeholder={t("settingsProfilePg.languagesPlaceholder", "Español, Inglés, Portugués...")}
          />
        </div>

        {/* Intereses profesionales */}
        <div className="mt-4">
          <label className="text-sm font-medium flex items-center gap-2 mb-2">
            <Sparkles size={14} style={{ color: COLORS.pink }} />
            {t("settingsProfilePg.interests", "Intereses profesionales")}
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {SUGGESTED_INTERESTS.map((s) => (
              <button
                key={s.key}
                className="rowi-chip"
                onClick={() => addSuggestion("interests", t(s.key, s.es), "affinity")}
              >
                {t(s.key, s.es)}
              </button>
            ))}
          </div>
          <Chips
            value={affinity.interests}
            onChange={(v) => setAffinity((p) => ({ ...p, interests: v }))}
            placeholder={t("settingsProfilePg.interestsPlaceholder", "IA, Liderazgo, Innovación...")}
          />
        </div>

        {/* Metas */}
        <div className="mt-4">
          <label className="text-sm font-medium flex items-center gap-2 mb-2">
            <Star size={14} style={{ color: COLORS.orange }} />
            {t("settingsProfilePg.goals", "Metas actuales")}
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {SUGGESTED_GOALS.map((s) => (
              <button
                key={s.key}
                className="rowi-chip"
                onClick={() => addSuggestion("goals", t(s.key, s.es), "affinity")}
              >
                {t(s.key, s.es)}
              </button>
            ))}
          </div>
          <Chips
            value={affinity.goals}
            onChange={(v) => setAffinity((p) => ({ ...p, goals: v }))}
            placeholder={t("settingsProfilePg.goalsPlaceholder", "Crecer profesionalmente, Emprender...")}
          />
        </div>

        {/* Busco conectar con */}
        <div className="mt-4">
          <label className="text-sm font-medium flex items-center gap-2 mb-2">
            <Heart size={14} style={{ color: COLORS.pink }} />
            {t("settingsProfilePg.lookingFor", "Busco conectar con personas que...")}
          </label>
          <Chips
            value={affinity.lookingFor}
            onChange={(v) => setAffinity((p) => ({ ...p, lookingFor: v }))}
            placeholder={t("settingsProfilePg.lookingForPlaceholder", "Compartan mis valores, Estén en mi industria...")}
          />
        </div>
      </motion.section>

      {/* ========== LOCATION SECTION ========== */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rowi-card"
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 rounded-xl" style={{ background: `${COLORS.green}20` }}>
            <MapPin size={24} style={{ color: COLORS.green }} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{t("settingsProfilePg.locationTitle", "Ubicación")}</h2>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">{t("settingsProfilePg.countryLabel", "País")}</label>
            <input
              type="text"
              value={location.country}
              onChange={(e) => setLocation((p) => ({ ...p, country: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">{t("settingsProfilePg.regionLabel", "Región/Estado")}</label>
            <input
              type="text"
              value={location.region}
              onChange={(e) => setLocation((p) => ({ ...p, region: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">{t("settingsProfilePg.cityLabel", "Ciudad")}</label>
            <input
              type="text"
              value={location.city}
              onChange={(e) => setLocation((p) => ({ ...p, city: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">{t("settingsProfilePg.timezoneLabel", "Zona horaria")}</label>
            <input
              type="text"
              value={location.timezone}
              onChange={(e) => setLocation((p) => ({ ...p, timezone: e.target.value }))}
              placeholder="America/Lima"
              className="w-full px-3 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900"
            />
          </div>
        </div>
      </motion.section>

      {/* ========== COMMUNICATION SECTION ========== */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rowi-card"
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 rounded-xl" style={{ background: `${COLORS.purple}20` }}>
            <MessageSquare size={24} style={{ color: COLORS.purple }} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{t("settingsProfilePg.commTitle", "Preferencias de Comunicación")}</h2>
            <p className="text-sm rowi-muted">{t("settingsProfilePg.commDesc", "Define cómo prefieres comunicarte y recibir información")}</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Canales */}
          <div>
            <label className="text-sm font-medium mb-2 block">{t("settingsProfilePg.channels", "Canales preferidos")}</label>
            <div className="flex flex-wrap gap-2">
              {([
                { id: "email", label: t("settingsProfilePg.channelEmail", "Email") },
                { id: "whatsapp", label: t("settingsProfilePg.channelWhatsapp", "WhatsApp") },
                { id: "sms", label: t("settingsProfilePg.channelSms", "SMS") },
                { id: "call", label: t("settingsProfilePg.channelCall", "Llamada") },
              ] as const).map((ch) => (
                <label key={ch.id} className="rowi-chip inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.channels[ch.id]}
                    onChange={(e) =>
                      setPrefs((p) => ({
                        ...p,
                        channels: { ...p.channels, [ch.id]: e.target.checked },
                      }))
                    }
                    className="rounded"
                  />
                  <span>{ch.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Tono */}
            <div>
              <label className="text-sm font-medium mb-2 block">{t("settingsProfilePg.tone", "Tono preferido")}</label>
              <select
                value={prefs.tone}
                onChange={(e) => setPrefs((p) => ({ ...p, tone: e.target.value as any }))}
                className="w-full px-3 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900"
              >
                <option value="directo">{t("settingsProfilePg.toneDirecto", "Directo")}</option>
                <option value="empatico">{t("settingsProfilePg.toneEmpatico", "Empático")}</option>
                <option value="neutral">{t("settingsProfilePg.toneNeutral", "Neutral")}</option>
              </select>
            </div>
            {/* Duración reunión */}
            <div>
              <label className="text-sm font-medium mb-2 block">{t("settingsProfilePg.meeting", "Duración de reunión ideal")}</label>
              <Select
                value={prefs.meeting}
                onChange={(v) => setPrefs((p) => ({ ...p, meeting: v as any }))}
                options={["5-10min", "15-20min", "30min"]}
              />
            </div>
          </div>
        </div>
      </motion.section>

      {/* ========== COMMUNICATION STYLES SECTION ========== */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="rowi-card"
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 rounded-xl" style={{ background: `${COLORS.pink}20` }}>
            <Sparkles size={24} style={{ color: COLORS.pink }} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{t("settingsProfilePg.commStyleTitle", "Estilos de Comunicación")}</h2>
          </div>
        </div>

        {commIsDraft && (
          <p className="text-xs text-[var(--rowi-muted)] bg-[var(--rowi-chip)] rounded-lg px-3 py-2 mb-3">
            ✨ {t("settingsProfilePg.commDraftHint", "Esto es lo que entendimos de tu Rowi Test — edítalo libremente.")}
          </p>
        )}

        <div className="space-y-4">
          {/* Cómo me comunico */}
          <div>
            <label className="text-sm font-medium mb-2 block">{t("settingsProfilePg.commStyleSelf", "Cómo suelo comunicarme")}</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {COMM_STYLES_ME.map((s) => (
                <button
                  key={s.key}
                  className="rowi-chip"
                  onClick={() => addSuggestion("commStyleSelf", t(s.key, s.es), "prefs")}
                >
                  {t(s.key, s.es)}
                </button>
              ))}
            </div>
            <Chips
              value={prefs.commStyleSelf}
              onChange={(v) => setPrefs((p) => ({ ...p, commStyleSelf: v }))}
              placeholder=""
            />
          </div>

          {/* Cómo prefiero que me comuniquen */}
          <div>
            <label className="text-sm font-medium mb-2 block">{t("settingsProfilePg.commStyleExpect", "Cómo prefiero que se comuniquen conmigo")}</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {COMM_STYLES_TO_OTHERS.map((s) => (
                <button
                  key={s.key}
                  className="rowi-chip"
                  onClick={() => addSuggestion("commExpectations", t(s.key, s.es), "prefs")}
                >
                  {t(s.key, s.es)}
                </button>
              ))}
            </div>
            <Chips
              value={prefs.commExpectations}
              onChange={(v) => setPrefs((p) => ({ ...p, commExpectations: v }))}
              placeholder=""
            />
          </div>
        </div>
      </motion.section>

      {/* ========== ABOUT ME SECTION ========== */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rowi-card"
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 rounded-xl" style={{ background: `${COLORS.blue}20` }}>
            <User size={24} style={{ color: COLORS.blue }} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{t("settingsProfilePg.aboutTitle", "Acerca de Mí")}</h2>
          </div>
        </div>

        <div className="space-y-4">
          {/* Bio */}
          <div>
            <label className="text-sm font-medium mb-2 block">{t("settingsProfilePg.bio", "Bio")}</label>
            <TextArea
              value={prefs.bio}
              onChange={(v) => setPrefs((p) => ({ ...p, bio: v }))}
              rows={3}
              placeholder={t("settingsProfilePg.bioPlaceholder", "Cuéntanos sobre ti...")}
            />
          </div>

          {/* Valores */}
          <div>
            <label className="text-sm font-medium mb-2 block">{t("settingsProfilePg.values", "Valores")}</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {SUGGESTED_VALUES.map((s) => (
                <button
                  key={s.key}
                  className="rowi-chip"
                  onClick={() => addSuggestion("values", t(s.key, s.es), "prefs")}
                >
                  {t(s.key, s.es)}
                </button>
              ))}
            </div>
            <Chips
              value={prefs.values}
              onChange={(v) => setPrefs((p) => ({ ...p, values: v }))}
              placeholder=""
            />
          </div>

          {/* Hobbies */}
          <div>
            <label className="text-sm font-medium mb-2 block">{t("settingsProfilePg.hobbies", "Hobbies")}</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {SUGGESTED_HOBBIES.map((s) => (
                <button
                  key={s.key}
                  className="rowi-chip"
                  onClick={() => addSuggestion("hobbies", t(s.key, s.es), "prefs")}
                >
                  {t(s.key, s.es)}
                </button>
              ))}
            </div>
            <Chips
              value={prefs.hobbies}
              onChange={(v) => setPrefs((p) => ({ ...p, hobbies: v }))}
              placeholder=""
            />
          </div>
        </div>
      </motion.section>

      {/* ========== PRIVACY SECTION ========== */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="rowi-card"
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 rounded-xl" style={{ background: `${COLORS.purple}20` }}>
            <Eye size={24} style={{ color: COLORS.purple }} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{t("settingsProfilePg.visibilityTitle", "Privacidad y Visibilidad")}</h2>
            <p className="text-sm rowi-muted">{t("settingsProfilePg.visibilityDesc", "Controla qué información es visible para otros en el Rowiverse")}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="text-sm font-medium mb-2">{t("settingsProfilePg.showBrain", "Mostrar Brain Style")}</div>
            <Toggle
              checked={prefs.visibility.showBrain}
              onChange={(v) =>
                setPrefs((p) => ({ ...p, visibility: { ...p.visibility, showBrain: v } }))
              }
            />
          </div>
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="text-sm font-medium mb-2">{t("settingsProfilePg.showTalents", "Mostrar Talentos")}</div>
            <Toggle
              checked={prefs.visibility.showTalents}
              onChange={(v) =>
                setPrefs((p) => ({ ...p, visibility: { ...p.visibility, showTalents: v } }))
              }
            />
          </div>
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="text-sm font-medium mb-2">{t("settingsProfilePg.showContact", "Mostrar Contacto")}</div>
            <Toggle
              checked={prefs.visibility.showContact}
              onChange={(v) =>
                setPrefs((p) => ({ ...p, visibility: { ...p.visibility, showContact: v } }))
              }
            />
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div>
              <div className="text-sm font-medium">{t("settingsProfilePg.allowAI", "Permitir análisis de IA")}</div>
              <p className="text-xs rowi-muted">
                {t("settingsProfilePg.allowAIDesc", "Permite que Rowi analice tus datos para darte mejores recomendaciones")}
              </p>
            </div>
            <Toggle
              checked={privacy.allowAI}
              onChange={(v) => setPrivacy((p) => ({ ...p, allowAI: v }))}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div>
              <div className="text-sm font-medium">{t("settingsProfilePg.contributeRowiverse", "Contribuir datos al Rowiverse")}</div>
              <p className="text-xs rowi-muted">{t("settingsProfilePg.contributeDesc", "Tus datos anónimos ayudan a mejorar los benchmarks globales")}</p>
            </div>
            <Toggle
              checked={privacy.contributeToRowiverse}
              onChange={(v) => setPrivacy((p) => ({ ...p, contributeToRowiverse: v }))}
            />
          </div>
        </div>
      </motion.section>

      {/* ========== SAVE BUTTON ========== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="sticky bottom-4 flex items-center justify-center gap-4 p-4 rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-lg border dark:border-gray-800"
      >
        <button
          onClick={save}
          disabled={saving}
          className="rowi-btn-primary px-8 py-3 text-lg flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              {t("settingsProfilePg.saving", "Guardando...")}
            </>
          ) : (
            <>
              <CheckCircle2 size={20} />
              {t("settingsProfilePg.save", "Guardar Cambios")}
            </>
          )}
        </button>
        {msg && (
          <span className="text-sm font-medium">{msg}</span>
        )}
      </motion.div>
    </main>
  );
}
