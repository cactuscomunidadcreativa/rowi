// src/app/hub/page.tsx
// ============================================================
// Hub Dashboard - Panel principal para usuarios autenticados
// Muestra accesos rápidos, EQ summary, comunidades, agentes IA
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useI18n } from "@/lib/i18n/react";
import {
  Brain,
  MessageSquare,
  Users,
  Sparkles,
  ChevronRight,
  Heart,
  Loader2,
  BarChart3,
  Star,
  Lightbulb,
  Zap,
  Trophy,
  Target,
  Settings,
  BookOpen,
  Bot,
  TrendingUp,
  Flame,
  Shield,
  LayoutDashboard,
  Database,
  FileText,
  Palette,
} from "lucide-react";

interface DashboardData {
  user: {
    name: string | null;
    email: string;
    level?: number;
    xp?: number;
    streak?: number;
    isAdmin?: boolean;
    isSuperAdmin?: boolean;
  };
  eq?: {
    total: number | null;
    hasData: boolean;
  };
  communities?: Array<{
    id: string;
    name: string;
    memberCount: number;
  }>;
  agents?: Array<{
    id: string;
    slug: string;
    name: string;
    description?: string;
  }>;
  recentActivity?: Array<{
    type: string;
    description: string;
    createdAt: string;
  }>;
}

export default function HubDashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      loadDashboardData();
    } else if (status === "unauthenticated") {
      router.push("/hub/login");
    }
  }, [status]);

  async function loadDashboardData() {
    try {
      // Cargar datos del dashboard
      const res = await fetch("/api/hub/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        // Fallback sin API: NUNCA derivar admin en el cliente. La fuente de
        // verdad de permisos es server-side (scope-aware, ver core/auth.ts:
        // "no autorices nunca desde claims del token"). Si la API no responde,
        // el panel admin queda oculto (falso negativo seguro > falso positivo).
        const userEmail = session?.user?.email || "";
        setData({
          user: {
            name: session?.user?.name || null,
            email: userEmail,
            level: 1,
            xp: 0,
            streak: 0,
            isAdmin: false,
            isSuperAdmin: false,
          },
          eq: { total: null, hasData: false },
          communities: [],
          agents: [
            { id: "1", slug: "super-rowi", name: "Super Rowi", description: t("hubHome.agentSuperRowiDesc", "Tu asistente principal de EQ") },
            { id: "2", slug: "rowi-eq", name: "Rowi EQ", description: t("hubHome.agentRowiEqDesc", "Coach de inteligencia emocional") },
            { id: "3", slug: "rowi-affinity", name: "Rowi Affinity", description: t("hubHome.agentRowiAffinityDesc", "Experto en relaciones") },
          ],
        });
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
      // Fallback ante error: igual que arriba, sin derivar admin en el cliente.
      const userEmail = session?.user?.email || "";
      setData({
        user: {
          name: session?.user?.name || null,
          email: userEmail,
          level: 1,
          xp: 0,
          streak: 0,
          isAdmin: false,
          isSuperAdmin: false,
        },
        eq: { total: null, hasData: false },
        communities: [],
        agents: [],
      });
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>{t("hubHome.loading", "Cargando tu hub...")}</span>
        </div>
      </div>
    );
  }

  const userName = data?.user?.name || session?.user?.name || t("hubHome.defaultUserName", "Usuario");
  const firstName = userName.split(" ")[0];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              {t("hubHome.welcome", "Bienvenido de nuevo")}, {firstName} 👋
            </h1>
            <p className="text-gray-400 mt-1">{t("hubHome.subtitle", "Tu viaje de inteligencia emocional continúa")}</p>
          </div>

          {/* Progress badge */}
          <div className="flex items-center gap-4">
            {data?.user?.streak && data.user.streak > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 rounded-xl border border-orange-500/30">
                <Flame className="w-5 h-5 text-orange-400" />
                <span className="text-orange-300 font-medium">{data.user.streak} {t("hubHome.streak", "Días seguidos")}</span>
              </div>
            )}
            <div className="flex items-center gap-2 px-4 py-2 bg-violet-500/20 rounded-xl border border-violet-500/30">
              <Trophy className="w-5 h-5 text-violet-400" />
              <span className="text-violet-300 font-medium">{t("hubHome.level", "Nivel")} {data?.user?.level || 1}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <QuickActionCard
            icon={Brain}
            title={t("hubHome.eqDashboard", "Dashboard EQ")}
            description={t("hubHome.eqDashboardDesc", "Tu inteligencia emocional")}
            color="violet"
            onClick={() => router.push("/hub/eq")}
          />
          <QuickActionCard
            icon={Sparkles}
            title={t("hubHome.brainTalents", "Talentos Cerebrales")}
            description={t("hubHome.brainTalentsDesc", "Tus 18 talentos")}
            color="purple"
            onClick={() => router.push("/hub/eq/talents")}
          />
          <QuickActionCard
            icon={Bot}
            title={t("hubHome.coach", "Coach IA")}
            description={t("hubHome.coachDesc", "Chatea con Rowi")}
            color="blue"
            onClick={() => router.push("/hub/ai/rowi-coach")}
          />
          <QuickActionCard
            icon={BookOpen}
            title={t("hubHome.learn", "Aprender")}
            description={t("hubHome.learnDesc", "Microlearning EQ")}
            color="green"
            onClick={() => router.push("/hub/learn")}
          />
          <QuickActionCard
            icon={Trophy}
            title={t("hubHome.achievements", "Logros")}
            description={t("hubHome.achievementsDesc", "Tus insignias")}
            color="amber"
            onClick={() => router.push("/hub/achievements")}
          />
          <QuickActionCard
            icon={Settings}
            title={t("hubHome.settings", "Configuración")}
            description={t("hubHome.settingsDesc", "Tu cuenta")}
            color="gray"
            onClick={() => router.push("/hub/settings")}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* EQ Summary Card */}
          <div className="lg:col-span-2 bg-gradient-to-br from-violet-500/20 to-purple-600/20 rounded-2xl border border-violet-500/30 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-violet-500/30">
                  <Brain className="w-6 h-6 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">{t("hubHome.myEQ", "Mi EQ")}</h2>
                  <p className="text-gray-400 text-sm">{t("hubHome.eqScore", "Puntuación EQ")}</p>
                </div>
              </div>
              {data?.eq?.hasData && (
                <button
                  onClick={() => router.push("/hub/eq")}
                  className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1"
                >
                  {t("hubHome.viewProfile", "Ver perfil completo")} <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {data?.eq?.hasData && data.eq.total ? (
              <div className="flex items-center gap-8">
                <div className="text-6xl font-bold text-white">
                  {data.eq.total.toFixed(1)}
                </div>
                <div className="flex-1 grid grid-cols-3 gap-4">
                  <MiniStat icon={Target} label={t("hubHome.pursuitKnow", "Conocer")} value="--" color="blue" />
                  <MiniStat icon={Heart} label={t("hubHome.pursuitChoose", "Elegir")} value="--" color="purple" />
                  <MiniStat icon={Users} label={t("hubHome.pursuitGive", "Dar")} value="--" color="pink" />
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Brain className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400 mb-4">{t("hubHome.noEQData", "Sin datos EQ aún")}</p>
                <button
                  onClick={() => router.push("/hub/settings")}
                  className="px-6 py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-xl font-medium transition-colors"
                >
                  {t("hubHome.linkAssessment", "Vincular SEI")}
                </button>
              </div>
            )}
          </div>

          {/* AI Agents Card */}
          <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-blue-500/20">
                <Bot className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">{t("hubHome.aiAgents", "Coaches IA")}</h2>
            </div>

            <div className="space-y-3">
              {(data?.agents || []).slice(0, 3).map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => router.push(`/hub/ai/${agent.slug}`)}
                  className="w-full flex items-center gap-3 p-3 bg-gray-700/30 hover:bg-gray-700/50 rounded-xl transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white truncate">{agent.name}</h4>
                    <p className="text-sm text-gray-400 truncate">{agent.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                </button>
              ))}

              <button
                onClick={() => router.push("/hub/ai/rowi-coach")}
                className="w-full p-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl text-blue-300 font-medium transition-colors"
              >
                {t("hubHome.startChat", "Iniciar chat")} →
              </button>
            </div>
          </div>
        </div>

        {/* Admin Section - Solo visible para admins */}
        {data?.user?.isAdmin && (
          <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-2xl border border-red-500/30 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-red-500/20">
                  <Shield className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">{t("hubHome.adminPanel", "Panel Admin")}</h2>
                  <p className="text-gray-400 text-sm">{t("hubHome.adminPanelDesc", "Administración")}</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-xs font-medium">
                {data.user.isSuperAdmin ? "SUPERADMIN" : "ADMIN"}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <AdminQuickLink
                icon={LayoutDashboard}
                label={t("hubHome.adminDashboard", "Dashboard")}
                href="/hub/admin"
                color="red"
                onClick={() => router.push("/hub/admin")}
              />
              <AdminQuickLink
                icon={Users}
                label={t("hubHome.adminUsers", "Usuarios")}
                href="/hub/admin/users"
                color="orange"
                onClick={() => router.push("/hub/admin/users")}
              />
              <AdminQuickLink
                icon={Bot}
                label={t("hubHome.adminAgents", "Agentes IA")}
                href="/hub/admin/agents"
                color="blue"
                onClick={() => router.push("/hub/admin/agents")}
              />
              <AdminQuickLink
                icon={BarChart3}
                label={t("hubHome.adminBenchmarks", "Benchmarks")}
                href="/hub/admin/benchmarks"
                color="green"
                onClick={() => router.push("/hub/admin/benchmarks")}
              />
              <AdminQuickLink
                icon={FileText}
                label={t("hubHome.adminCMS", "CMS")}
                href="/hub/admin/cms"
                color="purple"
                onClick={() => router.push("/hub/admin/cms")}
              />
              <AdminQuickLink
                icon={Palette}
                label={t("hubHome.adminBranding", "Marca")}
                href="/hub/admin/branding"
                color="pink"
                onClick={() => router.push("/hub/admin/branding")}
              />
            </div>
          </div>
        )}

        {/* Communities Section */}
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-green-500/20">
                <Users className="w-6 h-6 text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">{t("hubHome.communities", "Mis Comunidades")}</h2>
            </div>
            <button
              onClick={() => router.push("/hub/communities")}
              className="text-sm text-green-400 hover:text-green-300 flex items-center gap-1"
            >
              {t("hubHome.viewAll", "Ver todas")} <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {(data?.communities || []).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data?.communities?.map((community) => (
                <div
                  key={community.id}
                  className="p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/hub/communities/${community.id}`)}
                >
                  <h4 className="font-medium text-white mb-1">{community.name}</h4>
                  <p className="text-sm text-gray-400">
                    {community.memberCount} {t("hubHome.members", "miembros")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400 mb-4">{t("hubHome.noCommunities", "Sin comunidades aún")}</p>
              <button
                onClick={() => router.push("/hub/communities")}
                className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
              >
                {t("hubHome.exploreCommunities", "Explorar comunidades")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Quick Action Card Component
function QuickActionCard({
  icon: Icon,
  title,
  description,
  color,
  onClick,
}: {
  icon: any;
  title: string;
  description: string;
  color: string;
  onClick: () => void;
}) {
  const colorClasses: Record<string, string> = {
    violet: "from-violet-500/20 to-violet-600/20 border-violet-500/30 hover:border-violet-500/50",
    purple: "from-purple-500/20 to-purple-600/20 border-purple-500/30 hover:border-purple-500/50",
    blue: "from-blue-500/20 to-blue-600/20 border-blue-500/30 hover:border-blue-500/50",
    green: "from-green-500/20 to-green-600/20 border-green-500/30 hover:border-green-500/50",
    amber: "from-amber-500/20 to-amber-600/20 border-amber-500/30 hover:border-amber-500/50",
    gray: "from-gray-700/50 to-gray-800/50 border-gray-600/30 hover:border-gray-500/50",
  };

  const iconColors: Record<string, string> = {
    violet: "text-violet-400",
    purple: "text-purple-400",
    blue: "text-blue-400",
    green: "text-green-400",
    amber: "text-amber-400",
    gray: "text-gray-400",
  };

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl bg-gradient-to-br ${colorClasses[color]} border transition-all duration-200 hover:scale-105 text-left`}
    >
      <Icon className={`w-6 h-6 ${iconColors[color]} mb-2`} />
      <h3 className="font-medium text-white text-sm">{title}</h3>
      <p className="text-xs text-gray-400 mt-1">{description}</p>
    </button>
  );
}

// Mini Stat Component
function MiniStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: "text-blue-400",
    purple: "text-purple-400",
    pink: "text-pink-400",
  };

  return (
    <div className="text-center">
      <Icon className={`w-6 h-6 mx-auto mb-1 ${colorClasses[color]}`} />
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}

// Admin Quick Link Component
function AdminQuickLink({
  icon: Icon,
  label,
  href,
  color,
  onClick,
}: {
  icon: any;
  label: string;
  href: string;
  color: string;
  onClick: () => void;
}) {
  const colorClasses: Record<string, string> = {
    red: "bg-red-500/20 text-red-400 hover:bg-red-500/30",
    orange: "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30",
    blue: "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30",
    green: "bg-green-500/20 text-green-400 hover:bg-green-500/30",
    purple: "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30",
    pink: "bg-pink-500/20 text-pink-400 hover:bg-pink-500/30",
  };

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl ${colorClasses[color]} transition-colors text-center`}
    >
      <Icon className="w-6 h-6 mx-auto mb-2" />
      <span className="text-sm font-medium text-white">{label}</span>
    </button>
  );
}
