"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  Bell,
  Send,
  Users,
  Mail,
  MessageSquare,
  Smartphone,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  RefreshCw,
  Settings,
  BarChart3,
  TrendingUp,
  Eye,
} from "lucide-react";

interface NotificationStats {
  total: number;
  pending: number;
  sent: number;
  failed: number;
  delivered: number;
  byChannel: Record<string, number>;
  byType: Record<string, number>;
}

interface NotificationItem {
  id: string;
  userId: string;
  userName?: string;
  type: string;
  channel: string;
  title: string | null;
  message: string;
  status: string;
  priority: number;
  scope: string;
  sentAt: string | null;
  createdAt: string;
  attempts: number;
  lastError: string | null;
}

export default function NotificationsAdminPage() {
  const { data: session } = useSession();
  const { t, locale } = useI18n();
  const [activeTab, setActiveTab] = useState<"overview" | "queue" | "send" | "templates">("overview");
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    channel: "",
    type: "",
  });

  // Send notification form
  const [sendForm, setSendForm] = useState({
    scope: "HUB" as "HUB" | "TENANT" | "USER",
    userId: "",
    type: "HUB_ANNOUNCEMENT",
    title: "",
    message: "",
    channels: ["IN_APP", "PUSH"] as string[],
    priority: 5,
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, queueRes] = await Promise.all([
        fetch("/api/admin/notifications/stats"),
        fetch(`/api/admin/notifications/queue?${new URLSearchParams(filters)}`),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      if (queueRes.ok) {
        const queueData = await queueRes.json();
        setNotifications(queueData.notifications || []);
      }
    } catch (error) {
      console.error("Error loading notifications data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sendForm),
      });

      if (res.ok) {
        const data = await res.json();
        alert(t("admin.notifications.send.success").replace("{{count}}", data.recipientCount));
        setSendForm({
          ...sendForm,
          title: "",
          message: "",
        });
        loadData();
      } else {
        const error = await res.json();
        alert(`${t("admin.notifications.send.error")}: ${error.error}`);
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      alert(t("admin.notifications.send.error"));
    } finally {
      setSending(false);
    }
  };

  const processQueue = async () => {
    try {
      const res = await fetch("/api/admin/notifications/process-queue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ limit: 50 }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(
          t("admin.notifications.processed")
            .replace("{{processed}}", data.processed)
            .replace("{{successful}}", data.successful)
            .replace("{{failed}}", data.failed)
        );
        loadData();
      }
    } catch (error) {
      console.error("Error processing queue:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SENT":
      case "DELIVERED":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "FAILED":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "PENDING":
      case "SCHEDULED":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "EMAIL":
        return <Mail className="w-4 h-4" />;
      case "PUSH":
        return <Bell className="w-4 h-4" />;
      case "SMS":
      case "WHATSAPP":
        return <Smartphone className="w-4 h-4" />;
      case "SLACK":
      case "TEAMS":
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleString(locale === "es" ? "es-MX" : "en-US", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusLabel = (status: string) => {
    return t(`admin.notifications.status.${status.toLowerCase()}`) || status;
  };

  const getChannelLabel = (channel: string) => {
    const key = channel.toLowerCase().replace("_", "");
    return t(`admin.notifications.channel.${key}`) || channel;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Bell className="w-7 h-7 text-indigo-600" />
            {t("admin.notifications.title")}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t("admin.notifications.description")}
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {t("admin.notifications.refresh")}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: "overview", labelKey: "admin.notifications.tabs.overview", icon: BarChart3 },
          { id: "queue", labelKey: "admin.notifications.tabs.queue", icon: Clock },
          { id: "send", labelKey: "admin.notifications.tabs.send", icon: Send },
          { id: "templates", labelKey: "admin.notifications.tabs.templates", icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
              activeTab === tab.id
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title={t("admin.notifications.stats.total")}
              value={stats?.total || 0}
              icon={Bell}
              color="bg-indigo-100 text-indigo-600"
            />
            <StatCard
              title={t("admin.notifications.stats.pending")}
              value={stats?.pending || 0}
              icon={Clock}
              color="bg-yellow-100 text-yellow-600"
            />
            <StatCard
              title={t("admin.notifications.stats.sent")}
              value={stats?.sent || 0}
              icon={CheckCircle}
              color="bg-green-100 text-green-600"
            />
            <StatCard
              title={t("admin.notifications.stats.failed")}
              value={stats?.failed || 0}
              icon={XCircle}
              color="bg-red-100 text-red-600"
            />
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* By Channel */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                {t("admin.notifications.byChannel")}
              </h3>
              <div className="space-y-3">
                {Object.entries(stats?.byChannel || {}).map(([channel, count]) => (
                  <div key={channel} className="flex items-center gap-3">
                    {getChannelIcon(channel)}
                    <span className="flex-1 text-sm">{getChannelLabel(channel)}</span>
                    <span className="font-medium">{count}</span>
                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, (count / (stats?.total || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* By Type */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                {t("admin.notifications.byType")}
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {Object.entries(stats?.byType || {})
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 10)
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center gap-3">
                      <span className="flex-1 text-sm truncate">{type.replace(/_/g, " ")}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4">{t("admin.notifications.recentActivity")}</h3>
            <div className="space-y-3">
              {notifications.slice(0, 5).map((notif) => (
                <div
                  key={notif.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  {getStatusIcon(notif.status)}
                  {getChannelIcon(notif.channel)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{notif.title || notif.message}</p>
                    <p className="text-xs text-gray-500">{notif.type.replace(/_/g, " ")}</p>
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(notif.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Queue Tab */}
      {activeTab === "queue" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            >
              <option value="">{t("admin.notifications.queue.allStatuses")}</option>
              <option value="PENDING">{t("admin.notifications.status.pending")}</option>
              <option value="SENT">{t("admin.notifications.status.sent")}</option>
              <option value="DELIVERED">{t("admin.notifications.status.delivered")}</option>
              <option value="FAILED">{t("admin.notifications.status.failed")}</option>
            </select>
            <select
              value={filters.channel}
              onChange={(e) => setFilters({ ...filters, channel: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            >
              <option value="">{t("admin.notifications.queue.allChannels")}</option>
              <option value="EMAIL">{t("admin.notifications.channel.email")}</option>
              <option value="PUSH">{t("admin.notifications.channel.push")}</option>
              <option value="SMS">{t("admin.notifications.channel.sms")}</option>
              <option value="WHATSAPP">{t("admin.notifications.channel.whatsapp")}</option>
              <option value="IN_APP">{t("admin.notifications.channel.inApp")}</option>
            </select>
            <div className="flex-1" />
            <button
              onClick={processQueue}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <RefreshCw className="w-4 h-4" />
              {t("admin.notifications.queue.processQueue")}
            </button>
          </div>

          {/* Queue Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t("admin.notifications.queue.status")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t("admin.notifications.queue.channel")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t("admin.notifications.queue.type")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t("admin.notifications.queue.message")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t("admin.notifications.queue.user")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t("admin.notifications.queue.date")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t("admin.notifications.queue.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {notifications.map((notif) => (
                  <tr key={notif.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(notif.status)}
                        <span className="text-xs">{getStatusLabel(notif.status)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getChannelIcon(notif.channel)}
                        <span className="text-xs">{getChannelLabel(notif.channel)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {notif.type.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-sm truncate" title={notif.message}>
                        {notif.title || notif.message}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">{notif.userName || notif.userId.slice(0, 8)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">{formatDate(notif.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                          <Eye className="w-4 h-4 text-gray-400" />
                        </button>
                        {notif.status === "FAILED" && (
                          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title={t("admin.notifications.queue.retry")}>
                            <RefreshCw className="w-4 h-4 text-gray-400" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {notifications.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      {t("admin.notifications.queue.empty")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Send Tab */}
      {activeTab === "send" && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Send className="w-5 h-5 text-indigo-600" />
              {t("admin.notifications.send.title")}
            </h3>

            <div className="space-y-6">
              {/* Scope */}
              <div>
                <label className="block text-sm font-medium mb-2">{t("admin.notifications.send.scope")}</label>
                <div className="flex gap-3">
                  {[
                    { id: "HUB", labelKey: "admin.notifications.send.scope.hub", icon: Users },
                    { id: "TENANT", labelKey: "admin.notifications.send.scope.tenant", icon: Users },
                    { id: "USER", labelKey: "admin.notifications.send.scope.user", icon: Users },
                  ].map((scope) => (
                    <button
                      key={scope.id}
                      onClick={() => setSendForm({ ...sendForm, scope: scope.id as typeof sendForm.scope })}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition ${
                        sendForm.scope === scope.id
                          ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <scope.icon className="w-4 h-4" />
                      {t(scope.labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              {/* User ID (if USER scope) */}
              {sendForm.scope === "USER" && (
                <div>
                  <label className="block text-sm font-medium mb-2">{t("admin.notifications.send.userId")}</label>
                  <input
                    type="text"
                    value={sendForm.userId}
                    onChange={(e) => setSendForm({ ...sendForm, userId: e.target.value })}
                    placeholder="ID"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                  />
                </div>
              )}

              {/* Type */}
              <div>
                <label className="block text-sm font-medium mb-2">{t("admin.notifications.send.type")}</label>
                <select
                  value={sendForm.type}
                  onChange={(e) => setSendForm({ ...sendForm, type: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                >
                  <option value="HUB_ANNOUNCEMENT">{t("admin.notifications.send.type.announcement")}</option>
                  <option value="TEAM_UPDATE">{t("admin.notifications.send.type.teamUpdate")}</option>
                  <option value="WEEKFLOW_REMINDER">{t("admin.notifications.send.type.weekflowReminder")}</option>
                  <option value="MICROLEARNING_AVAILABLE">{t("admin.notifications.send.type.microlearning")}</option>
                  <option value="SYSTEM_UPDATE">{t("admin.notifications.send.type.systemUpdate")}</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2">{t("admin.notifications.send.titleLabel")}</label>
                <input
                  type="text"
                  value={sendForm.title}
                  onChange={(e) => setSendForm({ ...sendForm, title: e.target.value })}
                  placeholder={t("admin.notifications.send.titlePlaceholder")}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium mb-2">{t("admin.notifications.send.message")}</label>
                <textarea
                  value={sendForm.message}
                  onChange={(e) => setSendForm({ ...sendForm, message: e.target.value })}
                  placeholder={t("admin.notifications.send.messagePlaceholder")}
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                />
              </div>

              {/* Channels */}
              <div>
                <label className="block text-sm font-medium mb-2">{t("admin.notifications.send.channels")}</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "IN_APP", labelKey: "admin.notifications.channel.inApp", icon: Bell },
                    { id: "PUSH", labelKey: "admin.notifications.channel.push", icon: Bell },
                    { id: "EMAIL", labelKey: "admin.notifications.channel.email", icon: Mail },
                    { id: "SMS", labelKey: "admin.notifications.channel.sms", icon: Smartphone },
                    { id: "WHATSAPP", labelKey: "admin.notifications.channel.whatsapp", icon: MessageSquare },
                  ].map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => {
                        const channels = sendForm.channels.includes(channel.id)
                          ? sendForm.channels.filter((c) => c !== channel.id)
                          : [...sendForm.channels, channel.id];
                        setSendForm({ ...sendForm, channels });
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition ${
                        sendForm.channels.includes(channel.id)
                          ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <channel.icon className="w-4 h-4" />
                      {t(channel.labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium mb-2">{t("admin.notifications.send.priority")}</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={sendForm.priority}
                  onChange={(e) => setSendForm({ ...sendForm, priority: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{t("admin.notifications.send.priority.critical")}</span>
                  <span>{t("admin.notifications.send.priority.normal")}</span>
                  <span>{t("admin.notifications.send.priority.low")}</span>
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleSendNotification}
                disabled={sending || !sendForm.message}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    {t("admin.notifications.send.sending")}
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {t("admin.notifications.send.submit")}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === "templates" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4">{t("admin.notifications.templates.title")}</h3>
          <p className="text-gray-500 mb-6">
            {t("admin.notifications.templates.description")}
          </p>

          <div className="grid gap-4">
            {[
              { type: "ACHIEVEMENT_UNLOCKED", titleKey: "admin.notifications.templates.achievement", preview: "Has desbloqueado: {{achievement}}. +{{xp}} XP" },
              { type: "LEVEL_UP", titleKey: "admin.notifications.templates.levelUp", preview: "Felicidades! Ahora eres nivel {{level}}" },
              { type: "TASK_ASSIGNED", titleKey: "admin.notifications.templates.taskAssigned", preview: "Te han asignado la tarea: {{task}}" },
              { type: "HUB_INVITATION", titleKey: "admin.notifications.templates.hubInvitation", preview: "Te han invitado a unirte al hub: {{hub}}" },
              { type: "WEEKFLOW_REMINDER", titleKey: "admin.notifications.templates.weekflowReminder", preview: "Es hora de tu sesion semanal de WeekFlow" },
              { type: "MICROLEARNING_AVAILABLE", titleKey: "admin.notifications.templates.microlearning", preview: "Tienes una nueva leccion disponible: {{lesson}}" },
            ].map((template) => (
              <div
                key={template.type}
                className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
              >
                <Bell className="w-5 h-5 text-indigo-600" />
                <div className="flex-1">
                  <p className="font-medium">{t(template.titleKey)}</p>
                  <p className="text-sm text-gray-500">{template.preview}</p>
                </div>
                <span className="text-xs text-gray-400 font-mono">{template.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value.toLocaleString()}</p>
          <p className="text-sm text-gray-500">{title}</p>
        </div>
      </div>
    </div>
  );
}
