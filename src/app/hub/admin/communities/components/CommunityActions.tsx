"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MoreVertical,
  Users,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/I18nProvider";

const CA_T = {
  es: {
    confirmDelete: (n: string) => `¿Seguro que quieres eliminar la comunidad "${n}"? Esta acción no se puede deshacer.`,
    deleteError: "❌ Error al eliminar comunidad",
    connError: "Error de conexión con el servidor",
  },
  en: {
    confirmDelete: (n: string) => `Are you sure you want to delete the community "${n}"? This action cannot be undone.`,
    deleteError: "❌ Error deleting community",
    connError: "Server connection error",
  },
  pt: {
    confirmDelete: (n: string) => `Tem certeza de que deseja excluir a comunidade "${n}"? Esta ação não pode ser desfeita.`,
    deleteError: "❌ Erro ao excluir comunidade",
    connError: "Erro de conexão com o servidor",
  },
  it: {
    confirmDelete: (n: string) => `Sei sicuro di voler eliminare la comunità "${n}"? Questa azione non può essere annullata.`,
    deleteError: "❌ Errore nell'eliminare la comunità",
    connError: "Errore di connessione al server",
  },
};

/**
 * =========================================================
 * 🎛️ CommunityActions
 * ---------------------------------------------------------
 * Menú contextual para cada comunidad en el panel admin.
 * Permite:
 *  - Ver miembros
 *  - Editar comunidad (futuro)
 *  - Eliminar comunidad
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

  // 🗑️ Eliminar comunidad
  async function handleDelete() {
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-500 hover:text-rowi-blueDay"
        >
          {deleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MoreVertical className="w-4 h-4" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() =>
            router.push(`/hub/admin/communities/members?id=${communityId}`)
          }
          className="cursor-pointer flex items-center gap-2"
        >
          <Users className="w-4 h-4 text-rowi-blueDay" />
          Ver miembros
        </DropdownMenuItem>

        <DropdownMenuItem
          disabled
          className="cursor-not-allowed flex items-center gap-2 text-gray-400"
        >
          <Pencil className="w-4 h-4" />
          Editar (próximamente)
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleDelete}
          className="cursor-pointer flex items-center gap-2 text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}