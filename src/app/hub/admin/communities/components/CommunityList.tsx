"use client";

/**
 * =========================================================
 * 🧩 CommunityList — Panel de comunidades
 * ---------------------------------------------------------
 * Muestra comunidades con resumen visual, acciones,
 * visibilidad y métricas.
 * =========================================================
 */

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Users2, Eye, Lock, Globe2, MessageSquare } from "lucide-react";
import CommunityActions from "./CommunityActions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function CommunityList({ data = [], onDelete }: { data: any[]; onDelete?: (id: string) => void }) {
  if (!data?.length)
    return (
      <p className="text-sm text-muted-foreground">
        No se han creado comunidades todavía.
      </p>
    );

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((c) => (
        <Card
          key={c.id}
          className="relative overflow-hidden border border-border/40 hover:border-rowi-blueDay/40 transition-all group bg-white dark:bg-gray-900/40"
        >
          {/* Imagen o fondo */}
          <div className="relative h-24 w-full bg-gradient-to-r from-rowi-blueDay/10 to-rowi-pinkDay/10">
            {c.bannerUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={c.bannerUrl}
                alt={c.name}
                className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-rowi-blueDay/50 text-sm">
                Sin portada
              </div>
            )}
          </div>

          <CardHeader className="flex items-center justify-between px-4 pt-3 pb-1">
            <div className="flex items-center gap-3">
              <Avatar src={c.image || c.bannerUrl || undefined} alt={c.name} />
              <div>
                <h2 className="font-semibold text-sm truncate">{c.name}</h2>
                <p className="text-[11px] text-muted-foreground capitalize">
                  {visibilityIcon(c.visibility)} {c.visibility || "pública"}
                </p>
              </div>
            </div>

            <CommunityActions
              communityId={c.id}
              communityName={c.name}
              onDelete={onDelete}
            />
          </CardHeader>

          <CardContent className="px-4 pb-3 space-y-3">
            {/* Descripción corta con tooltip */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-xs text-muted-foreground line-clamp-3 cursor-help">
                    {c.description || "Sin descripción disponible."}
                  </p>
                </TooltipTrigger>
                {c.description && (
                  <TooltipContent className="max-w-xs text-xs">
                    {c.description}
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            {/* Métricas */}
            <div className="flex justify-between items-center text-[12px] text-gray-600 dark:text-gray-300 pt-1">
              <div className="flex items-center gap-1">
                <Users2 className="w-3.5 h-3.5 text-rowi-blueDay" />
                {c._count?.members ?? 0} miembros
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-rowi-pinkDay" />
                {c._count?.posts ?? 0} posts
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* =========================================================
   🔹 Helper → Icono de visibilidad
========================================================= */
function visibilityIcon(type?: string) {
  const size = "w-3.5 h-3.5 inline mr-1";
  switch (type) {
    case "private":
      return <Lock className={size + " text-gray-500"} />;
    case "invite":
      return <Eye className={size + " text-rowi-pinkDay"} />;
    default:
      return <Globe2 className={size + " text-rowi-blueDay"} />;
  }
}