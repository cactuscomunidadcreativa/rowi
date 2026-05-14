"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  MessageCircle,
  Send,
  ArrowLeft,
  Search,
  Loader2,
  Check,
  CheckCheck,
  Plus,
  X,
  UserPlus,
} from "lucide-react";

/* =========================================================
   💬 Página de Mensajería P2P

   Split layout: lista de threads (izq) + chat (der)
   Mobile: navegación entre vistas
========================================================= */

interface Thread {
  id: string;
  type: string;
  name: string | null;
  lastMessageAt: string;
  otherUser: { id: string; name: string; image: string | null; headline: string | null } | null;
  lastMessage: {
    content: string;
    senderId: string;
    createdAt: string;
    isRead: boolean;
  } | null;
  unreadCount: number;
  isMuted: boolean;
}

interface Message {
  id: string;
  content: string;
  type: string;
  senderId: string;
  createdAt: string;
  readBy: string[];
  sender: { id: true; name: string; image: string | null };
}

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    searchParams.get("thread")
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [showThreadList, setShowThreadList] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");

  /* === Estado del modal "Nueva conversación" === */
  const [showNewThread, setShowNewThread] = useState(false);
  const [connections, setConnections] = useState<
    Array<{
      key: string;
      userId: string;
      name: string;
      image: string | null;
      headline: string | null;
      /** "connection" | "community" | "team" — para el badge */
      origin: "connection" | "community" | "team";
      originLabel: string;
    }>
  >([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [newThreadSearch, setNewThreadSearch] = useState("");
  const [startingThread, setStartingThread] = useState<string | null>(null);

  // Fetch threads
  const fetchThreads = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/social/messages/threads");
      const data = await res.json();
      if (data.ok) setThreads(data.threads);
    } catch (err) {
      console.error("Error fetching threads:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  // Fetch messages when thread selected
  useEffect(() => {
    if (!selectedThreadId) return;
    fetchMessages(selectedThreadId);
    markAsRead(selectedThreadId);
  }, [selectedThreadId]);

  const fetchMessages = async (threadId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/social/messages/threads/${threadId}`);
      const data = await res.json();
      if (data.ok) {
        setMessages(data.messages);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const markAsRead = async (threadId: string) => {
    try {
      await fetch(`/api/social/messages/threads/${threadId}/read`, { method: "POST" });
    } catch (err) {
      // Silent
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedThreadId) return;
    setSending(true);
    try {
      const res = await fetch(
        `/api/social/messages/threads/${selectedThreadId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: messageText.trim() }),
        }
      );
      const data = await res.json();
      if (data.ok) {
        setMessages((prev) => [...prev, data.message]);
        setMessageText("");
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        fetchThreads(); // Update last message in thread list
      }
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  };

  /* =========================================================
     ➕ Iniciar conversación nueva
     Combina 3 fuentes (dedup por userId):
       1. Conexiones activas (rowiRelation)
       2. Miembros de tu RowiCommunity con cuenta vinculada
       3. Compañeros del mismo tenant
     El backend (POST /threads) acepta cualquiera de las tres.
  ========================================================= */
  const openNewThread = async () => {
    setShowNewThread(true);
    setNewThreadSearch("");
    setLoadingConnections(true);
    try {
      const [connRes, memRes] = await Promise.all([
        fetch("/api/social/connections?status=active").catch(() => null),
        fetch("/api/community/members").catch(() => null),
      ]);

      const connData = connRes && connRes.ok ? await connRes.json() : { connections: [] };
      const memData = memRes && memRes.ok ? await memRes.json() : { members: [] };

      const byUserId = new Map<
        string,
        {
          key: string;
          userId: string;
          name: string;
          image: string | null;
          headline: string | null;
          origin: "connection" | "community" | "team";
          originLabel: string;
        }
      >();

      // 1) Conexiones (prioridad alta, las metemos primero)
      for (const c of connData.connections || []) {
        const u = c.user;
        if (!u?.id) continue;
        byUserId.set(u.id, {
          key: `conn-${c.id}`,
          userId: u.id,
          name: u.name || u.email?.split("@")[0] || "Usuario",
          image: u.image || null,
          headline: u.headline || null,
          origin: "connection",
          originLabel: t("social.messages.origin.connection", "Conexión"),
        });
      }

      // 2) Miembros de comunidad / teammates
      //    Solo los items con id "user_..." porque ese prefijo indica
      //    que hay un User real vinculado al cual sí podemos mensajear.
      for (const m of memData.members || []) {
        if (typeof m.id !== "string" || !m.id.startsWith("user_")) continue;
        const userId = m.id.replace("user_", "");
        if (byUserId.has(userId)) continue; // ya es conexión
        const isTeam = m.source === "tenant_user" || m.connectionType === "teammate";
        byUserId.set(userId, {
          key: `mem-${m.id}`,
          userId,
          name: m.name || m.email?.split("@")[0] || "Usuario",
          image: null,
          headline: m.brainStyle || m.hubName || null,
          origin: isTeam ? "team" : "community",
          originLabel: isTeam
            ? t("social.messages.origin.team", "Equipo")
            : t("social.messages.origin.community", "Comunidad"),
        });
      }

      setConnections(Array.from(byUserId.values()));
    } catch (err) {
      console.error("Error loading connections/members:", err);
      setConnections([]);
    } finally {
      setLoadingConnections(false);
    }
  };

  const startThread = async (userId: string) => {
    setStartingThread(userId);
    try {
      const res = await fetch("/api/social/messages/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.ok && data.thread) {
        await fetchThreads();
        setSelectedThreadId(data.thread.id);
        setShowThreadList(false);
        setShowNewThread(false);
      }
    } catch (err) {
      console.error("Error starting thread:", err);
    } finally {
      setStartingThread(null);
    }
  };

  const filteredConnections = newThreadSearch
    ? connections.filter((c) =>
        c.name?.toLowerCase().includes(newThreadSearch.toLowerCase())
      )
    : connections;

  const selectedThread = threads.find((t) => t.id === selectedThreadId);
  const filteredThreads = search
    ? threads.filter((t) =>
        t.otherUser?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : threads;

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Thread List */}
      <div
        className={`w-full md:w-80 lg:w-96 border-r border-gray-200 dark:border-zinc-800 flex flex-col bg-white dark:bg-zinc-900 ${
          selectedThreadId && !showThreadList ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-[var(--rowi-g2)]" />
              {t("social.messages.title")}
            </h1>
            <button
              onClick={openNewThread}
              title={t("social.messages.newConversation", "Nueva conversación")}
              aria-label={t("social.messages.newConversation", "Nueva conversación")}
              className="p-2 rounded-full bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white hover:opacity-90 transition-opacity shadow-sm"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t("social.messages.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm px-4">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>{t("social.messages.empty")}</p>
              <p className="text-xs mt-1">{t("social.messages.empty.desc")}</p>
              <button
                onClick={openNewThread}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white text-xs font-medium hover:opacity-90 transition-opacity"
              >
                <Plus className="w-3.5 h-3.5" />
                {t("social.messages.newConversation", "Nueva conversación")}
              </button>
            </div>
          ) : (
            filteredThreads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => {
                  setSelectedThreadId(thread.id);
                  setShowThreadList(false);
                }}
                className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors border-b border-gray-100 dark:border-zinc-800/50 ${
                  selectedThreadId === thread.id
                    ? "bg-[var(--rowi-g2)]/5"
                    : ""
                }`}
              >
                {thread.otherUser?.image ? (
                  <img
                    src={thread.otherUser.image}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--rowi-g1)] to-[var(--rowi-g2)] flex items-center justify-center text-white font-bold flex-shrink-0">
                    {thread.otherUser?.name?.charAt(0) || "?"}
                  </div>
                )}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {thread.otherUser?.name || "Usuario"}
                    </span>
                    {thread.lastMessage && (
                      <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">
                        {formatTimeShort(thread.lastMessage.createdAt, t)}
                      </span>
                    )}
                  </div>
                  {thread.lastMessage && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {thread.lastMessage.content}
                    </p>
                  )}
                </div>
                {thread.unreadCount > 0 && (
                  <div className="w-5 h-5 rounded-full bg-[var(--rowi-g2)] text-white text-[10px] flex items-center justify-center flex-shrink-0">
                    {thread.unreadCount}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div
        className={`flex-1 flex flex-col bg-gray-50 dark:bg-zinc-950 ${
          !selectedThreadId || showThreadList ? "hidden md:flex" : "flex"
        }`}
      >
        {!selectedThreadId ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{t("social.messages.selectThread")}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-3 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-3">
              <button
                onClick={() => {
                  setShowThreadList(true);
                  setSelectedThreadId(null);
                }}
                className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              {selectedThread?.otherUser?.image ? (
                <img
                  src={selectedThread.otherUser.image}
                  alt=""
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--rowi-g1)] to-[var(--rowi-g2)] flex items-center justify-center text-white font-bold text-sm">
                  {selectedThread?.otherUser?.name?.charAt(0) || "?"}
                </div>
              )}
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {selectedThread?.otherUser?.name || "Usuario"}
                </h2>
                {selectedThread?.otherUser?.headline && (
                  <p className="text-xs text-gray-400 truncate">
                    {selectedThread.otherUser.headline}
                  </p>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  <p>{t("social.messages.empty")}</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.senderId === selectedThread?.otherUser?.id ? false : true;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                          isMine
                            ? "bg-[var(--rowi-g2)] text-white rounded-br-sm"
                            : "bg-white dark:bg-zinc-800 text-gray-900 dark:text-white rounded-bl-sm shadow-sm"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <div
                          className={`text-[10px] mt-1 flex items-center gap-1 ${
                            isMine ? "text-white/60 justify-end" : "text-gray-400"
                          }`}
                        >
                          {formatTimeShort(msg.createdAt, t)}
                          {isMine && (
                            msg.readBy.length > 1 ? (
                              <CheckCheck className="w-3 h-3" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder={t("social.messages.input")}
                  className="flex-1 px-4 py-2 rounded-full border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--rowi-g2)]/30"
                />
                <button
                  onClick={sendMessage}
                  disabled={!messageText.trim() || sending}
                  className="p-2.5 rounded-full bg-[var(--rowi-g2)] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ==========================================================
          ➕ Modal "Nueva conversación"
          - Lista conexiones activas (rowiRelation status=active)
          - Click → crea/encuentra thread y lo abre
          ========================================================== */}
      <AnimatePresence>
        {showNewThread && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowNewThread(false)}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--rowi-g1)] to-[var(--rowi-g2)] flex items-center justify-center">
                    <UserPlus className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    {t("social.messages.newConversation", "Nueva conversación")}
                  </h2>
                </div>
                <button
                  onClick={() => setShowNewThread(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Search */}
              <div className="p-3 border-b border-gray-100 dark:border-zinc-800">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t(
                      "social.messages.searchConnection",
                      "Buscar entre tus conexiones..."
                    )}
                    value={newThreadSearch}
                    onChange={(e) => setNewThreadSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>

              {/* Connections list */}
              <div className="flex-1 overflow-y-auto">
                {loadingConnections ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : filteredConnections.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm px-4">
                    <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>
                      {connections.length === 0
                        ? t(
                            "social.messages.noConnections",
                            "Aún no tienes contactos disponibles"
                          )
                        : t(
                            "social.messages.noConnectionsMatch",
                            "Nadie coincide con tu búsqueda"
                          )}
                    </p>
                    {connections.length === 0 && (
                      <a
                        href="/social/connections"
                        className="inline-block mt-3 text-xs text-[var(--rowi-g2)] hover:underline"
                      >
                        {t(
                          "social.messages.discoverConnections",
                          "Descubrir personas →"
                        )}
                      </a>
                    )}
                  </div>
                ) : (
                  filteredConnections.map((c) => {
                    const badgeStyle =
                      c.origin === "connection"
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                        : c.origin === "team"
                          ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                          : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
                    return (
                      <button
                        key={c.key}
                        onClick={() => startThread(c.userId)}
                        disabled={startingThread === c.userId}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors border-b border-gray-50 dark:border-zinc-800/50 disabled:opacity-50"
                      >
                        {c.image ? (
                          <img
                            src={c.image}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--rowi-g1)] to-[var(--rowi-g2)] flex items-center justify-center text-white font-bold flex-shrink-0">
                            {c.name.charAt(0) || "?"}
                          </div>
                        )}
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {c.name}
                            </p>
                            <span
                              className={`px-1.5 py-0.5 text-[9px] rounded-full font-medium whitespace-nowrap ${badgeStyle}`}
                            >
                              {c.originLabel}
                            </span>
                          </div>
                          {c.headline && (
                            <p className="text-xs text-gray-500 truncate">
                              {c.headline}
                            </p>
                          )}
                        </div>
                        {startingThread === c.userId && (
                          <Loader2 className="w-4 h-4 animate-spin text-[var(--rowi-g2)]" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatTimeShort(dateStr: string, t: (key: string) => string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return t("social.messages.yesterday");

  return date.toLocaleDateString("es", { day: "numeric", month: "short" });
}
