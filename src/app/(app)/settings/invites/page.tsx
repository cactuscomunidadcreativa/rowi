"use client";

import React, { useState, useEffect } from "react";
import { getBaseUrl } from "@/core/utils/base-url";

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

export default function InvitesSettingsPage() {
  const [contact, setContact] = useState("");
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<Invite["channel"]>("email");
  const [message, setMessage] = useState("¡Te invito a mi comunidad en Rowi!");
  const [list, setList] = useState<Invite[]>([]);
  const [stats, setStats] = useState<InviteStats | null>(null);
  const [remainingInvites, setRemainingInvites] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  async function loadList() {
    setLoading(true);
    try {
      // Usar el nuevo endpoint basado en Prisma
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
      setMsg("Ingrese email o teléfono");
      setTimeout(() => setMsg(""), 2000);
      return;
    }
    setMsg("Enviando…");
    try {
      // Usar el nuevo endpoint basado en Prisma
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
        setMsg(data?.error || "No se pudo crear la invitación");
        setTimeout(() => setMsg(""), 3000);
        return;
      }

      // Actualizar remaining invites
      if (typeof data.remainingInvites === "number") {
        setRemainingInvites(data.remainingInvites);
      }

      // Agregar a la lista
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
      setMsg("Invitación creada ✅");
      setTimeout(() => setMsg(""), 1500);

      // Abrir el canal correspondiente
      if (data.links) {
        if (channel === "whatsapp" && data.links.whatsapp) {
          window.open(data.links.whatsapp, "_blank");
        } else if (channel === "sms" && data.links.sms) {
          window.location.href = data.links.sms;
        } else if (channel === "email" && data.links.email) {
          window.location.href = data.links.email;
        } else if (channel === "slack" || channel === "teams") {
          navigator.clipboard.writeText(`${message}\n${data.inviteUrl}`).catch(() => {});
          alert("Link de invitación copiado. Pégalo en Slack/Teams.");
        }
      }

      setContact("");
      setName("");
    } catch {
      setMsg("Error de red");
      setTimeout(() => setMsg(""), 2000);
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
        setMsg("Invitación cancelada");
        setTimeout(() => setMsg(""), 1500);
      }
    } catch {
      setMsg("Error al cancelar");
      setTimeout(() => setMsg(""), 2000);
    }
  }

  function openChannel(inv: Invite, msg: string) {
    const link = inv.url || buildInviteUrl(inv);
    const contactValue = inv.contact || inv.email || inv.phone || "";

    if (inv.channel === "whatsapp" && contactValue) {
      const wa = `https://wa.me/${normalizePhone(contactValue)}?text=${encodeURIComponent(
        `${msg}\n${link}`
      )}`;
      window.open(wa, "_blank");
    } else if (inv.channel === "sms" && contactValue) {
      const sms = `sms:${normalizePhone(contactValue)}?&body=${encodeURIComponent(
        `${msg}\n${link}`
      )}`;
      window.location.href = sms;
    } else if (inv.channel === "email" && contactValue) {
      const mail = `mailto:${encodeURIComponent(contactValue)}?subject=${encodeURIComponent(
        "Invitación Rowi"
      )}&body=${encodeURIComponent(`${msg}\n${link}`)}`;
      window.location.href = mail;
    } else if (inv.channel === "slack" || inv.channel === "teams") {
      navigator.clipboard.writeText(`${msg}\n${link}`).catch(() => {});
      alert("Link de invitación copiado. Pégalo en Slack/Teams.");
    }
  }

  return (
    <main className="space-y-4">
      <header className="rowi-card">
        <h1 className="text-2xl font-semibold">Invitaciones</h1>
        <p className="rowi-muted text-sm">Administra tus invitaciones a la comunidad.</p>
        {stats && (
          <div className="flex gap-4 mt-2 text-sm">
            <span className="text-gray-500">Total: {stats.total}</span>
            <span className="text-yellow-600">Pendientes: {stats.pending}</span>
            <span className="text-green-600">Aceptadas: {stats.accepted}</span>
            <span className="text-red-500">Expiradas: {stats.expired}</span>
          </div>
        )}
      </header>

      <section className="rowi-card space-y-3">
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          <input
            className="rounded-md border px-3 py-2 bg-transparent"
            placeholder="Email o teléfono (+51999999999)"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
          <input
            className="rounded-md border px-3 py-2 bg-transparent"
            placeholder="Nombre (opcional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <select
            className="rounded-md border px-3 py-2 bg-transparent"
            value={channel}
            onChange={(e) => setChannel(e.target.value as Invite["channel"])}
          >
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="sms">SMS</option>
            <option value="slack">Slack</option>
            <option value="teams">Teams</option>
          </select>
        </div>
        <textarea
          className="w-full rounded-md border px-3 py-2 bg-transparent"
          rows={2}
          placeholder="Mensaje personalizado…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <button className="rowi-btn-primary" onClick={createInvite}>
            Enviar invitación
          </button>
          {msg && <span className="text-xs rowi-muted">{msg}</span>}
          {remainingInvites !== null && (
            <span className="text-xs text-gray-400">
              ({remainingInvites} invitaciones restantes)
            </span>
          )}
        </div>
      </section>

      <section className="rowi-card">
        <h2 className="font-medium mb-2">Invitaciones enviadas</h2>
        {loading ? (
          <div className="text-sm rowi-muted">Cargando…</div>
        ) : list.length === 0 ? (
          <div className="text-sm rowi-muted-weak">Aún no has enviado invitaciones.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left rowi-muted-weak">
                  <th className="py-2 pr-3">Contacto</th>
                  <th className="py-2 pr-3">Canal</th>
                  <th className="py-2 pr-3">Estado</th>
                  <th className="py-2 pr-3">Creada</th>
                  <th className="py-2 pr-3">Expira</th>
                  <th className="py-2 pr-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {list.map((inv) => {
                  const contactDisplay = inv.contact || inv.email || inv.phone || "—";
                  const createdDate = inv.createdAt
                    ? new Date(inv.createdAt).toLocaleDateString()
                    : inv.sentAt || "—";
                  const expiresDate = inv.expiresAt
                    ? new Date(inv.expiresAt).toLocaleDateString()
                    : "—";

                  const statusColor =
                    inv.status === "accepted"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : inv.status === "expired"
                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";

                  return (
                    <tr
                      key={inv.id}
                      className="border-t"
                      style={{ borderColor: "var(--rowi-card-border)" }}
                    >
                      <td className="py-2 pr-3">{contactDisplay}</td>
                      <td className="py-2 pr-3 capitalize">{inv.channel || "—"}</td>
                      <td className="py-2 pr-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${statusColor}`}>
                          {inv.status === "pending" ? "Pendiente" : inv.status === "accepted" ? "Aceptada" : "Expirada"}
                        </span>
                      </td>
                      <td className="py-2 pr-3">{createdDate}</td>
                      <td className="py-2 pr-3">{expiresDate}</td>
                      <td className="py-2 pr-3 flex gap-2">
                        {inv.status === "pending" && (
                          <>
                            <button
                              className="rowi-btn text-xs"
                              onClick={() => openChannel(inv, message)}
                            >
                              Reenviar
                            </button>
                            <button
                              className="rowi-btn text-xs text-red-500"
                              onClick={() => deleteInvite(inv.id)}
                            >
                              Cancelar
                            </button>
                          </>
                        )}
                        {inv.status === "accepted" && (
                          <span className="text-green-500 text-xs">✓ Aceptada</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

/* ========== Helpers (fuera del JSX) ========== */
function normalizePhone(p: string) {
  return p.replace(/[^\d+]/g, "");
}
function buildInviteUrl(inv: Invite) {
  const origin =
    typeof window !== "undefined" ? window.location.origin : getBaseUrl();
  if (inv.token) return `${origin}/invite/${inv.token}`;
  return `${origin}/invite`;
}