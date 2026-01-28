"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/react";

/* =========================================================
   💫 Rowi User Toast Bar — bienvenida flotante temporal
   ---------------------------------------------------------
   ▪ Traducción automática
   ▪ Desaparece suavemente tras 6 segundos
   ▪ Modo oscuro / claro adaptativo
   ▪ Gradiente emocional Rowi 💙💖
========================================================= */
export default function RowiUserToastBar() {
  const { t } = useI18n();
  const [profile, setProfile] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const json = await res.json();
        if (json.ok && json.profile) {
          setProfile(json.profile);
          setVisible(true);
          // 🔁 Desaparece suavemente luego de 6 segundos
          setTimeout(() => setVisible(false), 6000);
        }
      } catch (e) {
        console.error("❌ Error cargando perfil:", e);
      }
    })();
  }, []);

  if (!profile || !visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between 
                 px-5 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm 
                 bg-gradient-to-r from-rowi-blueDay/90 to-rowi-pinkDay/90 
                 text-white shadow-lg border-b border-white/20
                 animate-in fade-in slide-in-from-top-5 duration-700"
      style={{ backdropFilter: "blur(8px)" }}
    >
      <div className="flex flex-col leading-tight">
        <span className="font-semibold">{profile.name}</span>
        <span className="opacity-90">{profile.email}</span>
      </div>

      <div className="flex flex-col text-right leading-tight">
        <span className="text-[11px] opacity-90">
          {profile.tenant || t("user.noTenant") || "Sin tenant"} ·{" "}
          <span className="font-semibold text-white">
            {profile.plan || t("user.noPlan") || "Sin plan"}
          </span>
        </span>
        <span className="text-[11px] opacity-80">
          {t("user.role") || "Rol"}: {profile.role} ({profile.scope})
        </span>
      </div>
    </div>
  );
}