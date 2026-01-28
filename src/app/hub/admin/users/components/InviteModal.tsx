"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type InviteModalProps = {
  tenants: { id: string; name: string }[];
  roles: { id: string; name: string; level: string }[];
};

export default function InviteModal({ tenants, roles }: InviteModalProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    email: "",
    tenantId: "",
    role: "",
    planId: "",
    expiresInDays: 7,
  });
  const [isPending, startTransition] = useTransition();
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  async function sendInvite() {
    if (!form.email) {
      toast.error("Debes ingresar un correo electrónico");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/users/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Error al crear invitación");
        toast.success("Invitación enviada ✅");
        setInviteLink(data.link);
        setForm({ email: "", tenantId: "", role: "", planId: "", expiresInDays: 7 });
      } catch (e: any) {
        toast.error(e.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Nueva invitación
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Invitar nuevo usuario</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="correo@empresa.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label>Tenant (organización)</Label>
            <select
              className="border rounded-md h-9 px-2 text-sm"
              value={form.tenantId}
              onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
            >
              <option value="">Seleccionar tenant...</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label>Rol asignado</Label>
            <select
              className="border rounded-md h-9 px-2 text-sm"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="">Seleccionar rol...</option>
              {roles.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name} ({r.level})
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label>Días hasta expiración</Label>
            <Input
              type="number"
              value={form.expiresInDays}
              onChange={(e) => setForm({ ...form, expiresInDays: parseInt(e.target.value) })}
            />
          </div>

          <Separator />

          <div className="flex justify-end gap-2 mt-3">
            <Button onClick={sendInvite} disabled={isPending} className="gap-2">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar invitación
            </Button>
          </div>

          {inviteLink && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md mt-4">
              <p className="text-sm text-green-700 dark:text-green-300 font-medium">✅ Invitación generada:</p>
              <a
                href={inviteLink}
                target="_blank"
                className="block truncate text-xs text-blue-600 dark:text-blue-400 mt-1"
              >
                {inviteLink}
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}