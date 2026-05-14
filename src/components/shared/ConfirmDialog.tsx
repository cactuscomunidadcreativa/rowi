"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = "danger",
  onConfirm,
  onCancel,
  loading,
}: ConfirmDialogProps) {
  const { t } = useI18n();

  const variantStyles = {
    danger: {
      icon: "bg-red-500/10 text-red-600",
      button: "bg-red-500 hover:bg-red-600 text-white",
    },
    warning: {
      icon: "bg-amber-500/10 text-amber-600",
      button: "bg-amber-500 hover:bg-amber-600 text-white",
    },
    info: {
      icon: "bg-blue-500/10 text-blue-600",
      button:
        "bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white",
    },
  }[variant];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 z-50 p-6"
            role="dialog"
            aria-modal="true"
          >
            <button
              onClick={onCancel}
              className="absolute top-3 right-3 p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label={t("actions.close", "Close")}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${variantStyles.icon}`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  {title}
                </h2>
                {message && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5">
                    {message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={onCancel}
                disabled={loading}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                {cancelLabel ?? t("actions.cancel", "Cancel")}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-50 ${variantStyles.button}`}
              >
                {loading
                  ? t("common.loading", "Loading...")
                  : confirmLabel ?? t("actions.confirm", "Confirm")}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
