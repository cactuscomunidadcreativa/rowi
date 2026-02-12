"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import {
  MessageCircle,
  Send,
  ArrowLeft,
  Search,
  Loader2,
  Check,
  CheckCheck,
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
          <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[var(--rowi-g2)]" />
            Mensajes
          </h1>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar conversación..."
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
            <div className="text-center py-10 text-gray-400 text-sm">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No hay conversaciones aún</p>
              <p className="text-xs mt-1">Conecta con alguien para empezar</p>
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
                        {formatTimeShort(thread.lastMessage.createdAt)}
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
              <p>Selecciona una conversación</p>
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
                  <p>Inicia la conversación</p>
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
                          {formatTimeShort(msg.createdAt)}
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
                  placeholder="Escribe un mensaje..."
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
    </div>
  );
}

function formatTimeShort(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Ayer";

  return date.toLocaleDateString("es", { day: "numeric", month: "short" });
}
