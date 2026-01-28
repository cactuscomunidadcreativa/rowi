"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AcceptInvitePage({
  params,
}: {
  params: { token: string };
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "loading"
  );
  const [msg, setMsg] = useState<string>("Verificando invitación...");
  const [invite, setInvite] = useState<any>(null);

  /* =========================================================
     🔍 Validar invitación
  ========================================================== */
  useEffect(() => {
    async function verifyInvite() {
      try {
        const res = await fetch(`/api/invites/${params.token}`);
        const data = await res.json();
        if (data.ok) {
          setInvite(data.invite);
          setStatus("idle");
        } else {
          setStatus("error");
          setMsg(data.error || "Invitación inválida o expirada.");
        }
      } catch {
        setStatus("error");
        setMsg("Error al verificar la invitación.");
      }
    }
    verifyInvite();
  }, [params.token]);

  /* =========================================================
     ✅ Aceptar invitación
  ========================================================== */
  async function acceptInvite() {
    setStatus("loading");
    setMsg("Activando cuenta...");
    try {
      const res = await fetch(`/api/invites/${params.token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: invite?.name }),
      });
      const data = await res.json();

      if (data.ok) {
        setStatus("ok");
        setMsg("🎉 Invitación aceptada. Ahora puedes crear tu cuenta o iniciar sesión.");
      } else {
        setStatus("error");
        setMsg(data.error || "Error al aceptar la invitación.");
      }
    } catch {
      setStatus("error");
      setMsg("Error de red al aceptar la invitación.");
    }
  }

  /* =========================================================
     🎨 Render
  ========================================================== */
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-800 px-6">
      <div className="max-w-md w-full rowi-card p-6 rounded-2xl shadow-lg border border-rowi-card-border bg-white dark:bg-zinc-900 space-y-5 text-center">
        <h1 className="text-2xl font-bold rowi-gradient-text">
          Invitación a Rowi
        </h1>

        {/* Mensaje de estado */}
        <p
          className={`text-sm ${
            status === "error" ? "text-red-500" : "text-gray-600 dark:text-gray-300"
          }`}
        >
          {msg}
        </p>

        {/* Datos de invitación */}
        {invite && status !== "error" && (
          <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <p>
              Has sido invitado a{" "}
              <strong>{invite.tenant || "una organización"}</strong> con el correo{" "}
              <strong>{invite.email}</strong>.
            </p>
            <p>
              Rol asignado:{" "}
              <span className="font-medium capitalize">{invite.role || "usuario"}</span>
            </p>
            <button
              onClick={acceptInvite}
              disabled={status === "loading"}
              className="rowi-btn w-full mt-4 py-2 font-semibold text-white"
              style={{ background: "#31a2e3" }}
            >
              {status === "loading" ? "Procesando..." : "Aceptar invitación"}
            </button>
          </div>
        )}

        {/* Acciones post-aceptación */}
        {status === "ok" && (
          <div className="space-y-3 text-sm mt-3">
            <p className="text-gray-500 dark:text-gray-300">
              Puedes continuar con alguno de estos pasos:
            </p>
            <div className="flex flex-col gap-2">
              <Link
                className="rowi-btn text-white font-medium py-2"
                style={{ background: "#31a2e3" }}
                href="/signup"
              >
                Crear cuenta
              </Link>
              <Link
                className="rowi-btn border border-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 py-2"
                href="/signin"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        )}

        <p className="text-[10px] opacity-50 mt-4">
          Token: {params.token}
        </p>
      </div>
    </main>
  );
}