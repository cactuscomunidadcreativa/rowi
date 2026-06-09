"use client";

import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/react";

/**
 * 🔔 Rowi SEI Toast — Inspirado en el modelo Six Seconds (K·C·G)
 * Genera notificaciones emocionales con traducciones integradas.
 */
export function useRowiSEIToast() {
  const { t } = useI18n();

  return {
    show: (
      type:
        | "ky"
        | "cy"
        | "gy"
        | "optimism"
        | "empathy"
        | "clarity"
        | "drive"
        | "innovation"
        | "balance",
      msg?: string
    ) => {
      const map = {
        ky: {
          icon: "🌊",
          color: "#1E88E5",
          title: t("sei.ky.title") || "Know Yourself",
          desc: t("sei.ky.desc") || "Claridad emocional y autoconciencia.",
        },
        cy: {
          icon: "🔥",
          color: "#E53935",
          title: t("sei.cy.title") || "Choose Yourself",
          desc: t("sei.cy.desc") || "Decisión y propósito con intención.",
        },
        gy: {
          icon: "🌱",
          color: "#43A047",
          title: t("sei.gy.title") || "Give Yourself",
          desc: t("sei.gy.desc") || "Empatía y propósito compartido.",
        },
        optimism: {
          icon: "☀️",
          color: "#7c3aed",
          title: t("sei.optimism.title") || "Optimismo",
          desc: t("sei.optimism.desc") || "Ver posibilidades donde otros ven límites.",
        },
        empathy: {
          icon: "💞",
          color: "#f378a5",
          title: t("sei.empathy.title") || "Empatía",
          desc: t("sei.empathy.desc") || "Conectas desde el corazón.",
        },
        clarity: {
          icon: "✨",
          color: "#5bc0eb",
          title: t("sei.clarity.title") || "Claridad",
          desc: t("sei.clarity.desc") || "Tu mente se alinea con tu propósito.",
        },
        drive: {
          icon: "🚀",
          color: "#ff8fd4",
          title: t("sei.drive.title") || "Impulso",
          desc: t("sei.drive.desc") || "Energía que impulsa acción consciente.",
        },
        innovation: {
          icon: "💡",
          color: "#7a59c9",
          title: t("sei.innovation.title") || "Innovación",
          desc: t("sei.innovation.desc") || "Creas lo nuevo desde tu emoción.",
        },
        balance: {
          icon: "⚖️",
          color: "#43A047",
          title: t("sei.balance.title") || "Equilibrio",
          desc: t("sei.balance.desc") || "Encuentras armonía entre razón y emoción.",
        },
      };

      const item = map[type as keyof typeof map] || map.ky;

      toast.custom(
        () => (
          <div
            className="flex items-center gap-3 rounded-xl p-4 text-white shadow-lg
                       animate-in fade-in slide-in-from-top-4 duration-500"
            style={{
              background: item.color,
              border: "1px solid rgba(255,255,255,0.15)",
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 500,
            }}
          >
            <div className="text-2xl animate-pulse">{item.icon}</div>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold">{msg || item.title}</span>
              <span className="text-xs opacity-90 italic">{item.desc}</span>
            </div>
          </div>
        ),
        { duration: 4500 }
      );
    },
  };
}