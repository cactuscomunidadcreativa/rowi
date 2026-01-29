"use client";

import React, { useState, useEffect } from "react";
import { getBaseUrl } from "@/core/utils/base-url";
import { useI18n } from "@/lib/i18n/I18nProvider";
import {
  Mail, MessageCircle, Send, Users, UserPlus, Copy, Check,
  Trash2, RefreshCw, Clock, CheckCircle2, XCircle, Smartphone,
  Hash, Building2, Link2
} from "lucide-react";

export const dynamic = "force-dynamic";

type Invite = {
  id: string;
  token?: string;
  contact?: string;
  email?: string;
  phone?: string;
  name?: string;
  channel?: "email" | "whatsapp" | "sms" | "slack" | "teams";
  status: "pending" | "accepted" | "expired";
  sentAt?: string;
  createdAt?: string;
  expiresAt?: string;
  url?: string;
};

type InviteStats = {
  total: number;
  pending: number;
  accepted: number;
  expired: number;
};

const CHANNEL_OPTIONS = [
  { value: "email", label: "Email", icon: Mail, color: "#3B82F6" },
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "#25D366" },
  { value: "sms", label: "SMS", icon: Smartphone, color: "#8B5CF6" },
  { value: "slack", label: "Slack", icon: Hash, color: "#E01E5A" },
  { value: "teams", label: "Teams", icon: Building2, color: "#6264A7" },
];

export default function InvitesSettingsPage() {
  const { lang } = useI18n();
  const [contact, setContact] = useState("");
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<Invite["channel"]>("email");
  const [message, setMessage] = useState(
    lang === "es" ? "¡Te invito a mi comunidad en Rowi!" : "I invite you to my community on Rowi!"
  );
  const [list, setList] = useState<Invite[]>([]);
  const [stats, setStats] = useState<InviteStats | null>(null);
  const [remainingInvites, setRemainingInvites] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const t = {
    es: {
      title: "Invitaciones",
      subtitle: "Invita a personas a unirse a tu comunidad en Rowi",
      newInvite: "Nueva invitación",
      contactPlaceholder: "Email o teléfono (+51999999999)",
      namePlaceholder: "Nombre (opcional)",
      messagePlaceholder: "Mensaje personalizado...",
      sendInvite: "Enviar invitación",
      sending: "Enviando...",
      invitesSent: "Invitaciones enviadas",
      noInvites: "Aún no has enviado invitaciones",
      noInvitesDesc: "Invita a tus colegas, amigos o familiares a desarrollar su inteligencia emocional",
      contact: "Contacto",
      channel: "Canal",
      status: "Estado",
      created: "Creada",
      expires: "Expira",
      actions: "Acciones",
      resend: "Reenviar",
      cancel: "Cancelar",
      copyLink: "Copiar link",
      copied: "Copiado",
      pending: "Pendiente",
      accepted: "Aceptada",
      expired: "Expirada",
      total: "Total",
      remaining: "restantes",
      enterContact: "Ingresa un email o teléfono",
      inviteCreated: "Invitación creada",
      inviteCanceled: "Invitación cancelada",
      errorCreate: "No se pudo crear la invitación",
      errorCancel: "Error al cancelar",
      networkError: "Error de red",
    },
    en: {
      title: "Invitations",
      subtitle: "Invite people to join your community on Rowi",
      newInvite: "New invitation",
      contactPlaceholder: "Email or phone (+1999999999)",
      namePlaceholder: "Name (optional)",
      messagePlaceholder: "Custom message...",
      sendInvite: "Send invitation",
      sending: "Sending...",
      invitesSent: "Invitations sent",
      noInvites: "You haven't sent any invitations yet",
      noInvitesDesc: "Invite your colleagues, friends or family to develop their emotional intelligence",
      contact: "Contact",
      channel: "Channel",
      status: "Status",
      created: "Created",
      expires: "Expires",
      actions: "Actions",
      resend: "Resend",
      cancel: "Cancel",
      copyLink: "Copy link",
      copied: "Copied",
      pending: "Pending",
      accepted: "Accepted",
      expired: "Expired",
      total: "Total",
      remaining: "remaining",
      enterContact: "Enter an email or phone number",
      inviteCreated: "Invitation created",
      inviteCanceled: "Invitation canceled",
      errorCreate: "Could not create invitation",
      errorCancel: "Error canceling",
      networkError: "Network error",
    },
  };

  const text = t[lang as keyof typeof t] || t.es;

  async function loadList() {
    setLoading(true);
    try {
      const res = await fetch("/api/community/invite", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setList(data.invites || []);
        setStats(data.stats || null);
      } else {
        setList([]);
      }
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadList();
  }, []);

  async function createInvite() {
    if (!contact.trim()) {
      setMsg(text.enterContact);
      setTimeout(() => setMsg(""), 2000);
      return;
    }
    setSending(true);
    setMsg("");
    try {
      const res = await fetch("/api/community/invite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contact: contact.trim(),
          name: name.trim() || undefined,
          channel,
          message: message.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        setMsg(data?.error || text.errorCreate);
        setTimeout(() => setMsg(""), 3000);
        return;
      }

      if (typeof data.remainingInvites === "number") {
        setRemainingInvites(data.remainingInvites);
      }

      const inv: Invite = {
        id: data.invite.id,
        token: data.invite.token,
        contact: data.invite.contact,
        channel: data.invite.channel,
        status: "pending",
        createdAt: data.invite.createdAt,
        expiresAt: data.invite.expiresAt,
        url: data.inviteUrl,
      };

      setList((prev) => [inv, ...prev]);
      setMsg(text.inviteCreated + " ✅");
      setTimeout(() => setMsg(""), 1500);

      // Open channel
      if (data.links) {
        if (channel === "whatsapp" && data.links.whatsapp) {
          window.open(data.links.whatsapp, "_blank");
        } else if (channel === "sms" && data.links.sms) {
          window.location.href = data.links.sms;
        } else if (channel === "email" && data.links.email) {
          window.location.href = data.links.email;
        } else if (channel === "slack" || channel === "teams") {
          navigator.clipboard.writeText(`${message}\n${data.inviteUrl}`).catch(() => {});
        }
      }

      setContact("");
      setName("");
    } catch {
      setMsg(text.networkError);
      setTimeout(() => setMsg(""), 2000);
    } finally {
      setSending(false);
    }
  }

  async function deleteInvite(inviteId: string) {
    try {
      const res = await fetch("/api/community/invite", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ inviteId }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setList((prev) => prev.filter((inv) => inv.id !== inviteId));
        setMsg(text.inviteCanceled);
        setTimeout(() => setMsg(""), 1500);
      }
    } catch {
      setMsg(text.errorCancel);
      setTimeout(() => setMsg(""), 2000);
    }
  }

  function copyInviteLink(inv: Invite) {
    const link = inv.url || buildInviteUrl(inv);
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(inv.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  function openChannel(inv: Invite, msg: string) {
    const link = inv.url || buildInviteUrl(inv);
    const contactValue = inv.contact || inv.email || inv.phone || "";

    if (inv.channel === "whatsapp" && contactValue) {
      const wa = `https://wa.me/${normalizePhone(contactValue)}?text=${encodeURIComponent(`${msg}\n${link}`)}`;
      window.open(wa, "_blank");
    } else if (inv.channel === "sms" && contactValue) {
      const sms = `sms:${normalizePhone(contactValue)}?&body=${encodeURIComponent(`${msg}\n${link}`)}`;
      window.location.href = sms;
    } else if (inv.channel === "email" && contactValue) {
      const mail = `mailto:${encodeURIComponent(contactValue)}?subject=${encodeURIComponent("Invitación Rowi")}&body=${encodeURIComponent(`${msg}\n${link}`)}`;
      window.location.href = mail;
    } else if (inv.channel === "slack" || inv.channel === "teams") {
      navigator.clipboard.writeText(`${msg}\n${link}`).catch(() => {});
    }
  }

  const selectedChannel = CHANNEL_OPTIONS.find((c) => c.value === channel);

  return (
    <main className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            {text.title}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{text.subtitle}</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="flex gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">{stats.total}</span>
              <span className="text-xs text-gray-500">{text.total}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">{stats.pending}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">{stats.accepted}</span>
            </div>
          </div>
        )}
      </div>

      {/* New Invite Form */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Send className="w-4 h-4 text-[var(--rowi-g2)]" />
          {text.newInvite}
        </h2>

        <div className="space-y-4">
          {/* Contact & Name */}
          <div className="grid gap-4 md:grid-cols-2">
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 focus:border-[var(--rowi-g2)] focus:outline-none focus:ring-2 focus:ring-[var(--rowi-g2)]/20 transition-all"
              placeholder={text.contactPlaceholder}
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 focus:border-[var(--rowi-g2)] focus:outline-none focus:ring-2 focus:ring-[var(--rowi-g2)]/20 transition-all"
              placeholder={text.namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Channel Selector */}
          <div className="flex flex-wrap gap-2">
            {CHANNEL_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = channel === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setChannel(opt.value as Invite["channel"])}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                    isSelected
                      ? "border-2 shadow-sm"
                      : "border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600"
                  }`}
                  style={isSelected ? { borderColor: opt.color, backgroundColor: `${opt.color}10` } : {}}
                >
                  <Icon className="w-4 h-4" style={{ color: isSelected ? opt.color : undefined }} />
                  <span className={`text-sm font-medium ${isSelected ? "" : "text-gray-600 dark:text-gray-400"}`}>
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Message */}
          <textarea
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 focus:border-[var(--rowi-g2)] focus:outline-none focus:ring-2 focus:ring-[var(--rowi-g2)]/20 transition-all resize-none"
            rows={2}
            placeholder={text.messagePlaceholder}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          {/* Submit */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={createInvite}
                disabled={sending || !contact.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {sending ? text.sending : text.sendInvite}
              </button>
              {msg && (
                <span className="text-sm text-gray-500">{msg}</span>
              )}
            </div>
            {remainingInvites !== null && (
              <span className="text-sm text-gray-400">
                {remainingInvites} {text.remaining}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Invites List */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
          <h2 className="font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            {text.invitesSent}
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-gray-400" />
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-gray-400" />
            </div>
            <p className="font-medium text-gray-600 dark:text-gray-400">{text.noInvites}</p>
            <p className="text-sm text-gray-400 mt-1">{text.noInvitesDesc}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-zinc-800">
            {list.map((inv) => {
              const contactDisplay = inv.contact || inv.email || inv.phone || "—";
              const createdDate = inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : "—";
              const expiresDate = inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : "—";
              const channelOpt = CHANNEL_OPTIONS.find((c) => c.value === inv.channel);
              const ChannelIcon = channelOpt?.icon || Mail;

              return (
                <div key={inv.id} className="p-4 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    {/* Channel Icon */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${channelOpt?.color || "#666"}15` }}
                    >
                      <ChannelIcon className="w-5 h-5" style={{ color: channelOpt?.color || "#666" }} />
                    </div>

                    {/* Contact Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{inv.name || contactDisplay}</p>
                      {inv.name && <p className="text-sm text-gray-500 truncate">{contactDisplay}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {text.created}: {createdDate} • {text.expires}: {expiresDate}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {inv.status === "pending" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                          <Clock className="w-3 h-3" />
                          {text.pending}
                        </span>
                      )}
                      {inv.status === "accepted" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle2 className="w-3 h-3" />
                          {text.accepted}
                        </span>
                      )}
                      {inv.status === "expired" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          <XCircle className="w-3 h-3" />
                          {text.expired}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => copyInviteLink(inv)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                        title={text.copyLink}
                      >
                        {copiedId === inv.id ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Link2 className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      {inv.status === "pending" && (
                        <>
                          <button
                            onClick={() => openChannel(inv, message)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                            title={text.resend}
                          >
                            <RefreshCw className="w-4 h-4 text-gray-400" />
                          </button>
                          <button
                            onClick={() => deleteInvite(inv.id)}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title={text.cancel}
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

/* ========== Helpers ========== */
function normalizePhone(p: string) {
  return p.replace(/[^\d+]/g, "");
}

function buildInviteUrl(inv: Invite) {
  const origin = typeof window !== "undefined" ? window.location.origin : getBaseUrl();
  if (inv.token) return `${origin}/invite/${inv.token}`;
  return `${origin}/invite`;
}
