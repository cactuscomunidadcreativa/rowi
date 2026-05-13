"use client";

/**
 * =========================================================
 * 🧱 CommunityForm — Crear nueva comunidad
 * ---------------------------------------------------------
 * Modal con validación, visibilidad, categoría y portada.
 * =========================================================
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useState } from "react";
import { Image, Lock, Globe2, Users } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function CommunityForm({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (item: any) => void;
}) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    name: "",
    description: "",
    visibility: "public",
    category: "",
    bannerUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!form.name.trim()) {
      setError("El nombre de la comunidad es obligatorio.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/hub/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Error al crear comunidad");
      const newItem = await res.json();
      onCreated(newItem);
      onOpenChange(false);
      setForm({
        name: "",
        description: "",
        visibility: "public",
        category: "",
        bannerUrl: "",
      });
    } catch (err) {
      console.error("❌ Error creando comunidad:", err);
      setError("Ocurrió un error al crear la comunidad.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("admin.communities.form.createTitle")}</DialogTitle>
          <DialogDescription>
            Define los detalles básicos para tu nueva comunidad dentro del Hub.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Nombre */}
          <Input
            placeholder={t("admin.communities.form.namePlaceholder")}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          {/* Descripción */}
          <Textarea
            placeholder={t("admin.communities.form.descriptionPlaceholder")}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          {/* Categoría */}
          <div>
            <label className="text-sm font-medium text-gray-600">{t("admin.communities.form.category")}</label>
            <Select
              value={form.category}
              onValueChange={(v) => setForm({ ...form, category: v })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={t("admin.communities.form.selectCategoryOptional")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mindfulness">🧘 Mindfulness</SelectItem>
                <SelectItem value="leadership">👑 Liderazgo</SelectItem>
                <SelectItem value="relationships">💞 Relaciones</SelectItem>
                <SelectItem value="education">📚 Educación</SelectItem>
                <SelectItem value="innovation">🚀 Innovación</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Visibilidad */}
          <div>
            <label className="text-sm font-medium text-gray-600">{t("admin.communities.form.visibility")}</label>
            <Select
              value={form.visibility}
              onValueChange={(v) => setForm({ ...form, visibility: v })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={t("admin.communities.form.selectVisibility")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Globe2 className="w-4 h-4 text-blue-500" />
                    Pública
                  </div>
                </SelectItem>
                <SelectItem value="invite">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-pink-500" />
                    Solo con invitación
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gray-600" />
                    Privada
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Banner URL */}
          <div>
            <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Image className="w-4 h-4 text-gray-400" /> Imagen de portada (URL)
            </label>
            <Input
              placeholder={t("admin.communities.form.imageUrlPlaceholder")}
              value={form.bannerUrl}
              onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })}
            />
          </div>

          {/* Error */}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* Botón guardar */}
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-2"
          >
            {loading ? "Creando..." : "Crear comunidad"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}