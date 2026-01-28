"use client";
import { toast } from "sonner";

/**
 * RowiToast — capa de notificaciones emocionales alineada al modelo SEI
 */
export const RowiToast = {
  success: (msg: string) =>
    toast.success(msg, {
      description: "✨ Bien hecho. Seguiste tu claridad interior.",
      className:
        "bg-[var(--rowi-blue-day)] text-white dark:bg-[var(--rowi-blue-night)]",
    }),

  error: (msg: string) =>
    toast.error(msg, {
      description: "⚠️ Algo no salió como esperabas. Revisa y reajusta tu intención.",
      className: "bg-[#E53935] text-white", // Choose Yourself (CY)
    }),

  warning: (msg: string) =>
    toast.warning(msg, {
      description: "🧘‍♂️ Pausa un momento para reflexionar antes de actuar.",
      className: "bg-[#43A047] text-white", // Give Yourself (GY)
    }),

  info: (msg: string) =>
    toast.info(msg, {
      description: "💡 Nueva perspectiva: observa, comprende y conecta.",
      className:
        "bg-[var(--rowi-pink-day)] text-white dark:bg-[var(--rowi-pink-night)]",
    }),

  sei: (type: "ky" | "cy" | "gy", msg: string) => {
    const colors: Record<string, string> = {
      ky: "bg-[#1E88E5]", // Know Yourself
      cy: "bg-[#E53935]", // Choose Yourself
      gy: "bg-[#43A047]", // Give Yourself
    };
    const messages: Record<string, string> = {
      ky: "🌊 Claridad emocional: observas con conciencia.",
      cy: "🔥 Decisión y propósito: estás eligiendo con intención.",
      gy: "🌱 Empatía y propósito: conectas desde tu autenticidad.",
    };
    toast(msg, {
      description: messages[type],
      className: `${colors[type]} text-white font-medium`,
    });
  },
};