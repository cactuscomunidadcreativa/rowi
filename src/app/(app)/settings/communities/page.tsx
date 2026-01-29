"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/react";
import { motion } from "framer-motion";
import {
  Heart,
  Users,
  Plus,
  Search,
  Settings,
  Crown,
  ChevronRight,
  RefreshCw,
  Building2,
  Globe,
  Lock,
} from "lucide-react";
import Link from "next/link";

/* ====== Traducciones inline ====== */
const T: Record<string, Record<string, string>> = {
  title: { es: "Mis Comunidades", en: "My Communities" },
  subtitle: { es: "Gestiona tus comunidades y equipos", en: "Manage your communities and teams" },

  myCommunities: { es: "Comunidades donde participo", en: "Communities I'm in" },
  noCommunities: { es: "Aún no perteneces a ninguna comunidad", en: "You don't belong to any community yet" },
  noCommunitiesDesc: { es: "Únete a una comunidad o crea la tuya propia", en: "Join a community or create your own" },

  createCommunity: { es: "Crear comunidad", en: "Create community" },
  exploreCommunities: { es: "Explorar comunidades", en: "Explore communities" },

  members: { es: "miembros", en: "members" },
  admin: { es: "Admin", en: "Admin" },
  member: { es: "Miembro", en: "Member" },
  viewer: { es: "Observador", en: "Viewer" },

  public: { es: "Pública", en: "Public" },
  private: { es: "Privada", en: "Private" },

  manage: { es: "Gestionar", en: "Manage" },
  leave: { es: "Salir", en: "Leave" },

  loading: { es: "Cargando...", en: "Loading..." },
  search: { es: "Buscar comunidad...", en: "Search community..." },
};

const COLORS = {
  purple: "#7a59c9",
  blue: "#31a2e3",
  pink: "#d797cf",
  green: "#10b981",
  orange: "#f59e0b",
};

type Community = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  isPublic: boolean;
  memberCount: number;
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
};

export default function CommunitiesPage() {
  const { locale } = useI18n();
  const lang = locale === "en" ? "en" : "es";
  const t = (key: string) => T[key]?.[lang] || T[key]?.es || key;

  const [loading, setLoading] = useState(true);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadCommunities() {
      try {
        const res = await fetch("/api/user/communities", { cache: "no-store" });
        const data = await res.json();
        if (data.ok) {
          setCommunities(data.communities || []);
        }
      } catch (e) {
        console.error("Error loading communities:", e);
      } finally {
        setLoading(false);
      }
    }
    loadCommunities();
  }, []);

  const filteredCommunities = communities.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const roleLabel = (role: Community["role"]) => {
    if (role === "OWNER" || role === "ADMIN") return t("admin");
    if (role === "MEMBER") return t("member");
    return t("viewer");
  };

  const roleColor = (role: Community["role"]) => {
    if (role === "OWNER" || role === "ADMIN") return COLORS.purple;
    if (role === "MEMBER") return COLORS.blue;
    return COLORS.orange;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin" style={{ color: COLORS.purple }} />
          <span className="rowi-muted">{t("loading")}</span>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
          style={{ background: `linear-gradient(135deg, ${COLORS.pink}20, ${COLORS.purple}20)` }}
        >
          <Heart size={32} style={{ color: COLORS.pink }} />
        </div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm rowi-muted mt-2">{t("subtitle")}</p>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search")}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 outline-none transition-all"
          />
        </div>
        <button className="rowi-btn-primary flex items-center justify-center gap-2">
          <Plus size={18} />
          {t("createCommunity")}
        </button>
      </motion.div>

      {/* Communities List */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-xs font-semibold uppercase tracking-wider rowi-muted mb-3 px-1">
          {t("myCommunities")}
        </h2>

        {filteredCommunities.length === 0 ? (
          <div className="rowi-card text-center py-12">
            <div
              className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
              style={{ background: `${COLORS.pink}20` }}
            >
              <Users size={32} style={{ color: COLORS.pink }} />
            </div>
            <p className="font-medium">{t("noCommunities")}</p>
            <p className="text-sm rowi-muted mt-1">{t("noCommunitiesDesc")}</p>
            <div className="flex justify-center gap-3 mt-6">
              <button className="rowi-btn-primary flex items-center gap-2">
                <Plus size={16} />
                {t("createCommunity")}
              </button>
              <button className="rowi-btn flex items-center gap-2">
                <Globe size={16} />
                {t("exploreCommunities")}
              </button>
            </div>
          </div>
        ) : (
          <div className="rowi-card p-0 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
            {filteredCommunities.map((community) => (
              <Link
                key={community.id}
                href={`/community/${community.slug}`}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
              >
                {/* Avatar */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.pink})`,
                  }}
                >
                  {community.image ? (
                    <img
                      src={community.image}
                      alt={community.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    community.name.charAt(0).toUpperCase()
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium flex items-center gap-2">
                    {community.name}
                    {community.isPublic ? (
                      <Globe size={14} className="rowi-muted" />
                    ) : (
                      <Lock size={14} className="rowi-muted" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs rowi-muted flex items-center gap-1">
                      <Users size={12} />
                      {community.memberCount} {t("members")}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: `${roleColor(community.role)}20`,
                        color: roleColor(community.role),
                      }}
                    >
                      {community.role === "OWNER" && <Crown size={10} className="inline mr-1" />}
                      {roleLabel(community.role)}
                    </span>
                  </div>
                </div>

                {/* Action */}
                <ChevronRight
                  size={20}
                  className="rowi-muted shrink-0 group-hover:translate-x-1 transition-transform"
                />
              </Link>
            ))}
          </div>
        )}
      </motion.section>
    </main>
  );
}
