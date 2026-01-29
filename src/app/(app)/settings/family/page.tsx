"use client";

import React, { useState, useEffect } from "react";

type FamilyMember = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "member";
  status: "active" | "invited" | "pending";
  joinedAt?: string;
  avatarUrl?: string;
};

type FamilyPlanInfo = {
  planName: string;
  maxMembers: number;
  currentMembers: number;
  tokensMonthly: number;
  tokensUsed: number;
  tokensRemaining: number;
  isOwner: boolean;
  canInvite: boolean;
};

export default function FamilySettingsPage() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [planInfo, setPlanInfo] = useState<FamilyPlanInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Formulario de invitación
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState("");

  async function loadFamilyData() {
    setLoading(true);
    try {
      const res = await fetch("/api/family", { cache: "no-store" });
      const data = await res.json();

      if (data.ok) {
        setMembers(data.members || []);
        setPlanInfo(data.planInfo || null);
      } else {
        setError(data.error || "Error cargando datos");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFamilyData();
  }, []);

  async function inviteMember() {
    if (!email.trim()) {
      setInviteMsg("Ingresa un email");
      return;
    }

    setInviting(true);
    setInviteMsg("");

    try {
      const res = await fetch("/api/family/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (data.ok) {
        setInviteMsg("Invitación enviada ✅");
        setEmail("");
        setName("");
        loadFamilyData(); // Recargar lista
      } else {
        setInviteMsg(data.error || "Error enviando invitación");
      }
    } catch {
      setInviteMsg("Error de red");
    } finally {
      setInviting(false);
    }
  }

  async function removeMember(memberId: string) {
    if (!confirm("¿Estás seguro de remover a este miembro?")) return;

    try {
      const res = await fetch("/api/family/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });

      const data = await res.json();
      if (data.ok) {
        loadFamilyData();
      }
    } catch {
      alert("Error removiendo miembro");
    }
  }

  if (loading) {
    return (
      <main className="space-y-4">
        <div className="rowi-card">
          <div className="text-center py-8 text-gray-500">Cargando...</div>
        </div>
      </main>
    );
  }

  // Si no tiene plan familiar
  if (!planInfo || planInfo.planName !== "ROWI Family") {
    return (
      <main className="space-y-4">
        <header className="rowi-card">
          <h1 className="text-2xl font-semibold">Plan Familiar</h1>
          <p className="rowi-muted text-sm">Gestiona los miembros de tu plan familiar.</p>
        </header>

        <section className="rowi-card text-center py-8">
          <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
          <h2 className="text-xl font-medium mb-2">No tienes un Plan Familiar</h2>
          <p className="text-gray-500 mb-4">
            El Plan ROWI Family te permite compartir la experiencia con hasta 6 miembros de tu familia.
          </p>
          <a
            href="/pricing"
            className="rowi-btn-primary inline-block"
          >
            Ver Plan Familiar - $40/mes
          </a>
        </section>
      </main>
    );
  }

  const spotsLeft = planInfo.maxMembers - planInfo.currentMembers;

  return (
    <main className="space-y-4">
      <header className="rowi-card">
        <h1 className="text-2xl font-semibold">Plan Familiar</h1>
        <p className="rowi-muted text-sm">Gestiona los miembros de tu plan familiar.</p>
      </header>

      {/* Resumen del plan */}
      <section className="rowi-card">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-600">
              {planInfo.currentMembers}/{planInfo.maxMembers}
            </div>
            <div className="text-sm text-gray-500">Miembros</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-600">{spotsLeft}</div>
            <div className="text-sm text-gray-500">Espacios disponibles</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600">
              {planInfo.tokensRemaining}
            </div>
            <div className="text-sm text-gray-500">Tokens restantes</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-orange-600">
              {planInfo.tokensUsed}
            </div>
            <div className="text-sm text-gray-500">Tokens usados</div>
          </div>
        </div>
      </section>

      {/* Formulario de invitación */}
      {planInfo.canInvite && spotsLeft > 0 && (
        <section className="rowi-card space-y-3">
          <h2 className="font-medium">Invitar familiar</h2>
          <div className="grid gap-2 sm:grid-cols-3">
            <input
              type="email"
              className="rounded-md border px-3 py-2 bg-transparent"
              placeholder="Email del familiar"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="text"
              className="rounded-md border px-3 py-2 bg-transparent"
              placeholder="Nombre (opcional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button
              className="rowi-btn-primary"
              onClick={inviteMember}
              disabled={inviting}
            >
              {inviting ? "Enviando..." : "Enviar invitación"}
            </button>
          </div>
          {inviteMsg && (
            <p className={`text-sm ${inviteMsg.includes("✅") ? "text-green-600" : "text-red-500"}`}>
              {inviteMsg}
            </p>
          )}
        </section>
      )}

      {spotsLeft === 0 && (
        <section className="rowi-card bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200">
          <p className="text-yellow-700 dark:text-yellow-300">
            ⚠️ Has alcanzado el límite de {planInfo.maxMembers} miembros familiares.
          </p>
        </section>
      )}

      {/* Lista de miembros */}
      <section className="rowi-card">
        <h2 className="font-medium mb-4">Miembros de la familia</h2>
        {members.length === 0 ? (
          <p className="text-gray-500">Aún no hay miembros. ¡Invita a tu familia!</p>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                    {member.name?.[0]?.toUpperCase() || member.email[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{member.name || member.email}</div>
                    <div className="text-sm text-gray-500">{member.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      member.status === "active"
                        ? "bg-green-100 text-green-800"
                        : member.status === "invited"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {member.status === "active"
                      ? "Activo"
                      : member.status === "invited"
                      ? "Invitado"
                      : "Pendiente"}
                  </span>
                  <span className="text-xs text-gray-400 capitalize">{member.role}</span>
                  {planInfo.isOwner && member.role !== "owner" && (
                    <button
                      className="text-red-500 text-sm hover:underline"
                      onClick={() => removeMember(member.id)}
                    >
                      Remover
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {error && (
        <div className="rowi-card bg-red-50 border-red-200 text-red-700">
          {error}
        </div>
      )}
    </main>
  );
}
