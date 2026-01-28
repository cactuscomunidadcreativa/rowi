"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getBaseUrl } from "@/core/utils/base-url";

export const dynamic = "force-dynamic";

type Invite = {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  channel?: "email" | "whatsapp" | "sms" | "slack" | "teams";
  status: "pending" | "accepted" | "expired";
  sentAt: string;
  url?: string;
};

export default function InvitesSettingsPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<Invite["channel"]>("email");
  const [message, setMessage] = useState("¡Te invito a mi comunidad en Rowi!");
  const [list, setList] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  async function loadList() {
    setLoading(true);
    try {
      const res = await fetch("/api/invites", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      const arr: Invite[] = Array.isArray(data?.invites) ? data.invites : [];
      setList(arr);
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
    if (!email.trim() && !phone.trim()) {
      setMsg("Ingrese email o teléfono");
      setTimeout(() => setMsg(""), 2000);
      return;
    }
    setMsg("Enviando…");
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          name: name.trim() || undefined,
          channel,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setMsg("No se pudo crear la invitación");
        return;
      }

      const inv: Invite = data.invite || {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, // key único por si el backend no envía id
        email: email || undefined,
        phone: phone || undefined,
        name: name || undefined,
        channel,
        status: "pending",
        sentAt: new Date().toISOString().slice(0, 10),
        url: data?.invite?.url,
      };

      setList((prev) => [inv, ...prev]);
      setMsg("Invitación creada ✅");
      setTimeout(() => setMsg(""), 1500);

      openChannel(inv, message);
      setEmail("");
      setPhone("");
      setName("");
    } catch {
      setMsg("Error de red");
    }
  }

  function openChannel(inv: Invite, msg: string) {
    const link = inv.url || buildInviteUrl(inv);
    if (inv.channel === "whatsapp" && inv.phone) {
      const wa = `https://wa.me/${normalizePhone(inv.phone)}?text=${encodeURIComponent(
        `${msg}\n${link}`
      )}`;
      window.open(wa, "_blank");
    } else if (inv.channel === "sms" && inv.phone) {
      const sms = `sms:${normalizePhone(inv.phone)}?&body=${encodeURIComponent(
        `${msg}\n${link}`
      )}`;
      window.location.href = sms;
    } else if (inv.channel === "email" && inv.email) {
      const mail = `mailto:${encodeURIComponent(inv.email)}?subject=${encodeURIComponent(
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
      </header>

      <section className="rowi-card space-y-3">
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
          <input
            className="rounded-md border px-3 py-2 bg-transparent"
            placeholder="Email (opcional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="rounded-md border px-3 py-2 bg-transparent"
            placeholder="Teléfono (opcional, ej. +51999999999)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
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
          placeholder="Mensaje…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <button className="rowi-btn-primary" onClick={createInvite}>
            Enviar invitación
          </button>
          {msg && <span className="text-xs rowi-muted">{msg}</span>}
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
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Teléfono</th>
                  <th className="py-2 pr-3">Nombre</th>
                  <th className="py-2 pr-3">Canal</th>
                  <th className="py-2 pr-3">Estado</th>
                  <th className="py-2 pr-3">Enviado</th>
                  <th className="py-2 pr-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {list.map((inv, index) => {
                  const key =
                    inv.id ||
                    `${inv.email || inv.phone || "invite"}-${inv.sentAt || index}-${index}`;
                return (
                  <tr
                    key={key}
                    className="border-t"
                    style={{ borderColor: "var(--rowi-card-border)" }}
                  >
                    <td className="py-2 pr-3">{inv.email || "—"}</td>
                    <td className="py-2 pr-3">{inv.phone || "—"}</td>
                    <td className="py-2 pr-3">{inv.name || "—"}</td>
                    <td className="py-2 pr-3">{inv.channel || "—"}</td>
                    <td className="py-2 pr-3">
                      <span className="rowi-chip">{inv.status}</span>
                    </td>
                    <td className="py-2 pr-3">{inv.sentAt}</td>
                    <td className="py-2 pr-3">
                      <button className="rowi-btn" onClick={() => openChannel(inv, message)}>
                        Abrir canal
                      </button>
                    </td>
                  </tr>
                )})}
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
  if ((inv as any)?.token) return `${origin}/invite/${(inv as any).token}`;
  return `${origin}/invite`;
}