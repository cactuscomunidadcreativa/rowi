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
  const [deleting, setDeleting] = useState(false);

  // 🗑️ Eliminar comunidad
  async function handleDelete() {
    if (
      !confirm(
        `¿Seguro que quieres eliminar la comunidad "${communityName}"? Esta acción no se puede deshacer.`
      )
    )
      return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/hub/communities/${communityId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        onDelete?.(communityId);
      } else {
        alert("❌ Error al eliminar comunidad");
      }
    } catch (err) {
      console.error("❌ Error al eliminar comunidad:", err);
      alert("Error de conexión con el servidor");
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