"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  UserPlus,
  Users,
  Globe,
  Filter,
  X,
  Mail,
  MapPin,
  Brain,
  Heart,
  Sparkles,
  ChevronDown,
  Check,
  Clock,
  Send,
  UserCheck,
  Building2,
  Home,
  Users2,
  HelpCircle,
  Loader2,
  AlertCircle,
  Crown,
  MoreVertical,
  Edit3,
  Trash2,
  RefreshCw,
  Phone,
  MessageCircle,
  Copy,
  ExternalLink,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/* =========================================================
   🌍 Traducciones
========================================================= */
const translations = {
  es: {
    title: "Mi Comunidad",
    subtitle: "Las personas que forman parte de tu viaje emocional",

    // Tabs
    tabs: {
      myPeople: "Mi Gente",
      invited: "Invitados",
      rowiverse: "Rowiverse",
    },

    // Stats
    stats: {
      total: "Total",
      connected: "Conectados",
      pending: "Pendientes",
      avgAffinity: "Afinidad promedio",
    },

    // Search & Filters
    search: "Buscar por nombre o email...",
    filters: "Filtros",
    clearFilters: "Limpiar filtros",
    allGroups: "Todos los grupos",
    allCloseness: "Toda cercanía",
    onlyWithAffinity: "Solo con afinidad",

    // Groups
    groups: {
      work: "Trabajo",
      family: "Familia",
      friends: "Amigos",
      toMeet: "Por conocer",
      rowiverse: "Rowiverse",
    },

    // Closeness (5 levels)
    closeness: {
      veryClose: "Muy cercano",
      close: "Cercano",
      neutral: "Neutral",
      distant: "Distante",
      veryDistant: "Muy distante",
    },

    // Connection Types
    connectionTypes: {
      colleague: "Colega",
      boss: "Jefe/Supervisor",
      directReport: "Reporte directo",
      mentor: "Mentor",
      mentee: "Mentee",
      partner: "Socio/Partner",
      client: "Cliente",
      friend: "Amigo",
      familyMember: "Familiar",
      acquaintance: "Conocido",
      other: "Otro",
    },
    fieldConnectionType: "Tipo de relación",

    // Invite Modal
    inviteTitle: "Invitar a mi comunidad",
    inviteDesc: "Envía una invitación por email, WhatsApp o SMS",
    inviteContact: "Email o teléfono (+código país)",
    inviteName: "Nombre (opcional)",
    inviteMessage: "Mensaje personalizado (opcional)",
    inviteDefaultMessage: "¡Hola! Me gustaría conectar contigo en Rowi para fortalecer nuestra relación.",
    sendInvite: "Crear invitación",
    inviteSent: "¡Invitación creada!",
    inviteError: "Error al crear invitación",
    planLimit: "Tu plan permite invitar hasta",
    people: "personas",
    upgradePlan: "Mejorar plan",
    remainingInvites: "invitaciones restantes",
    sendVia: "Enviar vía:",
    copyLink: "Copiar enlace",
    linkCopied: "¡Enlace copiado!",

    // Member Actions
    actions: {
      edit: "Editar",
      delete: "Eliminar",
      recalculate: "Recalcular afinidad",
      viewProfile: "Ver perfil",
    },

    // Edit Modal
    editTitle: "Editar miembro",
    editSave: "Guardar cambios",
    editCancel: "Cancelar",
    editSuccess: "Cambios guardados",
    editError: "Error al guardar",
    fieldName: "Nombre",
    fieldEmail: "Email",
    fieldGroup: "Grupo",
    fieldCloseness: "Cercanía",
    fieldCountry: "País",
    fieldBrainStyle: "Estilo de pensamiento",

    // Delete confirmation
    deleteTitle: "Eliminar miembro",
    deleteConfirm: "¿Estás seguro de que deseas eliminar a",
    deleteWarning: "Esta acción no se puede deshacer y se perderán todos los datos de afinidad.",
    deleteButton: "Sí, eliminar",

    // Rowiverse
    rowiverseTitle: "Descubre el Rowiverse",
    rowiverseDesc: "Encuentra personas con perfiles públicos en la comunidad global de Rowi",
    rowiverseSearch: "Buscar en Rowiverse...",
    rowiverseEmpty: "No se encontraron perfiles públicos",
    publicProfile: "Perfil público",
    sendRequest: "Conectar",
    requestSent: "Conectado",
    addToCommunity: "Agregar a mi comunidad",
    added: "Agregado",

    // Member Card
    noStyle: "Sin estilo definido",
    noAffinity: "Sin afinidad",
    viewProfile: "Ver perfil",
    calculateAffinity: "Calcular afinidad",

    // Affinity levels
    affinity: {
      fullTrust: "Confianza plena",
      goodConnection: "Buena conexión",
      mediumPotential: "Potencial medio",
      lowConnection: "Conexión baja",
      distant: "Distante",
      noConnection: "Sin conexión",
    },

    // Empty states
    noMembers: "Aún no tienes miembros en tu comunidad",
    noInvites: "No tienes invitaciones pendientes",
    startInviting: "Comienza invitando a las personas importantes para ti",
    addManually: "Agregar manualmente",

    // Pending invites
    pendingInvites: "Invitaciones pendientes",
    sentOn: "Enviada el",
    expiresOn: "Expira el",
    resend: "Reenviar",
    cancel: "Cancelar",
    expired: "Expirada",
    accepted: "Aceptada",
    pending: "Pendiente",

    // Loading
    loading: "Cargando tu comunidad...",
    refreshing: "Actualizando...",
  },
  en: {
    title: "My Community",
    subtitle: "The people who are part of your emotional journey",

    // Tabs
    tabs: {
      myPeople: "My People",
      invited: "Invited",
      rowiverse: "Rowiverse",
    },

    // Stats
    stats: {
      total: "Total",
      connected: "Connected",
      pending: "Pending",
      avgAffinity: "Avg. affinity",
    },

    // Search & Filters
    search: "Search by name or email...",
    filters: "Filters",
    clearFilters: "Clear filters",
    allGroups: "All groups",
    allCloseness: "All closeness",
    onlyWithAffinity: "Only with affinity",

    // Groups
    groups: {
      work: "Work",
      family: "Family",
      friends: "Friends",
      toMeet: "To meet",
      rowiverse: "Rowiverse",
    },

    // Closeness (5 levels)
    closeness: {
      veryClose: "Very close",
      close: "Close",
      neutral: "Neutral",
      distant: "Distant",
      veryDistant: "Very distant",
    },

    // Connection Types
    connectionTypes: {
      colleague: "Colleague",
      boss: "Boss/Supervisor",
      directReport: "Direct report",
      mentor: "Mentor",
      mentee: "Mentee",
      partner: "Partner",
      client: "Client",
      friend: "Friend",
      familyMember: "Family member",
      acquaintance: "Acquaintance",
      other: "Other",
    },
    fieldConnectionType: "Relationship type",

    // Invite Modal
    inviteTitle: "Invite to my community",
    inviteDesc: "Send an invitation via email, WhatsApp or SMS",
    inviteContact: "Email or phone (+country code)",
    inviteName: "Name (optional)",
    inviteMessage: "Custom message (optional)",
    inviteDefaultMessage: "Hi! I'd like to connect with you on Rowi to strengthen our relationship.",
    sendInvite: "Create invitation",
    inviteSent: "Invitation created!",
    inviteError: "Error creating invitation",
    planLimit: "Your plan allows inviting up to",
    people: "people",
    upgradePlan: "Upgrade plan",
    remainingInvites: "invitations remaining",
    sendVia: "Send via:",
    copyLink: "Copy link",
    linkCopied: "Link copied!",

    // Member Actions
    actions: {
      edit: "Edit",
      delete: "Delete",
      recalculate: "Recalculate affinity",
      viewProfile: "View profile",
    },

    // Edit Modal
    editTitle: "Edit member",
    editSave: "Save changes",
    editCancel: "Cancel",
    editSuccess: "Changes saved",
    editError: "Error saving",
    fieldName: "Name",
    fieldEmail: "Email",
    fieldGroup: "Group",
    fieldCloseness: "Closeness",
    fieldCountry: "Country",
    fieldBrainStyle: "Brain style",

    // Delete confirmation
    deleteTitle: "Delete member",
    deleteConfirm: "Are you sure you want to delete",
    deleteWarning: "This action cannot be undone and all affinity data will be lost.",
    deleteButton: "Yes, delete",

    // Rowiverse
    rowiverseTitle: "Discover the Rowiverse",
    rowiverseDesc: "Find people with public profiles in Rowi's global community",
    rowiverseSearch: "Search Rowiverse...",
    rowiverseEmpty: "No public profiles found",
    publicProfile: "Public profile",
    sendRequest: "Connect",
    requestSent: "Connected",
    addToCommunity: "Add to my community",
    added: "Added",

    // Member Card
    noStyle: "No style defined",
    noAffinity: "No affinity",
    viewProfile: "View profile",
    calculateAffinity: "Calculate affinity",

    // Affinity levels
    affinity: {
      fullTrust: "Full trust",
      goodConnection: "Good connection",
      mediumPotential: "Medium potential",
      lowConnection: "Low connection",
      distant: "Distant",
      noConnection: "No connection",
    },

    // Empty states
    noMembers: "You don't have members in your community yet",
    noInvites: "You don't have pending invitations",
    startInviting: "Start inviting the people who matter to you",
    addManually: "Add manually",

    // Pending invites
    pendingInvites: "Pending invitations",
    sentOn: "Sent on",
    expiresOn: "Expires on",
    resend: "Resend",
    cancel: "Cancel",
    expired: "Expired",
    accepted: "Accepted",
    pending: "Pending",

    // Loading
    loading: "Loading your community...",
    refreshing: "Refreshing...",
  },
};

const GROUP_ICONS = {
  Trabajo: Building2,
  Family: Home,
  Familia: Home,
  Amigos: Users2,
  Friends: Users2,
  "Por conocer": HelpCircle,
  "To meet": HelpCircle,
  Work: Building2,
  Rowiverse: Globe,
};

type Member = {
  id: string;
  name: string;
  email?: string;
  country?: string;
  brainStyle?: string;
  group: string;
  connectionType?: string;
  closeness: string;
  affinityPercent?: number | null;
  affinityLevel?: string | null;
  aiSummary?: string | null;
  source?: string;
  updatedAt?: string;
};

type Invite = {
  id: string;
  token: string;
  contact: string;
  channel: "email" | "whatsapp" | "sms";
  status: "pending" | "accepted" | "expired";
  createdAt: string;
  expiresAt: string;
  acceptedBy?: { id: string; name: string; joinedAt: string } | null;
};

type RowiverseProfile = {
  id: string;
  name: string;
  headline?: string;
  bio?: string;
  image?: string;
  country?: string;
  city?: string;
  eqLevel?: string;
  pursuits?: { knowYourself: number; chooseYourself: number; giveYourself: number };
  memberSince?: string;
};

/* =========================================================
   📄 COMPONENTE PRINCIPAL
========================================================= */
export default function CommunityPage() {
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.es;

  const [activeTab, setActiveTab] = useState<"myPeople" | "invited" | "rowiverse">("myPeople");
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [closenessFilter, setClosenessFilter] = useState("all");
  const [connectionTypeFilter, setConnectionTypeFilter] = useState("all");
  const [onlyAffinity, setOnlyAffinity] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);

  // Rowiverse
  const [rowiverseSearch, setRowiverseSearch] = useState("");
  const [rowiverseResults, setRowiverseResults] = useState<RowiverseProfile[]>([]);
  const [searchingRowiverse, setSearchingRowiverse] = useState(false);
  const [addedProfiles, setAddedProfiles] = useState<Set<string>>(new Set());

  // Plan limits
  const [planLimit, setPlanLimit] = useState(50);
  const [remainingInvites, setRemainingInvites] = useState(50);

  /* =========================================================
     🚀 CARGA DE DATOS
  ========================================================= */
  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      // Fetch members with affinity data
      const membersRes = await fetch("/api/community/members", { cache: "no-store" });
      const membersData = await membersRes.json();
      const membersList: Member[] = Array.isArray(membersData?.members) ? membersData.members : [];
      setMembers(membersList);

      // Fetch invites
      const invitesRes = await fetch("/api/community/invite", { cache: "no-store" });
      const invitesData = await invitesRes.json();
      if (invitesData?.ok) {
        setInvites(invitesData.invites || []);
        if (invitesData.stats) {
          setPlanLimit(50); // TODO: Get from plan
          setRemainingInvites(50 - (invitesData.stats.total || 0));
        }
      }
    } catch (err) {
      console.error("Error loading community:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* =========================================================
     🔍 FILTRADO
  ========================================================= */
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchSearch =
        !search ||
        m.name?.toLowerCase().includes(search.toLowerCase()) ||
        m.email?.toLowerCase().includes(search.toLowerCase());

      const matchGroup = groupFilter === "all" || m.group === groupFilter;

      const closenessMap: Record<string, string[]> = {
        "Muy cercano": ["Muy cercano", "Very close"],
        "Cercano": ["Cercano", "Close"],
        "Neutral": ["Neutral"],
        "Distante": ["Distante", "Distant"],
        "Muy distante": ["Muy distante", "Very distant"],
        // Legacy mappings
        "Lejano": ["Lejano", "Distante", "Distant"],
      };
      const matchCloseness =
        closenessFilter === "all" || closenessMap[closenessFilter]?.includes(m.closeness);

      const matchConnectionType =
        connectionTypeFilter === "all" || m.connectionType === connectionTypeFilter;

      const matchAffinity = !onlyAffinity || typeof m.affinityPercent === "number";

      return matchSearch && matchGroup && matchCloseness && matchConnectionType && matchAffinity;
    });
  }, [members, search, groupFilter, closenessFilter, connectionTypeFilter, onlyAffinity]);

  /* =========================================================
     📊 ESTADÍSTICAS Y SUGERENCIAS
  ========================================================= */
  const stats = useMemo(() => {
    const withAffinity = members.filter((m) => typeof m.affinityPercent === "number" && m.affinityPercent > 0);
    const avgAffinity =
      withAffinity.length > 0
        ? Math.round(withAffinity.reduce((acc, m) => acc + (m.affinityPercent || 0), 0) / withAffinity.length)
        : 0;

    return {
      total: members.length,
      connected: withAffinity.length,
      pending: invites.filter((i) => i.status === "pending").length,
      avgAffinity,
    };
  }, [members, invites]);

  // Sugerencias de afinidad
  const affinitySuggestions = useMemo(() => {
    const withAffinity = members
      .filter((m) => typeof m.affinityPercent === "number" && m.affinityPercent > 0)
      .sort((a, b) => (b.affinityPercent || 0) - (a.affinityPercent || 0));

    const bestMatch = withAffinity[0] || null;
    const needsWork = withAffinity.length > 0 ? withAffinity[withAffinity.length - 1] : null;
    const highAffinity = withAffinity.filter((m) => (m.affinityPercent || 0) >= 70);
    const lowAffinity = withAffinity.filter((m) => (m.affinityPercent || 0) < 50);

    return {
      bestMatch,
      needsWork,
      highAffinityCount: highAffinity.length,
      lowAffinityCount: lowAffinity.length,
      topThree: withAffinity.slice(0, 3),
      bottomThree: withAffinity.slice(-3).reverse(),
    };
  }, [members]);

  /* =========================================================
     🔎 BUSCAR EN ROWIVERSE
  ========================================================= */
  async function searchRowiverse(query: string) {
    if (!query.trim()) {
      setRowiverseResults([]);
      return;
    }

    setSearchingRowiverse(true);
    try {
      const res = await fetch(`/api/community/rowiverse?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data?.ok) {
        setRowiverseResults(data.profiles || []);
      }
    } catch {
      setRowiverseResults([]);
    } finally {
      setSearchingRowiverse(false);
    }
  }

  /* =========================================================
     👤 AGREGAR DESDE ROWIVERSE
  ========================================================= */
  async function addFromRowiverse(profile: RowiverseProfile) {
    try {
      const res = await fetch("/api/community/rowiverse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile.id }),
      });
      const data = await res.json();
      if (data?.ok) {
        setAddedProfiles((prev) => new Set(prev).add(profile.id));
        fetchData(true);
      }
    } catch (err) {
      console.error("Error adding from rowiverse:", err);
    }
  }

  /* =========================================================
     ✏️ EDITAR MIEMBRO
  ========================================================= */
  async function handleEditMember(data: Partial<Member>) {
    if (!editingMember) return;

    try {
      const res = await fetch(`/api/community/members/${editingMember.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result?.ok) {
        setEditingMember(null);
        fetchData(true);
      }
    } catch (err) {
      console.error("Error editing member:", err);
    }
  }

  /* =========================================================
     🗑️ ELIMINAR MIEMBRO
  ========================================================= */
  async function handleDeleteMember() {
    if (!deletingMember) return;

    try {
      const res = await fetch(`/api/community/members/${deletingMember.id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (result?.ok) {
        setDeletingMember(null);
        fetchData(true);
      }
    } catch (err) {
      console.error("Error deleting member:", err);
    }
  }

  /* =========================================================
     🔄 RECALCULAR AFINIDAD
  ========================================================= */
  async function recalculateAffinity(memberId: string) {
    try {
      await fetch(`/api/affinity?memberId=${memberId}`, { cache: "no-store" });
      fetchData(true);
    } catch (err) {
      console.error("Error recalculating affinity:", err);
    }
  }

  /* =========================================================
     ❌ CANCELAR INVITACIÓN
  ========================================================= */
  async function cancelInvite(inviteId: string) {
    try {
      await fetch("/api/community/invite", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId }),
      });
      fetchData(true);
    } catch (err) {
      console.error("Error cancelling invite:", err);
    }
  }

  /* =========================================================
     🎨 RENDER
  ========================================================= */
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center pt-20">
        <Loader2 className="w-8 h-8 text-[var(--rowi-g2)] animate-spin" />
        <p className="mt-4 text-gray-500 dark:text-gray-400">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Users className="w-7 h-7 sm:w-8 sm:h-8 text-[var(--rowi-g2)]" />
            {t.title}
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">{t.subtitle}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-3 rounded-xl border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            title={t.refreshing}
          >
            <RefreshCw className={`w-5 h-5 text-gray-500 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
          >
            <UserPlus className="w-5 h-5" />
            <span className="hidden sm:inline">{t.inviteTitle}</span>
            <span className="sm:hidden">Invitar</span>
          </button>
        </div>
      </motion.div>

      {/* STATS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        <StatCard icon={Users} label={t.stats.total} value={stats.total} color="blue" />
        <StatCard icon={UserCheck} label={t.stats.connected} value={stats.connected} color="green" />
        <StatCard icon={Clock} label={t.stats.pending} value={stats.pending} color="amber" />
        <StatCard icon={Heart} label={t.stats.avgAffinity} value={`${stats.avgAffinity}%`} color="pink" />
      </motion.div>

      {/* AFFINITY SUGGESTIONS PANEL */}
      {affinitySuggestions.topThree.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-r from-[var(--rowi-g1)]/5 to-[var(--rowi-g2)]/5 rounded-2xl border border-[var(--rowi-g2)]/20 p-4 sm:p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-[var(--rowi-g2)]" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {lang === "es" ? "Sugerencias de Afinidad" : "Affinity Insights"}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Best connections */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-gray-200 dark:border-zinc-800">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {lang === "es" ? "Mejores conexiones" : "Best connections"}
                </span>
              </div>
              <div className="space-y-2">
                {affinitySuggestions.topThree.map((m, i) => (
                  <div key={m.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">#{i + 1}</span>
                      <span className="text-sm text-gray-900 dark:text-white truncate max-w-[120px]">{m.name}</span>
                      {m.brainStyle && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--rowi-g2)]/10 text-[var(--rowi-g2)]">
                          {m.brainStyle}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-green-600">{m.affinityPercent}%</span>
                  </div>
                ))}
              </div>
              {affinitySuggestions.highAffinityCount > 3 && (
                <p className="text-xs text-gray-500 mt-2">
                  +{affinitySuggestions.highAffinityCount - 3} {lang === "es" ? "más con alta afinidad" : "more with high affinity"}
                </p>
              )}
            </div>

            {/* Needs attention */}
            {affinitySuggestions.bottomThree.length > 0 && affinitySuggestions.lowAffinityCount > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-gray-200 dark:border-zinc-800">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {lang === "es" ? "Oportunidades de mejora" : "Room for growth"}
                  </span>
                </div>
                <div className="space-y-2">
                  {affinitySuggestions.bottomThree.slice(0, 3).map((m) => (
                    <div key={m.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-900 dark:text-white truncate max-w-[140px]">{m.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-amber-600">{m.affinityPercent}%</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  💡 {lang === "es"
                    ? "Considera iniciar una conversación para fortalecer estas conexiones"
                    : "Consider starting a conversation to strengthen these connections"}
                </p>
              </div>
            )}
          </div>

          {/* Quick action */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {lang === "es"
                ? `${affinitySuggestions.highAffinityCount} conexiones fuertes · ${affinitySuggestions.lowAffinityCount} oportunidades`
                : `${affinitySuggestions.highAffinityCount} strong connections · ${affinitySuggestions.lowAffinityCount} opportunities`}
            </p>
            <Link
              href="/affinity"
              className="text-sm text-[var(--rowi-g2)] hover:underline flex items-center gap-1"
            >
              {lang === "es" ? "Ver análisis completo" : "View full analysis"}
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </motion.div>
      )}

      {/* TABS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-1 sm:gap-2 border-b border-gray-200 dark:border-zinc-800 overflow-x-auto"
      >
        {(["myPeople", "invited", "rowiverse"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab
                ? "border-[var(--rowi-g2)] text-[var(--rowi-g2)]"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {tab === "myPeople" && <Users className="w-4 h-4 inline mr-1.5 sm:mr-2" />}
            {tab === "invited" && <Mail className="w-4 h-4 inline mr-1.5 sm:mr-2" />}
            {tab === "rowiverse" && <Globe className="w-4 h-4 inline mr-1.5 sm:mr-2" />}
            {t.tabs[tab]}
            {tab === "invited" && stats.pending > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">
                {stats.pending}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* TAB CONTENT */}
      <AnimatePresence mode="wait">
        {activeTab === "myPeople" && (
          <motion.div
            key="myPeople"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* SEARCH & FILTERS */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t.search}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 focus:ring-2 focus:ring-[var(--rowi-g2)] focus:border-transparent outline-none text-sm sm:text-base"
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
                  showFilters
                    ? "bg-[var(--rowi-g2)]/10 border-[var(--rowi-g2)] text-[var(--rowi-g2)]"
                    : "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-gray-300"
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">{t.filters}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </button>
            </div>

            {/* FILTERS PANEL */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                    <select
                      value={groupFilter}
                      onChange={(e) => setGroupFilter(e.target.value)}
                      className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 outline-none text-sm"
                    >
                      <option value="all">{t.allGroups}</option>
                      <option value="Trabajo">{t.groups.work}</option>
                      <option value="Familia">{t.groups.family}</option>
                      <option value="Amigos">{t.groups.friends}</option>
                      <option value="Por conocer">{t.groups.toMeet}</option>
                      <option value="Rowiverse">{t.groups.rowiverse}</option>
                    </select>

                    <select
                      value={closenessFilter}
                      onChange={(e) => setClosenessFilter(e.target.value)}
                      className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 outline-none text-sm"
                    >
                      <option value="all">{t.allCloseness}</option>
                      <option value="Muy cercano">{t.closeness.veryClose}</option>
                      <option value="Cercano">{t.closeness.close}</option>
                      <option value="Neutral">{t.closeness.neutral}</option>
                      <option value="Distante">{t.closeness.distant}</option>
                      <option value="Muy distante">{t.closeness.veryDistant}</option>
                    </select>

                    <select
                      value={connectionTypeFilter}
                      onChange={(e) => setConnectionTypeFilter(e.target.value)}
                      className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 outline-none text-sm"
                    >
                      <option value="all">{t.fieldConnectionType}</option>
                      <option value="colleague">{t.connectionTypes.colleague}</option>
                      <option value="boss">{t.connectionTypes.boss}</option>
                      <option value="directReport">{t.connectionTypes.directReport}</option>
                      <option value="mentor">{t.connectionTypes.mentor}</option>
                      <option value="mentee">{t.connectionTypes.mentee}</option>
                      <option value="partner">{t.connectionTypes.partner}</option>
                      <option value="client">{t.connectionTypes.client}</option>
                      <option value="friend">{t.connectionTypes.friend}</option>
                      <option value="familyMember">{t.connectionTypes.familyMember}</option>
                      <option value="acquaintance">{t.connectionTypes.acquaintance}</option>
                    </select>

                    <label className="flex items-center gap-2 px-3 py-2">
                      <input
                        type="checkbox"
                        checked={onlyAffinity}
                        onChange={(e) => setOnlyAffinity(e.target.checked)}
                        className="w-4 h-4 rounded text-[var(--rowi-g2)]"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{t.onlyWithAffinity}</span>
                    </label>

                    <button
                      onClick={() => {
                        setGroupFilter("all");
                        setClosenessFilter("all");
                        setConnectionTypeFilter("all");
                        setOnlyAffinity(false);
                        setSearch("");
                      }}
                      className="text-sm text-[var(--rowi-g2)] hover:underline"
                    >
                      {t.clearFilters}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* MEMBERS GRID */}
            {filteredMembers.length === 0 ? (
              <EmptyState
                icon={Users}
                title={t.noMembers}
                description={t.startInviting}
                action={{
                  label: t.inviteTitle,
                  onClick: () => setShowInviteModal(true),
                }}
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredMembers.map((member, index) => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    t={t}
                    index={index}
                    onEdit={() => setEditingMember(member)}
                    onDelete={() => setDeletingMember(member)}
                    onRecalculate={() => recalculateAffinity(member.id)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "invited" && (
          <motion.div
            key="invited"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {invites.length === 0 ? (
              <EmptyState
                icon={Mail}
                title={t.noInvites}
                description={t.startInviting}
                action={{
                  label: t.inviteTitle,
                  onClick: () => setShowInviteModal(true),
                }}
              />
            ) : (
              <div className="space-y-3">
                {invites.map((invite) => (
                  <InviteCard key={invite.id} invite={invite} t={t} onCancel={() => cancelInvite(invite.id)} />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "rowiverse" && (
          <motion.div
            key="rowiverse"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="text-center max-w-2xl mx-auto">
              <Globe className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-[var(--rowi-g2)] mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {t.rowiverseTitle}
              </h2>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">{t.rowiverseDesc}</p>
            </div>

            <div className="max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t.rowiverseSearch}
                value={rowiverseSearch}
                onChange={(e) => {
                  setRowiverseSearch(e.target.value);
                  searchRowiverse(e.target.value);
                }}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 focus:ring-2 focus:ring-[var(--rowi-g2)] focus:border-transparent outline-none text-base sm:text-lg"
              />
              {searchingRowiverse && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--rowi-g2)] animate-spin" />
              )}
            </div>

            {rowiverseResults.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rowiverseResults.map((profile, index) => (
                  <RowiverseCard
                    key={profile.id}
                    profile={profile}
                    t={t}
                    index={index}
                    isAdded={addedProfiles.has(profile.id)}
                    onAdd={() => addFromRowiverse(profile)}
                  />
                ))}
              </div>
            ) : rowiverseSearch && !searchingRowiverse ? (
              <p className="text-center text-gray-500 dark:text-gray-400">{t.rowiverseEmpty}</p>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODALS */}
      <AnimatePresence>
        {showInviteModal && (
          <InviteModal
            t={t}
            planLimit={planLimit}
            remainingInvites={remainingInvites}
            onClose={() => setShowInviteModal(false)}
            onSuccess={() => {
              setShowInviteModal(false);
              fetchData(true);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingMember && (
          <EditMemberModal
            member={editingMember}
            t={t}
            onClose={() => setEditingMember(null)}
            onSave={handleEditMember}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletingMember && (
          <DeleteConfirmModal
            member={deletingMember}
            t={t}
            onClose={() => setDeletingMember(null)}
            onConfirm={handleDeleteMember}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* =========================================================
   📊 Stat Card
========================================================= */
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: "blue" | "green" | "amber" | "pink";
}) {
  const colors = {
    blue: "from-blue-500 to-cyan-500",
    green: "from-green-500 to-emerald-500",
    amber: "from-amber-500 to-orange-500",
    pink: "from-pink-500 to-rose-500",
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-zinc-800 p-3 sm:p-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <div
          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-r ${colors[color]} flex items-center justify-center`}
        >
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <div>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   👤 Member Card with Actions
========================================================= */
function MemberCard({
  member,
  t,
  index,
  onEdit,
  onDelete,
  onRecalculate,
}: {
  member: Member;
  t: typeof translations.es;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onRecalculate: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const affinity = member.affinityPercent ?? null;

  // Affinity styling
  let affinityColor = "bg-gray-200 dark:bg-zinc-700";
  let affinityLabel = t.affinity.noConnection;

  if (affinity !== null) {
    if (affinity >= 85) {
      affinityColor = "bg-green-500";
      affinityLabel = t.affinity.fullTrust;
    } else if (affinity >= 70) {
      affinityColor = "bg-lime-500";
      affinityLabel = t.affinity.goodConnection;
    } else if (affinity >= 55) {
      affinityColor = "bg-yellow-500";
      affinityLabel = t.affinity.mediumPotential;
    } else if (affinity >= 35) {
      affinityColor = "bg-orange-500";
      affinityLabel = t.affinity.lowConnection;
    } else {
      affinityColor = "bg-red-500";
      affinityLabel = t.affinity.distant;
    }
  }

  const GroupIcon = GROUP_ICONS[member.group as keyof typeof GROUP_ICONS] || Users;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-zinc-800 p-4 sm:p-5 hover:shadow-lg hover:border-[var(--rowi-g2)]/50 transition-all group relative"
    >
      {/* Actions Menu */}
      <div className="absolute top-3 right-3">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="w-4 h-4 text-gray-500" />
        </button>

        <AnimatePresence>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-8 z-20 w-48 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-700 py-1 overflow-hidden"
              >
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit();
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  {t.actions.edit}
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onRecalculate();
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  {t.actions.recalculate}
                </button>
                <Link
                  href={`/community/${member.id}`}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  {t.actions.viewProfile}
                </Link>
                <hr className="my-1 border-gray-200 dark:border-zinc-700" />
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete();
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {t.actions.delete}
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-start gap-3 sm:gap-4">
        {/* Avatar */}
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] flex items-center justify-center text-white font-semibold text-base sm:text-lg flex-shrink-0">
          {member.name?.charAt(0).toUpperCase() || "?"}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm sm:text-base">
            {member.name}
          </h3>
          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1 flex-wrap">
            <GroupIcon className="w-3 h-3 flex-shrink-0" />
            <span>{member.group}</span>
            {member.connectionType && (
              <>
                <span>·</span>
                <span className="text-[var(--rowi-g2)]">
                  {(t.connectionTypes as Record<string, string>)[member.connectionType] || member.connectionType}
                </span>
              </>
            )}
            {member.country && (
              <>
                <span>·</span>
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{member.country}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Closeness & Brain Style */}
      <div className="mt-2 sm:mt-3 flex items-center gap-3 flex-wrap">
        {/* Closeness indicator */}
        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs">
          {member.closeness === "Muy cercano" && <span className="text-green-500">💚</span>}
          {member.closeness === "Cercano" && <span className="text-lime-500">💛</span>}
          {member.closeness === "Neutral" && <span>😐</span>}
          {(member.closeness === "Distante" || member.closeness === "Lejano") && <span>🧊</span>}
          {member.closeness === "Muy distante" && <span>❄️</span>}
          <span className="text-gray-600 dark:text-gray-400">{member.closeness}</span>
        </div>

        {/* Brain Style */}
        {member.brainStyle && (
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
            <Brain className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{member.brainStyle}</span>
          </div>
        )}
      </div>

      {/* Affinity Bar */}
      <div className="mt-3 sm:mt-4">
        <div className="flex items-center justify-between text-[10px] sm:text-xs mb-1">
          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Heart className="w-3 h-3" />
            {affinityLabel}
          </span>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {affinity !== null ? `${affinity}%` : "—"}
          </span>
        </div>
        <div className="h-1.5 sm:h-2 w-full rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: affinity !== null ? `${affinity}%` : "0%" }}
            transition={{ duration: 0.8, delay: index * 0.03 + 0.3 }}
            className={`h-full rounded-full ${affinityColor}`}
          />
        </div>
      </div>

      {/* AI Summary */}
      {member.aiSummary && (
        <p className="mt-2 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 italic line-clamp-2">
          💬 {member.aiSummary}
        </p>
      )}
    </motion.div>
  );
}

/* =========================================================
   📨 Invite Card
========================================================= */
function InviteCard({
  invite,
  t,
  onCancel,
}: {
  invite: Invite;
  t: typeof translations.es;
  onCancel: () => void;
}) {
  const statusColors = {
    pending: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
    accepted: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
    expired: "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400",
  };

  const statusLabels = {
    pending: t.pending,
    accepted: t.accepted,
    expired: t.expired,
  };

  const channelIcons = {
    email: Mail,
    whatsapp: MessageCircle,
    sms: Phone,
  };

  const ChannelIcon = channelIcons[invite.channel] || Mail;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
          <ChannelIcon className="w-5 h-5 text-gray-500" />
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">{invite.contact}</p>
          <p className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-2 flex-wrap">
            <span>
              {t.sentOn} {new Date(invite.createdAt).toLocaleDateString()}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[invite.status]}`}
            >
              {statusLabels[invite.status]}
            </span>
          </p>
        </div>
      </div>

      {invite.status === "pending" && (
        <div className="flex gap-2 ml-auto sm:ml-0">
          <button
            onClick={onCancel}
            className="text-xs px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
          >
            {t.cancel}
          </button>
        </div>
      )}

      {invite.status === "accepted" && invite.acceptedBy && (
        <div className="flex items-center gap-2 text-xs text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span>{invite.acceptedBy.name}</span>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   🌍 Rowiverse Card
========================================================= */
function RowiverseCard({
  profile,
  t,
  index,
  isAdded,
  onAdd,
}: {
  profile: RowiverseProfile;
  t: typeof translations.es;
  index: number;
  isAdded: boolean;
  onAdd: () => void;
}) {
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    setAdding(true);
    await onAdd();
    setAdding(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-zinc-800 p-4 sm:p-5"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {profile.image ? (
          <Image
            src={profile.image}
            alt={profile.name}
            width={48}
            height={48}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
            {profile.name?.charAt(0).toUpperCase() || "?"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm sm:text-base">
            {profile.name}
          </h3>
          {profile.headline && (
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
              {profile.headline}
            </p>
          )}
          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-purple-600 dark:text-purple-400 mt-1">
            <Globe className="w-3 h-3" />
            {t.publicProfile}
          </div>
        </div>
      </div>

      {profile.bio && (
        <p className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
          {profile.bio}
        </p>
      )}

      {profile.eqLevel && (
        <div className="mt-2 flex items-center gap-2 text-[10px] sm:text-xs">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span className="text-gray-600 dark:text-gray-400">EQ: {profile.eqLevel}</span>
        </div>
      )}

      {(profile.country || profile.city) && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-500">
          <MapPin className="w-3 h-3" />
          <span>
            {[profile.city, profile.country].filter(Boolean).join(", ")}
          </span>
        </div>
      )}

      <button
        onClick={handleAdd}
        disabled={isAdded || adding}
        className={`w-full mt-3 sm:mt-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
          isAdded
            ? "bg-green-100 dark:bg-green-900/30 text-green-600"
            : "bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white hover:opacity-90"
        }`}
      >
        {adding ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isAdded ? (
          <>
            <Check className="w-4 h-4" />
            {t.added}
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4" />
            {t.addToCommunity}
          </>
        )}
      </button>
    </motion.div>
  );
}

/* =========================================================
   📭 Empty State
========================================================= */
function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="text-center py-12 sm:py-16">
      <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400" />
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white font-medium rounded-xl hover:opacity-90 transition-opacity text-sm"
        >
          <UserPlus className="w-5 h-5" />
          {action.label}
        </button>
      )}
    </div>
  );
}

/* =========================================================
   📧 Invite Modal - With WhatsApp/SMS Support
========================================================= */
function InviteModal({
  t,
  planLimit,
  remainingInvites,
  onClose,
  onSuccess,
}: {
  t: typeof translations.es;
  planLimit: number;
  remainingInvites: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [contact, setContact] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    inviteUrl: string;
    links: { email: string | null; whatsapp: string | null; sms: string | null };
    message: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const canInvite = remainingInvites > 0;

  async function handleCreate() {
    if (!contact.trim()) return;

    setSending(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/community/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: contact.trim(),
          name: name.trim() || undefined,
          message: message.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to create invite");
      }

      setResult({
        inviteUrl: data.inviteUrl,
        links: data.links,
        message: data.message,
      });
    } catch (err: any) {
      setError(err.message || t.inviteError);
    } finally {
      setSending(false);
    }
  }

  function copyLink() {
    if (result?.inviteUrl) {
      navigator.clipboard.writeText(result.inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleDone() {
    onSuccess();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-gray-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{t.inviteTitle}</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t.inviteDesc}</p>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Plan limit warning */}
          {!canInvite && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <Crown className="w-5 h-5" />
                <span className="font-medium">
                  {t.planLimit} {planLimit} {t.people}
                </span>
              </div>
              <Link href="/pricing" className="text-sm text-[var(--rowi-g2)] hover:underline mt-2 inline-block">
                {t.upgradePlan}
              </Link>
            </div>
          )}

          {!result ? (
            <>
              {/* Remaining invites */}
              {canInvite && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {remainingInvites} {t.remainingInvites}
                </p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.inviteContact} *
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  disabled={!canInvite}
                  placeholder="nombre@email.com o +1234567890"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 focus:ring-2 focus:ring-[var(--rowi-g2)] outline-none disabled:opacity-50 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.inviteName}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!canInvite}
                  placeholder="Juan Pérez"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 focus:ring-2 focus:ring-[var(--rowi-g2)] outline-none disabled:opacity-50 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.inviteMessage}
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={!canInvite}
                  placeholder={t.inviteDefaultMessage}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 focus:ring-2 focus:ring-[var(--rowi-g2)] outline-none resize-none disabled:opacity-50 text-sm"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Success - Show send options */}
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t.inviteSent}</h3>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.sendVia}</p>

                {result.links.email && (
                  <a
                    href={result.links.email}
                    className="flex items-center gap-3 w-full p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                    <span className="font-medium">Email</span>
                    <ExternalLink className="w-4 h-4 ml-auto" />
                  </a>
                )}

                {result.links.whatsapp && (
                  <a
                    href={result.links.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 w-full p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-medium">WhatsApp</span>
                    <ExternalLink className="w-4 h-4 ml-auto" />
                  </a>
                )}

                {result.links.sms && (
                  <a
                    href={result.links.sms}
                    className="flex items-center gap-3 w-full p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/50 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    <span className="font-medium">SMS</span>
                    <ExternalLink className="w-4 h-4 ml-auto" />
                  </a>
                )}

                <button
                  onClick={copyLink}
                  className="flex items-center gap-3 w-full p-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                >
                  {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                  <span className="font-medium">{copied ? t.linkCopied : t.copyLink}</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 border-t border-gray-200 dark:border-zinc-800 flex gap-3">
          {!result ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-sm"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleCreate}
                disabled={!canInvite || !contact.trim() || sending}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {t.sendInvite}
              </button>
            </>
          ) : (
            <button
              onClick={handleDone}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white font-medium hover:opacity-90 transition-opacity text-sm"
            >
              OK
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* =========================================================
   ✏️ Edit Member Modal
========================================================= */
function EditMemberModal({
  member,
  t,
  onClose,
  onSave,
}: {
  member: Member;
  t: typeof translations.es;
  onClose: () => void;
  onSave: (data: Partial<Member>) => void;
}) {
  const [formData, setFormData] = useState({
    name: member.name || "",
    email: member.email || "",
    group: member.group || "Trabajo",
    closeness: member.closeness || "Neutral",
    connectionType: member.connectionType || "",
    country: member.country || "",
    brainStyle: member.brainStyle || "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave(formData);
    setSaving(false);
  }

  // Closeness levels with visual indicators
  const closenessLevels = [
    { value: "Muy cercano", label: t.closeness.veryClose, color: "bg-green-500", icon: "💚" },
    { value: "Cercano", label: t.closeness.close, color: "bg-lime-500", icon: "💛" },
    { value: "Neutral", label: t.closeness.neutral, color: "bg-yellow-500", icon: "😐" },
    { value: "Distante", label: t.closeness.distant, color: "bg-orange-500", icon: "🧊" },
    { value: "Muy distante", label: t.closeness.veryDistant, color: "bg-red-500", icon: "❄️" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div className="p-5 sm:p-6 border-b border-gray-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-[var(--rowi-g2)]" />
              {t.editTitle}
            </h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.fieldName} *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 focus:ring-2 focus:ring-[var(--rowi-g2)] outline-none text-sm"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.fieldEmail}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 focus:ring-2 focus:ring-[var(--rowi-g2)] outline-none text-sm"
              />
            </div>
          </div>

          {/* Closeness - Visual Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t.fieldCloseness}
            </label>
            <div className="flex gap-2 flex-wrap">
              {closenessLevels.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, closeness: level.value })}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all text-sm ${
                    formData.closeness === level.value
                      ? "border-[var(--rowi-g2)] bg-[var(--rowi-g2)]/10 text-[var(--rowi-g2)]"
                      : "border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600"
                  }`}
                >
                  <span className="text-base">{level.icon}</span>
                  <span className="font-medium">{level.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Group & Connection Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.fieldGroup}
              </label>
              <select
                value={formData.group}
                onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 focus:ring-2 focus:ring-[var(--rowi-g2)] outline-none text-sm"
              >
                <option value="Trabajo">{t.groups.work}</option>
                <option value="Familia">{t.groups.family}</option>
                <option value="Amigos">{t.groups.friends}</option>
                <option value="Por conocer">{t.groups.toMeet}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.fieldConnectionType}
              </label>
              <select
                value={formData.connectionType}
                onChange={(e) => setFormData({ ...formData, connectionType: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 focus:ring-2 focus:ring-[var(--rowi-g2)] outline-none text-sm"
              >
                <option value="">—</option>
                <option value="colleague">{t.connectionTypes.colleague}</option>
                <option value="boss">{t.connectionTypes.boss}</option>
                <option value="directReport">{t.connectionTypes.directReport}</option>
                <option value="mentor">{t.connectionTypes.mentor}</option>
                <option value="mentee">{t.connectionTypes.mentee}</option>
                <option value="partner">{t.connectionTypes.partner}</option>
                <option value="client">{t.connectionTypes.client}</option>
                <option value="friend">{t.connectionTypes.friend}</option>
                <option value="familyMember">{t.connectionTypes.familyMember}</option>
                <option value="acquaintance">{t.connectionTypes.acquaintance}</option>
                <option value="other">{t.connectionTypes.other}</option>
              </select>
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.fieldCountry}
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 focus:ring-2 focus:ring-[var(--rowi-g2)] outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.fieldBrainStyle}
              </label>
              <input
                type="text"
                value={formData.brainStyle}
                onChange={(e) => setFormData({ ...formData, brainStyle: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 focus:ring-2 focus:ring-[var(--rowi-g2)] outline-none text-sm"
              />
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 border-t border-gray-200 dark:border-zinc-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-sm"
          >
            {t.editCancel}
          </button>
          <button
            onClick={handleSave}
            disabled={!formData.name.trim() || saving}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            {t.editSave}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* =========================================================
   🗑️ Delete Confirmation Modal
========================================================= */
function DeleteConfirmModal({
  member,
  t,
  onClose,
  onConfirm,
}: {
  member: Member;
  t: typeof translations.es;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await onConfirm();
    setDeleting(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
      >
        <div className="p-6 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
            <Trash2 className="w-7 h-7 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t.deleteTitle}</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {t.deleteConfirm} <strong>{member.name}</strong>?
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{t.deleteWarning}</p>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-zinc-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-sm"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {t.deleteButton}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
