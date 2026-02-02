"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Check,
  ExternalLink,
  FlaskConical,
  Users,
  BarChart3,
  Settings,
  ChevronDown,
  Search,
  Plus,
  Upload,
  Target,
  TrendingUp,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

/* =========================================================
   🎛️ Admin Header - Barra superior del panel admin
   Incluye: búsqueda, acciones rápidas, notificaciones
========================================================= */

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Quick actions para admin
const QUICK_ACTIONS = [
  {
    href: "/hub/admin/users",
    icon: Users,
    labelES: "Usuarios",
    labelEN: "Users",
    color: "#3b82f6",
  },
  {
    href: "/hub/admin/communities",
    icon: Users,
    labelES: "Comunidades",
    labelEN: "Communities",
    color: "#10b981",
  },
  {
    href: "/hub/admin/benchmarks",
    icon: BarChart3,
    labelES: "Benchmarks",
    labelEN: "Benchmarks",
    color: "#8b5cf6",
  },
  {
    href: "/research",
    icon: FlaskConical,
    labelES: "Investigación",
    labelEN: "Research",
    color: "#7c3aed",
  },
];

export default function AdminHeader() {
  const { t, lang } = useI18n();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Evitar hydration mismatch - solo renderizar contenido dinámico después del mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch notificaciones
  const { data: notificationsData, mutate: refreshNotifications } = useSWR(
    "/api/notifications?limit=5&unreadOnly=false",
    fetcher,
    { revalidateOnFocus: true, refreshInterval: 60000 }
  );
  const notifications = notificationsData?.notifications || [];
  const unreadCount = notificationsData?.unreadCount || 0;

  // Marcar como leída
  const markAsRead = async (notificationId: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });
      refreshNotifications();
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      refreshNotifications();
    } catch (err) {
      console.error("Error:", err);
    }
  };

  // Usar idioma seguro - default "es" hasta que monte
  const safeLang = mounted ? lang : "es";

  return (
    <div className="flex items-center justify-between px-6 py-3">
      {/* Left: Search */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={safeLang === "es" ? "Buscar en admin..." : "Search admin..."}
            className="pl-10 pr-4 py-2 w-64 text-sm bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Right: Quick Actions + Notifications */}
      <div className="flex items-center gap-3">
        {/* Quick Actions */}
        <div className="relative">
          <button
            onClick={() => setActionsOpen((v) => !v)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {safeLang === "es" ? "Acciones" : "Actions"}
            <ChevronDown className={`w-4 h-4 transition-transform ${actionsOpen ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {actionsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-xl overflow-hidden z-50"
              >
                <div className="p-2">
                  <p className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {safeLang === "es" ? "Acceso Rápido" : "Quick Access"}
                  </p>
                  {QUICK_ACTIONS.map((action) => (
                    <Link
                      key={action.href}
                      href={action.href}
                      onClick={() => setActionsOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      <div
                        className="p-1.5 rounded-lg"
                        style={{ backgroundColor: `${action.color}20` }}
                      >
                        <action.icon className="w-4 h-4" style={{ color: action.color }} />
                      </div>
                      {safeLang === "es" ? action.labelES : action.labelEN}
                    </Link>
                  ))}
                </div>
                <div className="border-t border-gray-200 dark:border-zinc-700 p-2">
                  <p className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {safeLang === "es" ? "Crear Nuevo" : "Create New"}
                  </p>
                  <Link
                    href="/hub/admin/benchmarks/upload"
                    onClick={() => setActionsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <Upload className="w-4 h-4 text-violet-500" />
                    {safeLang === "es" ? "Subir Benchmark" : "Upload Benchmark"}
                  </Link>
                  <Link
                    href="/hub/admin/communities"
                    onClick={() => setActionsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <Users className="w-4 h-4 text-emerald-500" />
                    {safeLang === "es" ? "Nueva Comunidad" : "New Community"}
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen((v) => !v)}
            className="relative p-2 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
            title={safeLang === "es" ? "Notificaciones" : "Notifications"}
          >
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-xl overflow-hidden z-50"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-zinc-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {safeLang === "es" ? "Notificaciones" : "Notifications"}
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-violet-600 hover:text-violet-700"
                    >
                      {safeLang === "es" ? "Marcar leídas" : "Mark read"}
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center">
                      <Bell className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">
                        {safeLang === "es" ? "Sin notificaciones" : "No notifications"}
                      </p>
                    </div>
                  ) : (
                    notifications.map((notif: any) => (
                      <div
                        key={notif.id}
                        className={`px-4 py-3 border-b border-gray-100 dark:border-zinc-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-zinc-800/50 ${
                          !notif.readAt ? "bg-violet-50/50 dark:bg-violet-900/10" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {notif.title}
                            </p>
                            <p className="text-xs text-gray-500 line-clamp-1">
                              {notif.message}
                            </p>
                          </div>
                          {!notif.readAt && (
                            <button
                              onClick={() => markAsRead(notif.id)}
                              className="p-1 text-gray-400 hover:text-green-600"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <Link
                  href="/hub/admin/notifications"
                  onClick={() => setNotificationsOpen(false)}
                  className="block px-4 py-2.5 text-center text-sm text-violet-600 hover:bg-gray-50 dark:hover:bg-zinc-800 border-t border-gray-200 dark:border-zinc-700"
                >
                  {safeLang === "es" ? "Ver todas" : "View all"}
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Settings */}
        <Link
          href="/hub/admin/settings"
          className="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
          title={safeLang === "es" ? "Configuración" : "Settings"}
        >
          <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
      </div>
    </div>
  );
}
