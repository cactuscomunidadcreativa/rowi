"use client";

import { useEffect, useState } from "react";

type NavItem = { label: string; href: string; visible: boolean };
type UIButton = { id: string; text: string; href: string; style: string };
type UIConfig = { navigation: NavItem[]; buttons: UIButton[]; updatedAt?: string };

// Pequeño helper para parsear JSON de forma segura
async function parseJsonSafe(res: Response) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("La API devolvió una respuesta no-JSON.");
  }
}

export default function AdminUIPage() {
  const [ui, setUi] = useState<UIConfig>({ navigation: [], buttons: [], updatedAt: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/ui", { cache: "no-store" });
        const data = await parseJsonSafe(res);
        if (!res.ok) throw new Error((data as any)?.error || "Error cargando UI");
        setUi((data as any).ui || { navigation: [], buttons: [], updatedAt: "" });
      } catch (e: any) {
        setError(e?.message || "Error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/ui", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ui),
      });
      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error((data as any)?.error || "Error guardando UI");
      setUi((data as any).ui);
    } catch (e: any) {
      setError(e?.message || "Error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="p-6">Cargando…</main>;

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-heading">Admin UI</h1>

      {error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm">
          {error}
        </div>
      )}

      <section className="space-y-2">
        <h2 className="font-semibold">Navegación</h2>
        <div className="flex flex-col gap-2">
          {ui.navigation.map((n, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                className="input"
                value={n.label}
                onChange={(e) => {
                  const next = [...ui.navigation];
                  next[i] = { ...n, label: e.target.value };
                  setUi({ ...ui, navigation: next });
                }}
                placeholder="Label"
              />
              <input
                className="input"
                value={n.href}
                onChange={(e) => {
                  const next = [...ui.navigation];
                  next[i] = { ...n, href: e.target.value };
                  setUi({ ...ui, navigation: next });
                }}
                placeholder="/ruta"
              />
              <label className="text-sm flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={n.visible}
                  onChange={(e) => {
                    const next = [...ui.navigation];
                    next[i] = { ...n, visible: e.target.checked };
                    setUi({ ...ui, navigation: next });
                  }}
                />
                Visible
              </label>
              <button
                className="button"
                onClick={() => {
                  const next = [...ui.navigation];
                  next.splice(i, 1);
                  setUi({ ...ui, navigation: next });
                }}
              >
                Eliminar
              </button>
            </div>
          ))}
          <button
            className="button"
            onClick={() =>
              setUi({
                ...ui,
                navigation: [...ui.navigation, { label: "Nuevo", href: "/nuevo", visible: true }],
              })
            }
          >
            + Añadir enlace
          </button>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Botones</h2>
        <div className="flex flex-col gap-2">
          {ui.buttons.map((b, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                className="input"
                value={b.id}
                onChange={(e) => {
                  const next = [...ui.buttons];
                  next[i] = { ...b, id: e.target.value };
                  setUi({ ...ui, buttons: next });
                }}
                placeholder="id"
              />
              <input
                className="input"
                value={b.text}
                onChange={(e) => {
                  const next = [...ui.buttons];
                  next[i] = { ...b, text: e.target.value };
                  setUi({ ...ui, buttons: next });
                }}
                placeholder="Texto"
              />
              <input
                className="input"
                value={b.href}
                onChange={(e) => {
                  const next = [...ui.buttons];
                  next[i] = { ...b, href: e.target.value };
                  setUi({ ...ui, buttons: next });
                }}
                placeholder="/ruta"
              />
              <input
                className="input"
                value={b.style}
                onChange={(e) => {
                  const next = [...ui.buttons];
                  next[i] = { ...b, style: e.target.value };
                  setUi({ ...ui, buttons: next });
                }}
                placeholder="button button--primary"
              />
              <button
                className="button"
                onClick={() => {
                  const next = [...ui.buttons];
                  next.splice(i, 1);
                  setUi({ ...ui, buttons: next });
                }}
              >
                Eliminar
              </button>
            </div>
          ))}
          <button
            className="button"
            onClick={() =>
              setUi({
                ...ui,
                buttons: [...ui.buttons, { id: "new", text: "Nuevo", href: "/feed", style: "button" }],
              })
            }
          >
            + Añadir botón
          </button>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="button button--primary">
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
        {ui.updatedAt && <span className="text-xs opacity-60">Actualizado: {ui.updatedAt}</span>}
      </div>
    </main>
  );
}