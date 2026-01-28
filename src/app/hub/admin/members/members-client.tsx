"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, UserPlus, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

/* =========================================================
   Tipos
========================================================= */
type HubMember = {
  id: string;
  hubId: string;
  userId: string;
  roleId: string | null;
  joinedAt: string;
  user: { id: string; name: string | null; email: string | null };
  dynamicRole: { id: string; name: string } | null;
};

type HubRoleDynamic = {
  id: string;
  name: string;
};

/* =========================================================
   API helpers
========================================================= */
async function apiListMembers(hubId: string): Promise<HubMember[]> {
  const r = await fetch(`/api/admin/hubs/${hubId}/members`, { cache: "no-store" });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(text || `Error HTTP ${r.status}`);
  }
  const data = await r.json();
  // ✅ devolvemos solo el array de miembros
  return Array.isArray(data.members) ? data.members : [];
}

async function apiListRoles(hubId: string): Promise<HubRoleDynamic[]> {
  const r = await fetch(`/api/admin/hubs/${hubId}/roles`, { cache: "no-store" });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(text || `Error HTTP ${r.status}`);
  }
  const data = await r.json();
  return Array.isArray(data.roles) ? data.roles : [];
}

async function apiAssignRole(hubId: string, memberId: string, roleId: string | null) {
  const r = await fetch(`/api/admin/hubs/${hubId}/members/${memberId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roleId }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function apiRemoveMember(hubId: string, memberId: string) {
  const r = await fetch(`/api/admin/hubs/${hubId}/members/${memberId}`, { method: "DELETE" });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

/* =========================================================
   Página principal
========================================================= */
export default function HubMembersClient() {
  const { t } = useI18n("hub");
  const sp = useSearchParams();
  // 🧠 Si no hay ?hub= en la URL, usamos el ID real de Rowi Central
  const hubId = sp.get("hub") ?? "cmhcl9rl90007xxsjuekvcn7f";

  const [members, setMembers] = useState<HubMember[] | null>(null);
  const [roles, setRoles] = useState<HubRoleDynamic[]>([]);
  const [isPending, startTransition] = useTransition();

  /* =========================================================
     Cargar miembros y roles
  ========================================================= */
  useEffect(() => {
    startTransition(async () => {
      try {
        const [m, r] = await Promise.all([apiListMembers(hubId), apiListRoles(hubId)]);
        setMembers(m);
        setRoles(r);
      } catch (e: any) {
        console.error("❌ Error cargando miembros:", e);
        toast.error(e?.message ?? t("errorLoadMembers"));
      }
    });
  }, [hubId]);

  /* =========================================================
     Cambiar rol
  ========================================================= */
  const handleAssign = async (memberId: string, roleId: string | null) => {
    try {
      await apiAssignRole(hubId, memberId, roleId);
      toast.success(t("roleUpdated"));
      const data = await apiListMembers(hubId);
      setMembers(data);
    } catch (e: any) {
      toast.error(e?.message ?? t("errorAssignRole"));
    }
  };

  /* =========================================================
     Eliminar miembro
  ========================================================= */
  const handleRemove = async (memberId: string) => {
    try {
      await apiRemoveMember(hubId, memberId);
      toast.success(t("memberRemoved"));
      setMembers((m) => m?.filter((x) => x.id !== memberId) ?? null);
    } catch (e: any) {
      toast.error(e?.message ?? t("errorRemoveMember"));
    }
  };

  /* =========================================================
     Render
  ========================================================= */
  return (
    <main className="p-6 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">{t("hubMembersTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("hubMembersSubtitle")}</p>
        </div>
        <Button className="gap-2" disabled={isPending}>
          <UserPlus className="h-4 w-4" /> {t("addMember")}
        </Button>
      </header>

      {/* Estado de carga */}
      {!members ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> {t("loading")}
        </div>
      ) : members.length === 0 ? (
        <div className="border rounded-2xl p-10 text-center text-muted-foreground">
          {t("noMembersYet")}
        </div>
      ) : (
        <div className="border rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("user")}</TableHead>
                <TableHead>{t("email")}</TableHead>
                <TableHead>{t("dynamicRole")}</TableHead>
                <TableHead className="w-[120px]">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.user.name || "—"}</TableCell>
                  <TableCell>{m.user.email || "—"}</TableCell>
                  <TableCell>
                    <Select
                      defaultValue={m.dynamicRole?.id ?? ""}
                      onValueChange={(v) => handleAssign(m.id, v || null)}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder={t("noRole")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">{t("noRole")}</SelectItem>
                        {roles.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemove(m.id)}
                      className="gap-1"
                    >
                      <Trash2 className="h-3 w-3" /> {t("remove")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </main>
  );
}