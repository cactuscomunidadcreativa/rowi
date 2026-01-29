"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Save,
  Mail,
  MessageCircle,
  Phone,
  Key,
  Globe,
  Brain,
  Sparkles,
  Heart,
  Target,
  Zap,
  Eye,
  Users,
  Shield,
  BookOpen,
  Palette,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Loader2,
  AlertCircle,
  Info,
  RefreshCw,
  Egg,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  AdminPage,
  AdminCard,
  AdminButton,
  AdminInput,
  AdminSelect,
} from "@/components/admin/AdminPage";

/* =========================================================
   ⚙️ Rowi Admin — Platform Configuration
   ---------------------------------------------------------
   Manage messaging services, Six Seconds dictionary, and Rowi levels
========================================================= */

// Tab types
type ConfigTab = "messaging" | "sixseconds" | "rowi-levels" | "general";

interface MessagingConfig {
  email: {
    provider: "sendgrid" | "ses" | "mailgun" | "resend" | "smtp" | "none";
    apiKey: string;
    fromEmail: string;
    fromName: string;
    replyTo: string;
  };
  sms: {
    provider: "twilio" | "vonage" | "messagebird" | "none";
    accountSid: string;
    authToken: string;
    fromNumber: string;
  };
  whatsapp: {
    provider: "twilio" | "messagebird" | "360dialog" | "none";
    accountSid: string;
    authToken: string;
    fromNumber: string;
    templateNamespace?: string;
  };
}

interface SixSecondsCompetency {
  id: string;
  code: string; // EL, RP, ACT, etc.
  nameEs: string;
  nameEn: string;
  descriptionEs: string;
  descriptionEn: string;
  pursuit: "know" | "choose" | "give";
  color: string;
  icon: string;
  order: number;
}

interface RowiLevel {
  id: string;
  code: string;
  nameEs: string;
  nameEn: string;
  descriptionEs: string;
  descriptionEn: string;
  minScore: number;
  maxScore: number;
  color: string;
  icon: string;
  vectorImage: string;
  order: number;
}

// Default Six Seconds competencies
const DEFAULT_COMPETENCIES: SixSecondsCompetency[] = [
  { id: "1", code: "EL", nameEs: "Alfabetización Emocional", nameEn: "Emotional Literacy", descriptionEs: "Identificar y nombrar con precisión las emociones", descriptionEn: "Accurately identifying and naming emotions", pursuit: "know", color: "#1E88E5", icon: "BookOpen", order: 1 },
  { id: "2", code: "RP", nameEs: "Reconocer Patrones", nameEn: "Recognize Patterns", descriptionEs: "Reconocer patrones habituales de pensamiento y comportamiento", descriptionEn: "Recognizing habitual patterns of thought and behavior", pursuit: "know", color: "#1E88E5", icon: "Eye", order: 2 },
  { id: "3", code: "ACT", nameEs: "Aplicar Consecuencias", nameEn: "Apply Consequential Thinking", descriptionEs: "Evaluar los costos y beneficios de las opciones", descriptionEn: "Evaluating costs and benefits of choices", pursuit: "choose", color: "#E53935", icon: "Target", order: 3 },
  { id: "4", code: "NE", nameEs: "Navegar Emociones", nameEn: "Navigate Emotions", descriptionEs: "Evaluar, aprovechar y transformar las emociones", descriptionEn: "Assessing, harnessing and transforming emotions", pursuit: "choose", color: "#E53935", icon: "Zap", order: 4 },
  { id: "5", code: "IM", nameEs: "Motivación Intrínseca", nameEn: "Engage Intrinsic Motivation", descriptionEs: "Conectar con motivadores internos profundos", descriptionEn: "Connecting with deep internal drivers", pursuit: "choose", color: "#E53935", icon: "Heart", order: 5 },
  { id: "6", code: "EO", nameEs: "Ejercitar Optimismo", nameEn: "Exercise Optimism", descriptionEs: "Ver posibilidades y tomar una perspectiva proactiva", descriptionEn: "Seeing possibilities and taking proactive stance", pursuit: "choose", color: "#E53935", icon: "Sparkles", order: 6 },
  { id: "7", code: "IE", nameEs: "Empatía", nameEn: "Increase Empathy", descriptionEs: "Reconocer y responder apropiadamente a las emociones de otros", descriptionEn: "Recognizing and responding to others' emotions", pursuit: "give", color: "#43A047", icon: "Users", order: 7 },
  { id: "8", code: "PNG", nameEs: "Propósito Noble", nameEn: "Pursue Noble Goals", descriptionEs: "Conectar las acciones diarias con un sentido de propósito mayor", descriptionEn: "Connecting daily actions with larger sense of purpose", pursuit: "give", color: "#43A047", icon: "Shield", order: 8 },
];

// Default Rowi levels
const DEFAULT_ROWI_LEVELS: RowiLevel[] = [
  { id: "1", code: "egg", nameEs: "Huevito", nameEn: "Egg", descriptionEs: "Apenas comenzando tu viaje emocional", descriptionEn: "Just starting your emotional journey", minScore: 0, maxScore: 65, color: "#FEF3C7", icon: "Egg", vectorImage: "/rowivectors/Rowi-01.png", order: 1 },
  { id: "2", code: "signals", nameEs: "Señales", nameEn: "Signals", descriptionEs: "Empezando a reconocer patrones emocionales", descriptionEn: "Starting to recognize emotional patterns", minScore: 66, maxScore: 82, color: "#DBEAFE", icon: "Eye", vectorImage: "/rowivectors/Rowi-02.png", order: 2 },
  { id: "3", code: "almost", nameEs: "Casi Listo", nameEn: "Almost Ready", descriptionEs: "Desarrollando habilidades emocionales", descriptionEn: "Developing emotional skills", minScore: 83, maxScore: 92, color: "#E9D5FF", icon: "Zap", vectorImage: "/rowivectors/Rowi-03.png", order: 3 },
  { id: "4", code: "minirowi", nameEs: "Mini Rowi", nameEn: "Mini Rowi", descriptionEs: "Aplicando inteligencia emocional consistentemente", descriptionEn: "Applying emotional intelligence consistently", minScore: 93, maxScore: 107, color: "#BBF7D0", icon: "Sparkles", vectorImage: "/rowivectors/Rowi-04.png", order: 4 },
  { id: "5", code: "rowi", nameEs: "Rowi", nameEn: "Rowi", descriptionEs: "Dominio de la inteligencia emocional", descriptionEn: "Mastery of emotional intelligence", minScore: 108, maxScore: 135, color: "#FDE68A", icon: "Shield", vectorImage: "/rowivectors/Rowi-05.png", order: 5 },
];

export default function PlatformConfigPage() {
  const { t, ready } = useI18n();
  const [activeTab, setActiveTab] = useState<ConfigTab>("messaging");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Messaging config state
  const [messaging, setMessaging] = useState<MessagingConfig>({
    email: { provider: "none", apiKey: "", fromEmail: "", fromName: "Rowi", replyTo: "" },
    sms: { provider: "none", accountSid: "", authToken: "", fromNumber: "" },
    whatsapp: { provider: "none", accountSid: "", authToken: "", fromNumber: "" },
  });

  // Six Seconds config state
  const [competencies, setCompetencies] = useState<SixSecondsCompetency[]>(DEFAULT_COMPETENCIES);
  const [editingCompetency, setEditingCompetency] = useState<SixSecondsCompetency | null>(null);

  // Rowi levels state
  const [rowiLevels, setRowiLevels] = useState<RowiLevel[]>(DEFAULT_ROWI_LEVELS);
  const [editingLevel, setEditingLevel] = useState<RowiLevel | null>(null);

  // Tenant selection
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenants, setTenants] = useState<any[]>([]);

  // Load tenants
  useEffect(() => {
    if (ready) loadTenants();
  }, [ready]);

  // Load config when tenant changes
  useEffect(() => {
    if (tenantId) loadConfig();
  }, [tenantId]);

  async function loadTenants() {
    try {
      const res = await fetch("/api/hub/tenants");
      const data = await res.json();
      setTenants(data.tenants || []);
      if (data.tenants?.length > 0 && !tenantId) {
        setTenantId(data.tenants[0].id);
      }
    } catch {
      toast.error(t("common.error"));
    }
  }

  async function loadConfig() {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/hub/platform-config?tenantId=${tenantId}`);
      const data = await res.json();

      if (data.ok && data.config) {
        if (data.config.messaging) setMessaging(data.config.messaging);
        if (data.config.competencies) setCompetencies(data.config.competencies);
        if (data.config.rowiLevels) setRowiLevels(data.config.rowiLevels);
      }
    } catch {
      // Use defaults if no config exists
    } finally {
      setLoading(false);
    }
  }

  async function saveConfig() {
    if (!tenantId) {
      toast.error(t("admin.platformConfig.selectTenant") || "Selecciona un tenant primero");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/hub/platform-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          messaging,
          competencies,
          rowiLevels,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(t("admin.platformConfig.saved") || "Configuración guardada correctamente");
    } catch (err: any) {
      toast.error(err.message || t("admin.platformConfig.saveError") || "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  // Tab content
  const tabs: { id: ConfigTab; labelKey: string; icon: React.ElementType }[] = [
    { id: "messaging", labelKey: "admin.platformConfig.tabs.messaging", icon: MessageCircle },
    { id: "sixseconds", labelKey: "admin.platformConfig.tabs.sixSeconds", icon: Brain },
    { id: "rowi-levels", labelKey: "admin.platformConfig.tabs.rowiLevels", icon: Sparkles },
    { id: "general", labelKey: "admin.platformConfig.tabs.general", icon: Settings },
  ];

  return (
    <AdminPage
      titleKey="admin.platformConfig.title"
      descriptionKey="admin.platformConfig.description"
      icon={Settings}
      loading={loading}
      actions={
        <div className="flex items-center gap-2">
          <AdminSelect
            value={tenantId || ""}
            onChange={setTenantId}
            options={tenants.map((tn) => ({ value: tn.id, label: tn.name }))}
          />
          <AdminButton variant="secondary" icon={RefreshCw} onClick={loadConfig} size="sm">
            {t("admin.platformConfig.reload") || "Recargar"}
          </AdminButton>
          <AdminButton icon={Save} onClick={saveConfig} loading={saving} size="sm">
            {t("admin.platformConfig.saveAll") || "Guardar Todo"}
          </AdminButton>
        </div>
      }
    >
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-[var(--rowi-border)] pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? "bg-[var(--rowi-primary)] text-white"
                : "bg-[var(--rowi-surface)] text-[var(--rowi-muted)] hover:bg-[var(--rowi-border)]"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="text-sm font-medium">{t(tab.labelKey)}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "messaging" && (
          <motion.div
            key="messaging"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <MessagingConfigSection messaging={messaging} setMessaging={setMessaging} />
          </motion.div>
        )}

        {activeTab === "sixseconds" && (
          <motion.div
            key="sixseconds"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <SixSecondsConfigSection
              competencies={competencies}
              setCompetencies={setCompetencies}
              editingCompetency={editingCompetency}
              setEditingCompetency={setEditingCompetency}
            />
          </motion.div>
        )}

        {activeTab === "rowi-levels" && (
          <motion.div
            key="rowi-levels"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <RowiLevelsConfigSection
              levels={rowiLevels}
              setLevels={setRowiLevels}
              editingLevel={editingLevel}
              setEditingLevel={setEditingLevel}
            />
          </motion.div>
        )}

        {activeTab === "general" && (
          <motion.div
            key="general"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <GeneralConfigSection />
          </motion.div>
        )}
      </AnimatePresence>
    </AdminPage>
  );
}

/* =========================================================
   📧 Messaging Configuration Section
========================================================= */
function MessagingConfigSection({
  messaging,
  setMessaging,
}: {
  messaging: MessagingConfig;
  setMessaging: (m: MessagingConfig) => void;
}) {
  const { t } = useI18n();
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingSms, setTestingSms] = useState(false);
  const [testingWhatsapp, setTestingWhatsapp] = useState(false);

  async function testConnection(type: "email" | "sms" | "whatsapp") {
    const setTesting = type === "email" ? setTestingEmail : type === "sms" ? setTestingSms : setTestingWhatsapp;
    setTesting(true);
    try {
      const res = await fetch("/api/hub/test-messaging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, config: messaging[type] }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(t("admin.platformConfig.messaging.testSuccess") || `Conexión ${type.toUpperCase()} exitosa`);
      } else {
        toast.error(data.error || t("admin.platformConfig.messaging.testError") || "Error de conexión");
      }
    } catch {
      toast.error(t("admin.platformConfig.messaging.testError") || "Error al probar conexión");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Email Config */}
      <AdminCard>
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-[var(--rowi-foreground)]">{t("admin.platformConfig.messaging.email")}</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-[var(--rowi-muted)] mb-1 block">{t("admin.platformConfig.messaging.provider")}</label>
            <select
              value={messaging.email.provider}
              onChange={(e) =>
                setMessaging({
                  ...messaging,
                  email: { ...messaging.email, provider: e.target.value as any },
                })
              }
              className="w-full px-3 py-2 rounded-lg bg-[var(--rowi-surface)] border border-[var(--rowi-border)] text-sm"
            >
              <option value="none">{t("admin.platformConfig.messaging.disabled")}</option>
              <option value="sendgrid">SendGrid</option>
              <option value="ses">Amazon SES</option>
              <option value="mailgun">Mailgun</option>
              <option value="resend">Resend</option>
              <option value="smtp">SMTP Custom</option>
            </select>
          </div>

          {messaging.email.provider !== "none" && (
            <>
              <div>
                <label className="text-xs text-[var(--rowi-muted)] mb-1 block">{t("admin.platformConfig.messaging.apiKey")}</label>
                <input
                  type="password"
                  value={messaging.email.apiKey}
                  onChange={(e) =>
                    setMessaging({
                      ...messaging,
                      email: { ...messaging.email, apiKey: e.target.value },
                    })
                  }
                  placeholder="sk-..."
                  className="w-full px-3 py-2 rounded-lg bg-[var(--rowi-surface)] border border-[var(--rowi-border)] text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-[var(--rowi-muted)] mb-1 block">{t("admin.platformConfig.messaging.fromEmail")}</label>
                <input
                  type="email"
                  value={messaging.email.fromEmail}
                  onChange={(e) =>
                    setMessaging({
                      ...messaging,
                      email: { ...messaging.email, fromEmail: e.target.value },
                    })
                  }
                  placeholder="noreply@rowi.app"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--rowi-surface)] border border-[var(--rowi-border)] text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-[var(--rowi-muted)] mb-1 block">{t("admin.platformConfig.messaging.fromName")}</label>
                <input
                  type="text"
                  value={messaging.email.fromName}
                  onChange={(e) =>
                    setMessaging({
                      ...messaging,
                      email: { ...messaging.email, fromName: e.target.value },
                    })
                  }
                  placeholder="Rowi"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--rowi-surface)] border border-[var(--rowi-border)] text-sm"
                />
              </div>

              <button
                onClick={() => testConnection("email")}
                disabled={testingEmail}
                className="w-full py-2 rounded-lg bg-blue-500/10 text-blue-500 text-sm font-medium hover:bg-blue-500/20 transition-colors disabled:opacity-50"
              >
                {testingEmail ? <Loader2 className="w-4 h-4 mx-auto animate-spin" /> : t("admin.platformConfig.messaging.testConnection")}
              </button>
            </>
          )}
        </div>
      </AdminCard>

      {/* SMS Config */}
      <AdminCard>
        <div className="flex items-center gap-2 mb-4">
          <Phone className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold text-[var(--rowi-foreground)]">{t("admin.platformConfig.messaging.sms")}</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-[var(--rowi-muted)] mb-1 block">{t("admin.platformConfig.messaging.provider")}</label>
            <select
              value={messaging.sms.provider}
              onChange={(e) =>
                setMessaging({
                  ...messaging,
                  sms: { ...messaging.sms, provider: e.target.value as any },
                })
              }
              className="w-full px-3 py-2 rounded-lg bg-[var(--rowi-surface)] border border-[var(--rowi-border)] text-sm"
            >
              <option value="none">{t("admin.platformConfig.messaging.disabled")}</option>
              <option value="twilio">Twilio</option>
              <option value="vonage">Vonage (Nexmo)</option>
              <option value="messagebird">MessageBird</option>
            </select>
          </div>

          {messaging.sms.provider !== "none" && (
            <>
              <div>
                <label className="text-xs text-[var(--rowi-muted)] mb-1 block">{t("admin.platformConfig.messaging.accountSid")}</label>
                <input
                  type="text"
                  value={messaging.sms.accountSid}
                  onChange={(e) =>
                    setMessaging({
                      ...messaging,
                      sms: { ...messaging.sms, accountSid: e.target.value },
                    })
                  }
                  placeholder="AC..."
                  className="w-full px-3 py-2 rounded-lg bg-[var(--rowi-surface)] border border-[var(--rowi-border)] text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-[var(--rowi-muted)] mb-1 block">{t("admin.platformConfig.messaging.authToken")}</label>
                <input
                  type="password"
                  value={messaging.sms.authToken}
                  onChange={(e) =>
                    setMessaging({
                      ...messaging,
                      sms: { ...messaging.sms, authToken: e.target.value },
                    })
                  }
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--rowi-surface)] border border-[var(--rowi-border)] text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-[var(--rowi-muted)] mb-1 block">{t("admin.platformConfig.messaging.fromNumber")}</label>
                <input
                  type="text"
                  value={messaging.sms.fromNumber}
                  onChange={(e) =>
                    setMessaging({
                      ...messaging,
                      sms: { ...messaging.sms, fromNumber: e.target.value },
                    })
                  }
                  placeholder="+1234567890"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--rowi-surface)] border border-[var(--rowi-border)] text-sm"
                />
              </div>

              <button
                onClick={() => testConnection("sms")}
                disabled={testingSms}
                className="w-full py-2 rounded-lg bg-purple-500/10 text-purple-500 text-sm font-medium hover:bg-purple-500/20 transition-colors disabled:opacity-50"
              >
                {testingSms ? <Loader2 className="w-4 h-4 mx-auto animate-spin" /> : t("admin.platformConfig.messaging.testConnection")}
              </button>
            </>
          )}
        </div>
      </AdminCard>

      {/* WhatsApp Config */}
      <AdminCard>
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-5 h-5 text-green-500" />
          <h3 className="font-semibold text-[var(--rowi-foreground)]">{t("admin.platformConfig.messaging.whatsapp")}</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-[var(--rowi-muted)] mb-1 block">{t("admin.platformConfig.messaging.provider")}</label>
            <select
              value={messaging.whatsapp.provider}
              onChange={(e) =>
                setMessaging({
                  ...messaging,
                  whatsapp: { ...messaging.whatsapp, provider: e.target.value as any },
                })
              }
              className="w-full px-3 py-2 rounded-lg bg-[var(--rowi-surface)] border border-[var(--rowi-border)] text-sm"
            >
              <option value="none">{t("admin.platformConfig.messaging.disabled")}</option>
              <option value="twilio">Twilio WhatsApp</option>
              <option value="messagebird">MessageBird</option>
              <option value="360dialog">360dialog</option>
            </select>
          </div>

          {messaging.whatsapp.provider !== "none" && (
            <>
              <div>
                <label className="text-xs text-[var(--rowi-muted)] mb-1 block">{t("admin.platformConfig.messaging.accountSid")}</label>
                <input
                  type="text"
                  value={messaging.whatsapp.accountSid}
                  onChange={(e) =>
                    setMessaging({
                      ...messaging,
                      whatsapp: { ...messaging.whatsapp, accountSid: e.target.value },
                    })
                  }
                  placeholder="AC..."
                  className="w-full px-3 py-2 rounded-lg bg-[var(--rowi-surface)] border border-[var(--rowi-border)] text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-[var(--rowi-muted)] mb-1 block">{t("admin.platformConfig.messaging.authToken")}</label>
                <input
                  type="password"
                  value={messaging.whatsapp.authToken}
                  onChange={(e) =>
                    setMessaging({
                      ...messaging,
                      whatsapp: { ...messaging.whatsapp, authToken: e.target.value },
                    })
                  }
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--rowi-surface)] border border-[var(--rowi-border)] text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-[var(--rowi-muted)] mb-1 block">{t("admin.platformConfig.messaging.whatsappNumber")}</label>
                <input
                  type="text"
                  value={messaging.whatsapp.fromNumber}
                  onChange={(e) =>
                    setMessaging({
                      ...messaging,
                      whatsapp: { ...messaging.whatsapp, fromNumber: e.target.value },
                    })
                  }
                  placeholder="+1234567890"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--rowi-surface)] border border-[var(--rowi-border)] text-sm"
                />
              </div>

              <button
                onClick={() => testConnection("whatsapp")}
                disabled={testingWhatsapp}
                className="w-full py-2 rounded-lg bg-green-500/10 text-green-500 text-sm font-medium hover:bg-green-500/20 transition-colors disabled:opacity-50"
              >
                {testingWhatsapp ? <Loader2 className="w-4 h-4 mx-auto animate-spin" /> : t("admin.platformConfig.messaging.testConnection")}
              </button>
            </>
          )}
        </div>
      </AdminCard>
    </div>
  );
}

/* =========================================================
   🧠 Six Seconds Configuration Section
========================================================= */
function SixSecondsConfigSection({
  competencies,
  setCompetencies,
  editingCompetency,
  setEditingCompetency,
}: {
  competencies: SixSecondsCompetency[];
  setCompetencies: (c: SixSecondsCompetency[]) => void;
  editingCompetency: SixSecondsCompetency | null;
  setEditingCompetency: (c: SixSecondsCompetency | null) => void;
}) {
  const { t } = useI18n();
  const pursuits = [
    { id: "know", labelKey: "admin.platformConfig.sixSeconds.know", color: "#1E88E5", icon: Eye },
    { id: "choose", labelKey: "admin.platformConfig.sixSeconds.choose", color: "#E53935", icon: Target },
    { id: "give", labelKey: "admin.platformConfig.sixSeconds.give", color: "#43A047", icon: Heart },
  ];

  function updateCompetency(id: string, data: Partial<SixSecondsCompetency>) {
    setCompetencies(competencies.map((c) => (c.id === id ? { ...c, ...data } : c)));
  }

  function saveEditingCompetency() {
    if (!editingCompetency) return;
    updateCompetency(editingCompetency.id, editingCompetency);
    setEditingCompetency(null);
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <h4 className="font-medium text-[var(--rowi-foreground)]">{t("admin.platformConfig.sixSeconds.title")}</h4>
            <p className="text-sm text-[var(--rowi-muted)] mt-1">
              {t("admin.platformConfig.sixSeconds.description")}
            </p>
          </div>
        </div>
      </div>

      {/* Pursuits */}
      {pursuits.map((pursuit) => (
        <AdminCard key={pursuit.id}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${pursuit.color}20` }}>
              <pursuit.icon className="w-4 h-4" style={{ color: pursuit.color }} />
            </div>
            <h3 className="font-semibold text-[var(--rowi-foreground)]">{t(pursuit.labelKey)}</h3>
          </div>

          <div className="space-y-3">
            {competencies
              .filter((c) => c.pursuit === pursuit.id)
              .sort((a, b) => a.order - b.order)
              .map((comp) => (
                <div
                  key={comp.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[var(--rowi-surface)] border border-[var(--rowi-border)]"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{ background: comp.color }}
                  >
                    {comp.code}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--rowi-foreground)]">{comp.nameEs}</span>
                      <span className="text-xs text-[var(--rowi-muted)]">/ {comp.nameEn}</span>
                    </div>
                    <p className="text-xs text-[var(--rowi-muted)] truncate mt-0.5">{comp.descriptionEs}</p>
                  </div>
                  <button
                    onClick={() => setEditingCompetency(comp)}
                    className="p-2 rounded-lg hover:bg-[var(--rowi-border)] transition-colors"
                  >
                    <Edit3 className="w-4 h-4 text-[var(--rowi-muted)]" />
                  </button>
                </div>
              ))}
          </div>
        </AdminCard>
      ))}

      {/* Edit Competency Modal */}
      <AnimatePresence>
        {editingCompetency && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setEditingCompetency(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--rowi-background)] rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-[var(--rowi-border)]">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-[var(--rowi-foreground)]">
                    {t("admin.platformConfig.sixSeconds.editCompetency")}: {editingCompetency.code}
                  </h2>
                  <button
                    onClick={() => setEditingCompetency(null)}
                    className="p-2 rounded-lg hover:bg-[var(--rowi-surface)]"
                  >
                    <X className="w-5 h-5 text-[var(--rowi-muted)]" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[var(--rowi-muted)] mb-1 block">{t("admin.platformConfig.sixSeconds.nameEs")}</label>
                    <input
                      type="text"
                      value={editingCompetency.nameEs}
                      onChange={(e) => setEditingCompetency({ ...editingCompetency, nameEs: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--rowi-surface)] border border-[var(--rowi-border)] text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--rowi-muted)] mb-1 block">{t("admin.platformConfig.sixSeconds.nameEn")}</label>
                    <input
                      type="text"
                      value={editingCompetency.nameEn}
                      onChange={(e) => setEditingCompetency({ ...editingCompetency, nameEn: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--rowi-surface)] border border-[var(--rowi-border)] text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[var(--rowi-muted)] mb-1 block">{t("admin.platformConfig.sixSeconds.descriptionEs")}</label>
                  <textarea
                    value={editingCompetency.descriptionEs}
                    onChange={(e) => setEditingCompetency({ ...editingCompetency, descriptionEs: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--rowi-surface)] border border-[var(--rowi-border)] text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-[var(--rowi-muted)] mb-1 block">{t("admin.platformConfig.sixSeconds.descriptionEn")}</label>
                  <textarea
                    value={editingCompetency.descriptionEn}
                    onChange={(e) => setEditingCompetency({ ...editingCompetency, descriptionEn: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--rowi-surface)] border border-[var(--rowi-border)] text-sm resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[var(--rowi-muted)] mb-1 block">{t("admin.platformConfig.sixSeconds.color")}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editingCompetency.color}
                        onChange={(e) => setEditingCompetency({ ...editingCompetency, color: e.target.value })}
                        className="w-10 h-10 rounded-lg border border-[var(--rowi-border)] cursor-pointer"
                      />
                      <input
                        type="text"
                        value={editingCompetency.color}
                        onChange={(e) => setEditingCompetency({ ...editingCompetency, color: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-lg bg-[var(--rowi-surface)] border border-[var(--rowi-border)] text-sm font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--rowi-muted)] mb-1 block">{t("admin.platformConfig.sixSeconds.pursuit")}</label>
                    <select
                      value={editingCompetency.pursuit}
                      onChange={(e) =>
                        setEditingCompetency({ ...editingCompetency, pursuit: e.target.value as any })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[var(--rowi-surface)] border border-[var(--rowi-border)] text-sm"
                    >
                      <option value="know">{t("admin.platformConfig.sixSeconds.know")}</option>
                      <option value="choose">{t("admin.platformConfig.sixSeconds.choose")}</option>
                      <option value="give">{t("admin.platformConfig.sixSeconds.give")}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-[var(--rowi-border)] flex gap-3">
                <button
                  onClick={() => setEditingCompetency(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--rowi-border)] text-[var(--rowi-muted)] font-medium hover:bg-[var(--rowi-surface)] transition-colors"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={saveEditingCompetency}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--rowi-primary)] text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {t("common.save")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* =========================================================
   🌟 Rowi Levels Configuration Section
========================================================= */
function RowiLevelsConfigSection({
  levels,
  setLevels,
  editingLevel,
  setEditingLevel,
}: {
  levels: RowiLevel[];
  setLevels: (l: RowiLevel[]) => void;
  editingLevel: RowiLevel | null;
  setEditingLevel: (l: RowiLevel | null) => void;
}) {
  const { t } = useI18n();

  function updateLevel(id: string, data: Partial<RowiLevel>) {
    setLevels(levels.map((l) => (l.id === id ? { ...l, ...data } : l)));
  }

  function saveEditingLevel() {
    if (!editingLevel) return;
    updateLevel(editingLevel.id, editingLevel);
    setEditingLevel(null);
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-amber-500 mt-0.5" />
          <div>
            <h4 className="font-medium text-[var(--rowi-foreground)]">{t("admin.platformConfig.rowiLevels.title")}</h4>
            <p className="text-sm text-[var(--rowi-muted)] mt-1">
              {t("admin.platformConfig.rowiLevels.description")}
            </p>
          </div>
        </div>
      </div>

      {/* Levels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {levels
          .sort((a, b) => a.order - b.order)
          .map((level) => (
            <AdminCard key={level.id} className="relative overflow-hidden">
              <div
                className="absolute top-0 left-0 w-full h-1"
                style={{ background: level.color }}
              />
              <div className="flex items-start gap-3 pt-2">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `${level.color}30` }}
                >
                  <img
                    src={level.vectorImage}
                    alt={level.nameEs}
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/rowivectors/Rowi-01.png";
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-[var(--rowi-foreground)]">{level.nameEs}</h4>
                    <button
                      onClick={() => setEditingLevel(level)}
                      className="p-1.5 rounded-lg hover:bg-[var(--rowi-surface)] transition-colors"
                    >
                      <Edit3 className="w-4 h-4 text-[var(--rowi-muted)]" />
                    </button>
                  </div>
                  <p className="text-xs text-[var(--rowi-muted)]">{level.nameEn}</p>
                </div>
              </div>

              <p className="text-xs text-[var(--rowi-muted)] mt-3">{level.descriptionEs}</p>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--rowi-border)]">
                <span className="text-xs text-[var(--rowi-muted)]">{t("admin.platformConfig.rowiLevels.scoreRange")}</span>
                <span className="text-sm font-medium" style={{ color: level.color }}>
                  {level.minScore} - {level.maxScore}
                </span>
              </div>
            </AdminCard>
          ))}
      </div>

      {/* Edit Level Modal */}
      <AnimatePresence>
        {editingLevel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setEditingLevel(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--rowi-background)] rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-[var(--rowi-border)]">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-[var(--rowi-foreground)]">
                    {t("admin.platformConfig.rowiLevels.editLevel")}: {editingLevel.nameEs}
                  </h2>
                  <button
                    onClick={() => setEditingLevel(null)}
                    className="p-2 rounded-lg hover:bg-[var(--rowi-surface)]"
                  >
                    <X className="w-5 h-5 text-[var(--rowi-muted)]" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[var(--rowi-muted)] mb-1 block">{t("admin.platformConfig.rowiLevels.nameEs")}</label>
                    <input
                      type="text"
                      value={editingLevel.nameEs}
                      onChange={(e) => setEditingLevel({ ...editingLevel, nameEs: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--rowi-surface)] border border-[var(--rowi-border)] text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--rowi-muted)] mb-1 block">{t("admin.platformConfig.rowiLevels.nameEn")}</label>
                    <input
                      type="text"
                      value={editingLevel.nameEn}
                      onChange={(e) => setEditingLevel({ ...editingLevel, nameEn: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--rowi-surface)] border border-[var(--rowi-border)] text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[var(--rowi-muted)] mb-1 block">{t("admin.platformConfig.rowiLevels.descriptionEs")}</label>
                  <textarea
                    value={editingLevel.descriptionEs}
                    onChange={(e) => setEditingLevel({ ...editingLevel, descriptionEs: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--rowi-surface)] border border-[var(--rowi-border)] text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-[var(--rowi-muted)] mb-1 block">{t("admin.platformConfig.rowiLevels.descriptionEn")}</label>
                  <textarea
                    value={editingLevel.descriptionEn}
                    onChange={(e) => setEditingLevel({ ...editingLevel, descriptionEn: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--rowi-surface)] border border-[var(--rowi-border)] text-sm resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[var(--rowi-muted)] mb-1 block">{t("admin.platformConfig.rowiLevels.minScore")}</label>
                    <input
                      type="number"
                      value={editingLevel.minScore}
                      onChange={(e) => setEditingLevel({ ...editingLevel, minScore: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--rowi-surface)] border border-[var(--rowi-border)] text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--rowi-muted)] mb-1 block">{t("admin.platformConfig.rowiLevels.maxScore")}</label>
                    <input
                      type="number"
                      value={editingLevel.maxScore}
                      onChange={(e) => setEditingLevel({ ...editingLevel, maxScore: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--rowi-surface)] border border-[var(--rowi-border)] text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[var(--rowi-muted)] mb-1 block">{t("admin.platformConfig.rowiLevels.color")}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editingLevel.color}
                        onChange={(e) => setEditingLevel({ ...editingLevel, color: e.target.value })}
                        className="w-10 h-10 rounded-lg border border-[var(--rowi-border)] cursor-pointer"
                      />
                      <input
                        type="text"
                        value={editingLevel.color}
                        onChange={(e) => setEditingLevel({ ...editingLevel, color: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-lg bg-[var(--rowi-surface)] border border-[var(--rowi-border)] text-sm font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--rowi-muted)] mb-1 block">{t("admin.platformConfig.rowiLevels.vectorImage")}</label>
                    <input
                      type="text"
                      value={editingLevel.vectorImage}
                      onChange={(e) => setEditingLevel({ ...editingLevel, vectorImage: e.target.value })}
                      placeholder="/rowivectors/Rowi-01.png"
                      className="w-full px-3 py-2 rounded-lg bg-[var(--rowi-surface)] border border-[var(--rowi-border)] text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-[var(--rowi-border)] flex gap-3">
                <button
                  onClick={() => setEditingLevel(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--rowi-border)] text-[var(--rowi-muted)] font-medium hover:bg-[var(--rowi-surface)] transition-colors"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={saveEditingLevel}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--rowi-primary)] text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {t("common.save")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* =========================================================
   ⚙️ General Configuration Section
========================================================= */
function GeneralConfigSection() {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AdminCard>
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-[var(--rowi-primary)]" />
          <h3 className="font-semibold text-[var(--rowi-foreground)]">{t("admin.platformConfig.general.regional")}</h3>
        </div>
        <p className="text-sm text-[var(--rowi-muted)]">
          {t("admin.platformConfig.general.regionalDesc")}
        </p>
      </AdminCard>

      <AdminCard>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-[var(--rowi-primary)]" />
          <h3 className="font-semibold text-[var(--rowi-foreground)]">{t("admin.platformConfig.general.security")}</h3>
        </div>
        <p className="text-sm text-[var(--rowi-muted)]">
          {t("admin.platformConfig.general.securityDesc")}
        </p>
      </AdminCard>
    </div>
  );
}
