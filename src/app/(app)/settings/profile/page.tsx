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

/* ====== Traducciones inline ====== */
const T: Record<string, Record<string, string>> = {
  // Títulos principales
  title: { es: "Mi Perfil Rowi", en: "My Rowi Profile" },
  subtitle: { es: "Configura tu perfil para obtener la mejor experiencia personalizada", en: "Configure your profile for the best personalized experience" },

  // Sección SEI
  seiTitle: { es: "Evaluación SEI (Six Seconds)", en: "SEI Assessment (Six Seconds)" },
  seiDesc: { es: "La evaluación SEI mide tu inteligencia emocional. Es la base de tu perfil Rowi.", en: "The SEI assessment measures your emotional intelligence. It's the foundation of your Rowi profile." },
  seiNotTaken: { es: "Aún no has tomado la evaluación SEI", en: "You haven't taken the SEI assessment yet" },
  seiRequested: { es: "Evaluación solicitada", en: "Assessment requested" },
  seiPending: { es: "Tus resultados llegarán en aproximadamente 48 horas", en: "Your results will arrive in approximately 48 hours" },
  seiCompleted: { es: "Evaluación completada", en: "Assessment completed" },
  seiLastDate: { es: "Última evaluación:", en: "Last assessment:" },
  seiTakeNow: { es: "Tomar Evaluación SEI", en: "Take SEI Assessment" },
  seiRetake: { es: "Volver a Tomar SEI", en: "Retake SEI" },
  seiRetakeFree: { es: "Gratis (incluido en tu plan)", en: "Free (included in your plan)" },
  seiRetakePaid: { es: "Costo: $50 USD", en: "Cost: $50 USD" },
  seiRecommend: { es: "Recomendamos tomar la evaluación cada 3 meses mínimo para ver tu progreso", en: "We recommend taking the assessment at least every 3 months to track your progress" },
  seiNextRecommended: { es: "Próxima evaluación recomendada:", en: "Next recommended assessment:" },
  seiAvailableLinks: { es: "Links de evaluación disponibles", en: "Available assessment links" },
  seiSelectLink: { es: "Selecciona un link para comenzar:", en: "Select a link to start:" },

  // Sección Emails
  emailsTitle: { es: "Correos Electrónicos", en: "Email Addresses" },
  emailsDesc: { es: "Agrega correos adicionales para vincular tus cuentas corporativas", en: "Add additional emails to link your corporate accounts" },
  emailPrimary: { es: "Principal", en: "Primary" },
  emailWork: { es: "Trabajo", en: "Work" },
  emailPersonal: { es: "Personal", en: "Personal" },
  emailAlt: { es: "Alternativo", en: "Alternative" },
  emailAdd: { es: "Agregar correo", en: "Add email" },
  emailAddPlaceholder: { es: "correo@empresa.com", en: "email@company.com" },
  emailVerified: { es: "Verificado", en: "Verified" },
  emailPendingVerification: { es: "Pendiente de verificación", en: "Pending verification" },

  // Sección Affinity
  affinityTitle: { es: "Datos para Affinity", en: "Affinity Data" },
  affinityDesc: { es: "Estos datos nos ayudan a conectarte con personas afines en el Rowiverse", en: "This data helps us connect you with like-minded people in the Rowiverse" },

  // Campos de Affinity
  profession: { es: "Profesión", en: "Profession" },
  professionPlaceholder: { es: "Ej: Ingeniero de Software, Diseñador UX...", en: "E.g.: Software Engineer, UX Designer..." },
  industry: { es: "Industria", en: "Industry" },
  industryPlaceholder: { es: "Ej: Tecnología, Salud, Educación...", en: "E.g.: Technology, Healthcare, Education..." },
  yearsExperience: { es: "Años de experiencia", en: "Years of experience" },
  education: { es: "Nivel educativo", en: "Education level" },
  eduOptions: {
    es: "Secundaria,Técnico,Universitario,Maestría,Doctorado",
    en: "High School,Technical,Bachelor,Master,PhD"
  },
  languages: { es: "Idiomas que hablas", en: "Languages you speak" },
  languagesPlaceholder: { es: "Español, Inglés, Portugués...", en: "Spanish, English, Portuguese..." },
  interests: { es: "Intereses profesionales", en: "Professional interests" },
  interestsPlaceholder: { es: "IA, Liderazgo, Innovación...", en: "AI, Leadership, Innovation..." },
  goals: { es: "Metas actuales", en: "Current goals" },
  goalsPlaceholder: { es: "Crecer profesionalmente, Emprender...", en: "Professional growth, Entrepreneurship..." },
  lookingFor: { es: "Busco conectar con personas que...", en: "Looking to connect with people who..." },
  lookingForPlaceholder: { es: "Compartan mis valores, Estén en mi industria...", en: "Share my values, Are in my industry..." },
  workStyle: { es: "Estilo de trabajo", en: "Work style" },
  workStyleOptions: {
    es: "Remoto,Híbrido,Presencial,Flexible",
    en: "Remote,Hybrid,On-site,Flexible"
  },
  teamSize: { es: "Tamaño de equipo preferido", en: "Preferred team size" },
  teamSizeOptions: {
    es: "Solo,Pequeño (2-5),Mediano (6-15),Grande (15+)",
    en: "Solo,Small (2-5),Medium (6-15),Large (15+)"
  },

  // Comunicación
  commTitle: { es: "Preferencias de Comunicación", en: "Communication Preferences" },
  commDesc: { es: "Define cómo prefieres comunicarte y recibir información", en: "Define how you prefer to communicate and receive information" },
  channels: { es: "Canales preferidos", en: "Preferred channels" },
  channelEmail: { es: "Email", en: "Email" },
  channelWhatsapp: { es: "WhatsApp", en: "WhatsApp" },
  channelSms: { es: "SMS", en: "SMS" },
  channelCall: { es: "Llamada", en: "Call" },
  tone: { es: "Tono preferido", en: "Preferred tone" },
  toneDirecto: { es: "Directo", en: "Direct" },
  toneEmpatico: { es: "Empático", en: "Empathetic" },
  toneNeutral: { es: "Neutral", en: "Neutral" },
  meeting: { es: "Duración de reunión ideal", en: "Ideal meeting duration" },

  // Estilos de comunicación
  commStyleTitle: { es: "Estilos de Comunicación", en: "Communication Styles" },
  commStyleSelf: { es: "Cómo suelo comunicarme", en: "How I usually communicate" },
  commStyleExpect: { es: "Cómo prefiero que se comuniquen conmigo", en: "How I prefer others to communicate with me" },

  // Acerca de mí
  aboutTitle: { es: "Acerca de Mí", en: "About Me" },
  bio: { es: "Bio", en: "Bio" },
  bioPlaceholder: { es: "Cuéntanos sobre ti...", en: "Tell us about yourself..." },
  values: { es: "Valores", en: "Values" },
  hobbies: { es: "Hobbies", en: "Hobbies" },

  // Visibilidad
  visibilityTitle: { es: "Privacidad y Visibilidad", en: "Privacy & Visibility" },
  visibilityDesc: { es: "Controla qué información es visible para otros en el Rowiverse", en: "Control what information is visible to others in the Rowiverse" },
  showBrain: { es: "Mostrar Brain Style", en: "Show Brain Style" },
  showTalents: { es: "Mostrar Talentos", en: "Show Talents" },
  showContact: { es: "Mostrar Contacto", en: "Show Contact Info" },
  allowAI: { es: "Permitir análisis de IA", en: "Allow AI analysis" },
  contributeRowiverse: { es: "Contribuir datos al Rowiverse", en: "Contribute data to Rowiverse" },
  contributeDesc: { es: "Tus datos anónimos ayudan a mejorar los benchmarks globales", en: "Your anonymous data helps improve global benchmarks" },

  // Ubicación
  locationTitle: { es: "Ubicación", en: "Location" },
  countryLabel: { es: "País", en: "Country" },
  regionLabel: { es: "Región/Estado", en: "Region/State" },
  cityLabel: { es: "Ciudad", en: "City" },
  timezoneLabel: { es: "Zona horaria", en: "Timezone" },

  // Acciones
  save: { es: "Guardar Cambios", en: "Save Changes" },
  saving: { es: "Guardando...", en: "Saving..." },
  saved: { es: "Guardado", en: "Saved" },
  error: { es: "Error al guardar", en: "Error saving" },
  cancel: { es: "Cancelar", en: "Cancel" },

  // SEI extras
  brainStyle: { es: "Estilo Cerebral", en: "Brain Style" },
  eqTotal: { es: "EQ Total", en: "EQ Total" },
  requestedOn: { es: "Solicitado el", en: "Requested on" },

  // Privacidad extras
  allowAIDesc: { es: "Permite que Rowi analice tus datos para darte mejores recomendaciones", en: "Allow Rowi to analyze your data for better recommendations" },
};

/* ====== Sugerencias traducibles ====== */
const SUGGESTED_VALUES: Record<string, { es: string; en: string }[]> = {
  items: [
    { es: "Honestidad", en: "Honesty" },
    { es: "Respeto", en: "Respect" },
    { es: "Aprendizaje", en: "Learning" },
    { es: "Familia", en: "Family" },
    { es: "Impacto", en: "Impact" },
    { es: "Colaboración", en: "Collaboration" },
    { es: "Creatividad", en: "Creativity" },
    { es: "Excelencia", en: "Excellence" },
    { es: "Transparencia", en: "Transparency" },
    { es: "Autonomía", en: "Autonomy" },
  ],
};
const SUGGESTED_HOBBIES: Record<string, { es: string; en: string }[]> = {
  items: [
    { es: "Correr", en: "Running" },
    { es: "Leer", en: "Reading" },
    { es: "Gimnasio", en: "Gym" },
    { es: "Cocinar", en: "Cooking" },
    { es: "Viajar", en: "Traveling" },
    { es: "Fotografía", en: "Photography" },
    { es: "Música", en: "Music" },
    { es: "Pintura", en: "Painting" },
    { es: "Jardinería", en: "Gardening" },
    { es: "Gaming", en: "Gaming" },
  ],
};
const COMM_STYLES_ME: Record<string, { es: string; en: string }[]> = {
  items: [
    { es: "Directo", en: "Direct" },
    { es: "Empático", en: "Empathetic" },
    { es: "Detallado", en: "Detailed" },
    { es: "Breve", en: "Brief" },
    { es: "Visual", en: "Visual" },
    { es: "Inspirador", en: "Inspiring" },
  ],
};
const COMM_STYLES_TO_OTHERS: Record<string, { es: string; en: string }[]> = {
  items: [
    { es: "Necesito contexto", en: "I need context" },
    { es: "Prefiero brevedad", en: "I prefer brevity" },
    { es: "Muéstrame datos", en: "Show me data" },
    { es: "Aclaremos riesgos", en: "Let's clarify risks" },
    { es: "Vamos al siguiente paso", en: "Let's move forward" },
    { es: "Valida emoción primero", en: "Validate emotions first" },
  ],
};
const SUGGESTED_INTERESTS: Record<string, { es: string; en: string }[]> = {
  items: [
    { es: "Liderazgo", en: "Leadership" },
    { es: "Innovación", en: "Innovation" },
    { es: "IA", en: "AI" },
    { es: "Sostenibilidad", en: "Sustainability" },
    { es: "Emprendimiento", en: "Entrepreneurship" },
    { es: "Desarrollo personal", en: "Personal development" },
    { es: "Coaching", en: "Coaching" },
    { es: "Bienestar", en: "Wellness" },
    { es: "Tecnología", en: "Technology" },
    { es: "Educación", en: "Education" },
  ],
};
const SUGGESTED_GOALS: Record<string, { es: string; en: string }[]> = {
  items: [
    { es: "Crecimiento profesional", en: "Professional growth" },
    { es: "Balance vida-trabajo", en: "Work-life balance" },
    { es: "Emprender", en: "Start a business" },
    { es: "Liderar equipos", en: "Lead teams" },
    { es: "Cambiar de industria", en: "Change industry" },
    { es: "Impacto social", en: "Social impact" },
  ],
};

/* ====== Colores Rowi ====== */
const COLORS = {
  purple: "#7a59c9",
  blue: "#31a2e3",
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
  const { locale } = useI18n();
  const lang = locale === "en" ? "en" : "es";
  const t = (key: string) => T[key]?.[lang] || T[key]?.es || key;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newEmailLabel, setNewEmailLabel] = useState<"work" | "personal" | "alt">("work");
  const [showAddEmail, setShowAddEmail] = useState(false);
  const [showSeiLinks, setShowSeiLinks] = useState(false);

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
    setMsg(t("saving"));

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
        setMsg(t("saved") + " ✅");
      } else {
        setMsg(t("error") + " ⚠️");
      }
    } catch (e) {
      setMsg(t("error") + " ❌");
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
    return new Date(dateStr).toLocaleDateString(lang === "en" ? "en-US" : "es-ES", {
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
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-500 to-pink-500 bg-clip-text text-transparent">
          {t("title")}
        </h1>
        <p className="text-sm rowi-muted mt-2">{t("subtitle")}</p>
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
              {t("seiTitle")}
              {profile?.sei?.lastSnapshot && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                  <CheckCircle2 size={12} className="inline mr-1" />
                  {t("seiCompleted")}
                </span>
              )}
            </h2>
            <p className="text-sm rowi-muted mt-1">{t("seiDesc")}</p>
          </div>
        </div>

        {/* Estado SEI */}
        <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          {!profile?.sei?.requested && !profile?.sei?.lastSnapshot ? (
            /* No ha tomado ni solicitado SEI */
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-orange-500" />
              <div>
                <p className="font-medium">{t("seiNotTaken")}</p>
                <p className="text-sm rowi-muted">{t("seiRecommend")}</p>
              </div>
            </div>
          ) : profile?.sei?.pendingArrival ? (
            /* Solicitado, esperando resultados */
            <div className="flex items-center gap-3">
              <Clock size={20} className="text-blue-500 animate-pulse" />
              <div>
                <p className="font-medium text-blue-600 dark:text-blue-400">{t("seiRequested")}</p>
                <p className="text-sm rowi-muted">{t("seiPending")}</p>
                {profile.sei.requestedAt && (
                  <p className="text-xs rowi-muted mt-1">
                    {t("requestedOn")}: {formatDate(profile.sei.requestedAt)}
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
                      {t("seiLastDate")} {formatDate(profile.sei.lastSnapshot.at)}
                    </p>
                    {profile.sei.lastSnapshot.brainStyle && (
                      <p className="text-sm rowi-muted">
                        {t("brainStyle")}: <span className="font-medium">{profile.sei.lastSnapshot.brainStyle}</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold" style={{ color: COLORS.purple }}>
                    {profile.sei.lastSnapshot.total}
                  </div>
                  <div className="text-xs rowi-muted">{t("eqTotal")}</div>
                </div>
              </div>

              {/* Próxima recomendada */}
              {profile.sei.nextRecommendedDate && (
                <div className="flex items-center gap-2 text-sm p-2 rounded bg-purple-50 dark:bg-purple-900/20">
                  <Calendar size={16} style={{ color: COLORS.purple }} />
                  <span>{t("seiNextRecommended")}</span>
                  <span className="font-medium">{formatDate(profile.sei.nextRecommendedDate)}</span>
                </div>
              )}

              {/* Opción de retomar */}
              <div className="flex items-center justify-between pt-2 border-t dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <RefreshCw size={16} className="rowi-muted" />
                  <span className="text-sm">{t("seiRetake")}</span>
                </div>
                <div className="flex items-center gap-2">
                  {profile.sei.canRetakeFreely ? (
                    <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                      <Star size={14} />
                      {t("seiRetakeFree")}
                    </span>
                  ) : (
                    <span className="text-sm text-orange-600 dark:text-orange-400 flex items-center gap-1">
                      <DollarSign size={14} />
                      {t("seiRetakePaid")}
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
            {profile?.sei?.lastSnapshot ? t("seiRetake") : t("seiTakeNow")}
          </button>
        </div>

        {/* Links SEI disponibles */}
        <AnimatePresence>
          {showSeiLinks && profile?.seiLinks && profile.seiLinks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 space-y-3"
            >
              <p className="text-sm font-medium">{t("seiSelectLink")}</p>
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
            <h2 className="text-lg font-semibold">{t("emailsTitle")}</h2>
            <p className="text-sm rowi-muted">{t("emailsDesc")}</p>
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
                  {t("emailPrimary")} · {t("emailVerified")}
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
                    {email.label === "work" ? t("emailWork") : email.label === "personal" ? t("emailPersonal") : t("emailAlt")}
                    {email.verified ? (
                      <span className="text-green-600 dark:text-green-400 flex items-center gap-1 ml-2">
                        <CheckCircle2 size={10} />
                        {t("emailVerified")}
                      </span>
                    ) : (
                      <span className="text-orange-600 dark:text-orange-400 flex items-center gap-1 ml-2">
                        <Clock size={10} />
                        {t("emailPendingVerification")}
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
                    placeholder={t("emailAddPlaceholder")}
                    className="flex-1 px-3 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900"
                  />
                  <select
                    value={newEmailLabel}
                    onChange={(e) => setNewEmailLabel(e.target.value as any)}
                    className="px-3 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900"
                  >
                    <option value="work">{t("emailWork")}</option>
                    <option value="personal">{t("emailPersonal")}</option>
                    <option value="alt">{t("emailAlt")}</option>
                  </select>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={addEmail} className="rowi-btn-primary text-sm">
                    <Plus size={14} className="mr-1" />
                    {t("emailAdd")}
                  </button>
                  <button
                    onClick={() => setShowAddEmail(false)}
                    className="rowi-btn text-sm"
                  >
                    {t("cancel")}
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
                {t("emailAdd")}
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
            <h2 className="text-lg font-semibold">{t("affinityTitle")}</h2>
            <p className="text-sm rowi-muted">{t("affinityDesc")}</p>
          </div>
        </div>

        <div className="mt-4 grid md:grid-cols-2 gap-4">
          {/* Profesión */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <Briefcase size={14} style={{ color: COLORS.purple }} />
              {t("profession")}
            </label>
            <input
              type="text"
              value={affinity.profession}
              onChange={(e) => setAffinity((p) => ({ ...p, profession: e.target.value }))}
              placeholder={t("professionPlaceholder")}
              className="w-full px-3 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900"
            />
          </div>

          {/* Industria */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <Zap size={14} style={{ color: COLORS.blue }} />
              {t("industry")}
            </label>
            <input
              type="text"
              value={affinity.industry}
              onChange={(e) => setAffinity((p) => ({ ...p, industry: e.target.value }))}
              placeholder={t("industryPlaceholder")}
              className="w-full px-3 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900"
            />
          </div>

          {/* Años de experiencia */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <Clock size={14} style={{ color: COLORS.orange }} />
              {t("yearsExperience")}
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
              {t("education")}
            </label>
            <select
              value={affinity.education}
              onChange={(e) => setAffinity((p) => ({ ...p, education: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900"
            >
              <option value="">--</option>
              {t("eduOptions").split(",").map((opt, i) => (
                <option key={i} value={opt.trim()}>{opt.trim()}</option>
              ))}
            </select>
          </div>

          {/* Estilo de trabajo */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <Users size={14} style={{ color: COLORS.purple }} />
              {t("workStyle")}
            </label>
            <select
              value={affinity.workStyle}
              onChange={(e) => setAffinity((p) => ({ ...p, workStyle: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900"
            >
              <option value="">--</option>
              {t("workStyleOptions").split(",").map((opt, i) => (
                <option key={i} value={opt.trim()}>{opt.trim()}</option>
              ))}
            </select>
          </div>

          {/* Tamaño de equipo */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <Users size={14} style={{ color: COLORS.blue }} />
              {t("teamSize")}
            </label>
            <select
              value={affinity.teamSize}
              onChange={(e) => setAffinity((p) => ({ ...p, teamSize: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900"
            >
              <option value="">--</option>
              {t("teamSizeOptions").split(",").map((opt, i) => (
                <option key={i} value={opt.trim()}>{opt.trim()}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Idiomas */}
        <div className="mt-4">
          <label className="text-sm font-medium flex items-center gap-2 mb-2">
            <Globe size={14} style={{ color: COLORS.purple }} />
            {t("languages")}
          </label>
          <Chips
            value={affinity.languages}
            onChange={(v) => setAffinity((p) => ({ ...p, languages: v }))}
            placeholder={t("languagesPlaceholder")}
          />
        </div>

        {/* Intereses profesionales */}
        <div className="mt-4">
          <label className="text-sm font-medium flex items-center gap-2 mb-2">
            <Sparkles size={14} style={{ color: COLORS.pink }} />
            {t("interests")}
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {SUGGESTED_INTERESTS.items.map((s, i) => (
              <button
                key={i}
                className="rowi-chip"
                onClick={() => addSuggestion("interests", s[lang], "affinity")}
              >
                {s[lang]}
              </button>
            ))}
          </div>
          <Chips
            value={affinity.interests}
            onChange={(v) => setAffinity((p) => ({ ...p, interests: v }))}
            placeholder={t("interestsPlaceholder")}
          />
        </div>

        {/* Metas */}
        <div className="mt-4">
          <label className="text-sm font-medium flex items-center gap-2 mb-2">
            <Star size={14} style={{ color: COLORS.orange }} />
            {t("goals")}
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {SUGGESTED_GOALS.items.map((s, i) => (
              <button
                key={i}
                className="rowi-chip"
                onClick={() => addSuggestion("goals", s[lang], "affinity")}
              >
                {s[lang]}
              </button>
            ))}
          </div>
          <Chips
            value={affinity.goals}
            onChange={(v) => setAffinity((p) => ({ ...p, goals: v }))}
            placeholder={t("goalsPlaceholder")}
          />
        </div>

        {/* Busco conectar con */}
        <div className="mt-4">
          <label className="text-sm font-medium flex items-center gap-2 mb-2">
            <Heart size={14} style={{ color: COLORS.pink }} />
            {t("lookingFor")}
          </label>
          <Chips
            value={affinity.lookingFor}
            onChange={(v) => setAffinity((p) => ({ ...p, lookingFor: v }))}
            placeholder={t("lookingForPlaceholder")}
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
            <h2 className="text-lg font-semibold">{t("locationTitle")}</h2>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">{t("countryLabel")}</label>
            <input
              type="text"
              value={location.country}
              onChange={(e) => setLocation((p) => ({ ...p, country: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">{t("regionLabel")}</label>
            <input
              type="text"
              value={location.region}
              onChange={(e) => setLocation((p) => ({ ...p, region: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">{t("cityLabel")}</label>
            <input
              type="text"
              value={location.city}
              onChange={(e) => setLocation((p) => ({ ...p, city: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">{t("timezoneLabel")}</label>
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
            <h2 className="text-lg font-semibold">{t("commTitle")}</h2>
            <p className="text-sm rowi-muted">{t("commDesc")}</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Canales */}
          <div>
            <label className="text-sm font-medium mb-2 block">{t("channels")}</label>
            <div className="flex flex-wrap gap-2">
              {(["email", "whatsapp", "sms", "call"] as const).map((ch) => (
                <label key={ch} className="rowi-chip inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.channels[ch]}
                    onChange={(e) =>
                      setPrefs((p) => ({
                        ...p,
                        channels: { ...p.channels, [ch]: e.target.checked },
                      }))
                    }
                    className="rounded"
                  />
                  <span>{t(`channel${ch.charAt(0).toUpperCase() + ch.slice(1)}`)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Tono */}
            <div>
              <label className="text-sm font-medium mb-2 block">{t("tone")}</label>
              <select
                value={prefs.tone}
                onChange={(e) => setPrefs((p) => ({ ...p, tone: e.target.value as any }))}
                className="w-full px-3 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900"
              >
                <option value="directo">{t("toneDirecto")}</option>
                <option value="empatico">{t("toneEmpatico")}</option>
                <option value="neutral">{t("toneNeutral")}</option>
              </select>
            </div>
            {/* Duración reunión */}
            <div>
              <label className="text-sm font-medium mb-2 block">{t("meeting")}</label>
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
            <h2 className="text-lg font-semibold">{t("commStyleTitle")}</h2>
          </div>
        </div>

        <div className="space-y-4">
          {/* Cómo me comunico */}
          <div>
            <label className="text-sm font-medium mb-2 block">{t("commStyleSelf")}</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {COMM_STYLES_ME.items.map((s, i) => (
                <button
                  key={i}
                  className="rowi-chip"
                  onClick={() => addSuggestion("commStyleSelf", s[lang], "prefs")}
                >
                  {s[lang]}
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
            <label className="text-sm font-medium mb-2 block">{t("commStyleExpect")}</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {COMM_STYLES_TO_OTHERS.items.map((s, i) => (
                <button
                  key={i}
                  className="rowi-chip"
                  onClick={() => addSuggestion("commExpectations", s[lang], "prefs")}
                >
                  {s[lang]}
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
            <h2 className="text-lg font-semibold">{t("aboutTitle")}</h2>
          </div>
        </div>

        <div className="space-y-4">
          {/* Bio */}
          <div>
            <label className="text-sm font-medium mb-2 block">{t("bio")}</label>
            <TextArea
              value={prefs.bio}
              onChange={(v) => setPrefs((p) => ({ ...p, bio: v }))}
              rows={3}
              placeholder={t("bioPlaceholder")}
            />
          </div>

          {/* Valores */}
          <div>
            <label className="text-sm font-medium mb-2 block">{t("values")}</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {SUGGESTED_VALUES.items.map((s, i) => (
                <button
                  key={i}
                  className="rowi-chip"
                  onClick={() => addSuggestion("values", s[lang], "prefs")}
                >
                  {s[lang]}
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
            <label className="text-sm font-medium mb-2 block">{t("hobbies")}</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {SUGGESTED_HOBBIES.items.map((s, i) => (
                <button
                  key={i}
                  className="rowi-chip"
                  onClick={() => addSuggestion("hobbies", s[lang], "prefs")}
                >
                  {s[lang]}
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
            <h2 className="text-lg font-semibold">{t("visibilityTitle")}</h2>
            <p className="text-sm rowi-muted">{t("visibilityDesc")}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="text-sm font-medium mb-2">{t("showBrain")}</div>
            <Toggle
              checked={prefs.visibility.showBrain}
              onChange={(v) =>
                setPrefs((p) => ({ ...p, visibility: { ...p.visibility, showBrain: v } }))
              }
            />
          </div>
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="text-sm font-medium mb-2">{t("showTalents")}</div>
            <Toggle
              checked={prefs.visibility.showTalents}
              onChange={(v) =>
                setPrefs((p) => ({ ...p, visibility: { ...p.visibility, showTalents: v } }))
              }
            />
          </div>
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="text-sm font-medium mb-2">{t("showContact")}</div>
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
              <div className="text-sm font-medium">{t("allowAI")}</div>
              <p className="text-xs rowi-muted">
                {t("allowAIDesc")}
              </p>
            </div>
            <Toggle
              checked={privacy.allowAI}
              onChange={(v) => setPrivacy((p) => ({ ...p, allowAI: v }))}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div>
              <div className="text-sm font-medium">{t("contributeRowiverse")}</div>
              <p className="text-xs rowi-muted">{t("contributeDesc")}</p>
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
              {t("saving")}
            </>
          ) : (
            <>
              <CheckCircle2 size={20} />
              {t("save")}
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
