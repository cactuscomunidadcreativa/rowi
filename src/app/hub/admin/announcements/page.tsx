"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Megaphone,
  Send,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AnnouncementsPage() {
  const { data, mutate, isLoading } = useSWR("/api/hub/announcements", fetcher);
  const [tenantId, setTenantId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [broadcasting, setBroadcasting] = useState<string | null>(null);

  const announcements = Array.isArray(data) ? data : [];

  async function createAnnouncement() {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/hub/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: tenantId || undefined, title, content }),
      });
      setTitle("");
      setContent("");
      mutate();
    } catch (err) {
      console.error("Error creating announcement:", err);
    } finally {
      setSaving(false);
    }
  }

  async function broadcast(id: string) {
    setBroadcasting(id);
    try {
      await fetch(`/api/hub/announcements?id=${id}`, { method: "PATCH" });
      mutate();
    } catch (err) {
      console.error("Error broadcasting:", err);
    } finally {
      setBroadcasting(null);
    }
  }

  const statusConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
    PENDING: { icon: Clock, label: "Pendiente", color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" },
    SENT: { icon: CheckCircle2, label: "Enviado", color: "text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" },
    FAILED: { icon: AlertCircle, label: "Error", color: "text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <Megaphone className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Anuncios del Hub</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Crea y gestiona anuncios para los usuarios del hub
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 p-5 space-y-4 shadow-sm">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-500" />
            Nuevo Anuncio
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Tenant ID (opcional)
            </label>
            <input
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              placeholder="Dejar vacío para todos"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Título
            </label>
            <input
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              placeholder="Título del anuncio"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Contenido
            </label>
            <textarea
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
              rows={5}
              placeholder="Escribe el contenido del anuncio..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <button
            onClick={createAnnouncement}
            disabled={saving || !title.trim() || !content.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Creando...</>
            ) : (
              <><Plus className="w-4 h-4" /> Crear Anuncio</>
            )}
          </button>
        </div>

        {/* List */}
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Anuncios ({announcements.length})
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700">
              <Megaphone className="w-10 h-10 mx-auto text-gray-300 dark:text-zinc-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No hay anuncios creados todavía
              </p>
            </div>
          ) : (
            announcements.map((a: any) => {
              const st = statusConfig[a.status] || statusConfig.PENDING;
              const StatusIcon = st.icon;
              return (
                <div
                  key={a.id}
                  className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {a.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {a.message}
                      </p>
                    </div>
                    <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border font-medium flex-shrink-0 ${st.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {st.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-zinc-700">
                    <span className="text-xs text-gray-400">
                      {new Date(a.createdAt).toLocaleDateString("es", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {a.status === "PENDING" && (
                      <button
                        onClick={() => broadcast(a.id)}
                        disabled={broadcasting === a.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                      >
                        {broadcasting === a.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        Enviar
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
