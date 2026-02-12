"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  Clock,
  Search,
  Check,
  X,
  Ban,
  Trash2,
  Sparkles,
  Brain,
  Loader2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

/* =========================================================
   Connections Page

   Tabs: Connections | Pending Requests | Suggestions
   User cards with avatar, name, headline, actions
========================================================= */

interface ConnectionUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  headline: string | null;
  brainProfile: any;
}

interface Connection {
  id: string;
  status: string;
  type: string;
  strength: number | null;
  context: string | null;
  direction: string;
  createdAt: string;
  user: ConnectionUser;
}

interface Suggestion {
  user: ConnectionUser;
  reason: string;
  affinity: number;
  sharedCommunities: number;
}

type TabType = "active" | "pending" | "suggestions";

export default function ConnectionsPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabType>("active");
  const [connections, setConnections] = useState<Connection[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [counts, setCounts] = useState({
    active: 0,
    pending_sent: 0,
    pending_received: 0,
    blocked: 0,
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch connections
  const fetchConnections = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/social/connections");
      const data = await res.json();
      if (data.ok) {
        setConnections(data.connections);
        setCounts(data.counts);
      }
    } catch (err) {
      console.error("Error fetching connections:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch suggestions
  const fetchSuggestions = useCallback(async () => {
    try {
      const res = await fetch("/api/social/connections/suggestions?limit=20");
      const data = await res.json();
      if (data.ok) {
        setSuggestions(data.suggestions);
      }
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
    fetchSuggestions();
  }, [fetchConnections, fetchSuggestions]);

  // Send connection request
  const sendRequest = async (receiverId: string) => {
    setActionLoading(receiverId);
    try {
      const res = await fetch("/api/social/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId }),
      });
      const data = await res.json();
      if (data.ok) {
        // Remove from suggestions
        setSuggestions((prev) => prev.filter((s) => s.user.id !== receiverId));
        fetchConnections();
      }
    } catch (err) {
      console.error("Error sending request:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // Accept/reject/block
  const handleAction = async (
    connectionId: string,
    action: "accept" | "reject" | "block"
  ) => {
    setActionLoading(connectionId);
    try {
      const res = await fetch(`/api/social/connections/${connectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.ok) {
        fetchConnections();
      }
    } catch (err) {
      console.error("Error handling action:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // Remove connection
  const removeConnection = async (connectionId: string) => {
    setActionLoading(connectionId);
    try {
      const res = await fetch(`/api/social/connections/${connectionId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.ok) {
        fetchConnections();
      }
    } catch (err) {
      console.error("Error removing connection:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter connections by tab
  const filteredConnections = connections.filter((c) => {
    if (activeTab === "active") return c.status === "active";
    if (activeTab === "pending") return c.status === "pending";
    return false;
  });

  // Filter by search
  const displayConnections = search
    ? filteredConnections.filter(
        (c) =>
          c.user.name?.toLowerCase().includes(search.toLowerCase()) ||
          c.user.email?.toLowerCase().includes(search.toLowerCase())
      )
    : filteredConnections;

  const tabs: { key: TabType; label: string; icon: any; count?: number }[] = [
    { key: "active", label: t("social.connections.tabs.active"), icon: Users, count: counts.active },
    {
      key: "pending",
      label: t("social.connections.tabs.pending"),
      icon: Clock,
      count: counts.pending_received + counts.pending_sent,
    },
    {
      key: "suggestions",
      label: t("social.connections.tabs.suggestions"),
      icon: Sparkles,
      count: suggestions.length,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Users className="w-8 h-8 text-[var(--rowi-g2)]" />
          {t("social.connections.title")}
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          {t("social.connections.subtitle")}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 sm:gap-2 border-b border-gray-200 dark:border-zinc-800 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-shrink-0 flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? "border-[var(--rowi-g2)] text-[var(--rowi-g2)]"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key
                    ? "bg-[var(--rowi-g2)]/10 text-[var(--rowi-g2)]"
                    : "bg-gray-100 dark:bg-zinc-800 text-gray-500"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      {activeTab !== "suggestions" && (
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t("social.connections.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--rowi-g2)]/30"
          />
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-20"
          >
            <Loader2 className="w-8 h-8 animate-spin text-[var(--rowi-g2)]" />
          </motion.div>
        ) : activeTab === "suggestions" ? (
          <motion.div
            key="suggestions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {suggestions.length === 0 ? (
              <div className="col-span-full text-center py-16 text-gray-400">
                <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{t("social.connections.empty.suggestions")}</p>
              </div>
            ) : (
              suggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.user.id}
                  suggestion={suggestion}
                  onConnect={() => sendRequest(suggestion.user.id)}
                  isLoading={actionLoading === suggestion.user.id}
                />
              ))
            )}
          </motion.div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {displayConnections.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>
                  {activeTab === "active"
                    ? t("social.connections.empty.active")
                    : t("social.connections.empty.pending")}
                </p>
              </div>
            ) : (
              displayConnections.map((conn) => (
                <ConnectionCard
                  key={conn.id}
                  connection={conn}
                  onAccept={() => handleAction(conn.id, "accept")}
                  onReject={() => handleAction(conn.id, "reject")}
                  onBlock={() => handleAction(conn.id, "block")}
                  onRemove={() => removeConnection(conn.id)}
                  isLoading={actionLoading === conn.id}
                />
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* =========================================================
   Connection Card
========================================================= */
function ConnectionCard({
  connection,
  onAccept,
  onReject,
  onBlock,
  onRemove,
  isLoading,
}: {
  connection: Connection;
  onAccept: () => void;
  onReject: () => void;
  onBlock: () => void;
  onRemove: () => void;
  isLoading: boolean;
}) {
  const { t } = useI18n();
  const { user, status, direction, createdAt } = connection;

  return (
    <motion.div
      layout
      className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:shadow-sm transition-shadow"
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || ""}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--rowi-g1)] to-[var(--rowi-g2)] flex items-center justify-center text-white font-bold text-lg">
            {user.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
          {user.name || t("social.connections.unknownUser")}
        </h3>
        {user.headline && (
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {user.headline}
          </p>
        )}
        {user.brainProfile && (
          <div className="flex items-center gap-1 mt-1">
            <Brain className="w-3 h-3 text-purple-500" />
            <span className="text-xs text-purple-500">
              {typeof user.brainProfile === "string"
                ? user.brainProfile
                : user.brainProfile?.style || ""}
            </span>
          </div>
        )}
        {status === "pending" && (
          <p className="text-xs text-gray-400 mt-1">
            {direction === "sent" ? t("social.connections.sent") : t("social.connections.received")} ·{" "}
            {new Date(createdAt).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        ) : status === "pending" && direction === "received" ? (
          <>
            <button
              onClick={onAccept}
              className="p-2 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
              title={t("social.connections.actions.accept")}
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={onReject}
              className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
              title={t("social.connections.actions.reject")}
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : status === "pending" && direction === "sent" ? (
          <span className="text-xs text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full">
            {t("social.connections.pendingBadge")}
          </span>
        ) : status === "active" ? (
          <button
            onClick={onRemove}
            className="p-2 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
            title={t("social.connections.actions.remove")}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        ) : null}
      </div>
    </motion.div>
  );
}

/* =========================================================
   Suggestion Card
========================================================= */
function SuggestionCard({
  suggestion,
  onConnect,
  isLoading,
}: {
  suggestion: Suggestion;
  onConnect: () => void;
  isLoading: boolean;
}) {
  const { t } = useI18n();
  const { user, reason, affinity, sharedCommunities } = suggestion;

  return (
    <motion.div
      layout
      className="p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:shadow-md transition-shadow"
    >
      {/* Avatar */}
      <div className="flex items-center gap-3 mb-3">
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || ""}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--rowi-g1)] to-[var(--rowi-g2)] flex items-center justify-center text-white font-bold text-lg">
            {user.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
            {user.name || t("social.connections.unknownUser")}
          </h3>
          {user.headline && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {user.headline}
            </p>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {reason === "community" && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
            {sharedCommunities} {t("social.connections.mutual")}
          </span>
        )}
        {reason === "tenant" && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
            {t("social.connections.sameOrg")}
          </span>
        )}
        {affinity > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
            {t("social.connections.affinity")}: {affinity}%
          </span>
        )}
        {user.brainProfile && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-500">
            <Brain className="w-3 h-3 inline mr-0.5" />
            {typeof user.brainProfile === "string"
              ? user.brainProfile
              : user.brainProfile?.style || ""}
          </span>
        )}
      </div>

      {/* Connect Button */}
      <button
        onClick={onConnect}
        disabled={isLoading}
        className="w-full py-2 rounded-lg bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <UserPlus className="w-4 h-4" />
            {t("social.connections.actions.connect")}
          </>
        )}
      </button>
    </motion.div>
  );
}
