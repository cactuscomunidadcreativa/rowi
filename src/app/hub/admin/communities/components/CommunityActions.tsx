"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MoreVertical,
  Users,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

const CA_T = {
  es: {
    confirmDelete: (n: string) => `¿Seguro que quieres eliminar la comunidad "${n}"? Esta acción no se puede deshacer.`,
    deleteError: "❌ Error al eliminar comunidad",
    connError: "Error de conexión con el servidor",
    actions: "Acciones",
    viewMembers: "Ver miembros",
    editComingSoon: "Editar (próximamente)",
    delete: "Eliminar",
  },
  en: {
    confirmDelete: (n: string) => `Are you sure you want to delete the community "${n}"? This action cannot be undone.`,
    deleteError: "❌ Error deleting community",
    connError: "Server connection error",
    actions: "Actions",
    viewMembers: "View members",
    editComingSoon: "Edit (coming soon)",
    delete: "Delete",
  },
  pt: {
    confirmDelete: (n: string) => `Tem certeza de que deseja excluir a comunidade "${n}"? Esta ação não pode ser desfeita.`,
    deleteError: "❌ Erro ao excluir comunidade",
    connError: "Erro de conexão com o servidor",
    actions: "Ações",
    viewMembers: "Ver membros",
    editComingSoon: "Editar (em breve)",
    delete: "Excluir",
  },
  it: {
    confirmDelete: (n: string) => `Sei sicuro di voler eliminare la comunità "${n}"? Questa azione non può essere annullata.`,
    deleteError: "❌ Errore nell'eliminare la comunità",
    connError: "Errore di connessione al server",
    actions: "Azioni",
    viewMembers: "Vedi membri",
    editComingSoon: "Modifica (prossimamente)",
    delete: "Elimina",
  },
};

/**
 * =========================================================
 * 🎛️ CommunityActions
 * ---------------------------------------------------------
 * Menú contextual para cada comunidad en el panel admin.
 * Implementación con div + state (sin dependencias externas).
 * =========================================================
 */

export default function CommunityActions({
  communityId,
  communityName,
  onDelete,
}: {
  communityId: string;
  communityName: string;
  onDelete?: (id: string) => void;
}) {
  const router = useRouter();
  const { lang } = useI18n();
  const ct = CA_T[lang as keyof typeof CA_T] || CA_T.en;
  const [deleting, setDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  // 🗑️ Eliminar comunidad
  async function handleDelete() {
    setOpen(false);
    if (!confirm(ct.confirmDelete(communityName))) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/hub/communities/${communityId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        onDelete?.(communityId);
      } else {
        alert(ct.deleteError);
      }
    } catch (err) {
      console.error("❌ Error al eliminar comunidad:", err);
      alert(ct.connError);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div ref={menuRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-md text-gray-500 hover:text-rowi-blueDay hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {deleting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <MoreVertical className="w-4 h-4" />
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-1 w-44 rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg z-50 py-1 text-sm"
        >
          <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
            {ct.actions}
          </div>
          <div className="border-t border-gray-100 dark:border-zinc-800 my-1" />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              router.push(`/hub/admin/communities/members?id=${communityId}`);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-2"
          >
            <Users className="w-4 h-4 text-rowi-blueDay" />
            {ct.viewMembers}
          </button>

          <button
            type="button"
            role="menuitem"
            disabled
            className="w-full text-left px-3 py-1.5 cursor-not-allowed flex items-center gap-2 text-gray-400"
          >
            <Pencil className="w-4 h-4" />
            {ct.editComingSoon}
          </button>

          <div className="border-t border-gray-100 dark:border-zinc-800 my-1" />

          <button
            type="button"
            role="menuitem"
            onClick={handleDelete}
            className="w-full text-left px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
            {ct.delete}
          </button>
        </div>
      )}
    </div>
  );
}
