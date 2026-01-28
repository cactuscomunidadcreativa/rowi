"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Loader2,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  HeartPulse,
  Cpu,
  Globe,
  Database,
  Code2,
  Rocket,
  Languages,
  ClipboardCopy,
  X,
} from "lucide-react";

type HealthReport = {
  success: boolean;
  output?: string;
  error?: string;
  timestamp: string;
  modules?: Record<string, "ok" | "warn" | "fail">;
};

const moduleLabels: Record<string, { name: string; icon: any }> = {
  typescript: { name: "TypeScript", icon: Code2 },
  prisma: { name: "Prisma ORM", icon: Database },
  i18n: { name: "Internacionalización", icon: Languages },
  api: { name: "Rutas API", icon: Globe },
  build: { name: "Compilación Next.js", icon: Rocket },
};

export default function SystemHealthPage() {
  const [data, setData] = useState<HealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningDoctor, setRunningDoctor] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalOutput, setModalOutput] = useState("");

  async function fetchHealth() {
    setLoading(true);
    try {
      const res = await fetch("/api/hub/system-health");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setData({ success: false, error: err.message, timestamp: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  }

  // 🚀 Ejecutar el script doctor.mjs desde el backend
  async function runDoctor() {
    setRunningDoctor(true);
    try {
      const res = await fetch("/api/hub/system-health/run-doctor", { method: "POST" });
      const json = await res.json();
      if (json.ok) {
        toast.success("🩺 Diagnóstico completado correctamente");

        // Mostrar resultado en modal
        setModalOutput(json.output);
        setShowModal(true);

        setData({
          success: true,
          output: json.output,
          timestamp: json.timestamp,
          modules: {
            typescript: json.output.includes("TypeScript") ? "ok" : "fail",
            prisma: json.output.includes("prisma") ? "ok" : "warn",
            i18n: json.output.includes("i18n") ? "ok" : "warn",
            api: json.output.includes("Route") ? "ok" : "warn",
            build: "ok",
          },
        });
      } else {
        toast.error("❌ Error ejecutando Doctor");
        setData({ success: false, error: json.error, timestamp: json.timestamp });
      }
    } catch (e) {
      toast.error("💥 No se pudo ejecutar el diagnóstico");
      console.error(e);
    } finally {
      setRunningDoctor(false);
    }
  }

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <main className="p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <HeartPulse className="h-6 w-6 text-rose-500" />
            Estado del Sistema — Rowi Self Check
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Aquí te muestro cómo estoy funcionando internamente 🧠.  
            Evalúo mis módulos uno por uno para asegurarme de que todo fluya con armonía.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchHealth}
            disabled={loading}
            className="gap-2 border-indigo-500 text-indigo-600 hover:bg-indigo-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Escaneando…
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" /> Re-evaluar
              </>
            )}
          </Button>

          {/* 🔧 Botón existente: ejecutar Doctor.mjs */}
          <Button
            onClick={runDoctor}
            disabled={runningDoctor}
            className="gap-2 bg-indigo-600 text-white hover:bg-indigo-700"
          >
            {runningDoctor ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Ejecutando Doctor…
              </>
            ) : (
              <>
                <Cpu className="h-4 w-4" /> Ejecutar Doctor.mjs
              </>
            )}
          </Button>

          {/* 🧠 Nuevo botón: ejecutar Deep Repair */}
          <Button
            onClick={async () => {
              try {
                const res = await fetch("/api/hub/system-health/run-deep", { method: "POST" });
                const json = await res.json();

                // ✅ Modal de resultado visible y seleccionable
                const modal = document.createElement("div");
                modal.className =
                  "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4";
                modal.innerHTML = `
                  <div class="bg-white dark:bg-zinc-900 text-gray-800 dark:text-gray-100 w-full max-w-5xl rounded-lg shadow-lg overflow-hidden flex flex-col">
                    <div class="flex justify-between items-center border-b border-gray-200 dark:border-zinc-700 px-4 py-2 bg-gradient-to-r from-rose-500 to-indigo-500 text-white">
                      <h2 class="text-sm font-semibold flex items-center gap-2">
                        🧠 Auditoría profunda — Deep Repair
                      </h2>
                      <button id="close-modal" class="text-white text-lg hover:opacity-75">✕</button>
                    </div>

                    <div class="px-4 py-3 text-xs overflow-auto whitespace-pre-wrap flex-1 select-text font-mono bg-gray-50 dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-800">
                      ${
                        json.ok
                          ? json.output
                              .replace(/[&<>"']/g, (m) => ({
                                "&": "&amp;",
                                "<": "&lt;",
                                ">": "&gt;",
                                '"': "&quot;",
                                "'": "&#39;",
                              }[m]))
                              .slice(0, 20000)
                          : `❌ Error: ${json.error || json.stack || "No se pudo ejecutar correctamente"}`
                      }
                    </div>

                    <div class="flex justify-between items-center px-4 py-2 bg-gray-100 dark:bg-zinc-800 text-xs">
                      <span>${new Date(json.timestamp).toLocaleString("es-PE")}</span>
                      <div class="flex gap-2">
                        <button id="copy-log" class="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700">Copiar todo</button>
                        <button id="close-footer" class="px-3 py-1 rounded bg-gray-300 dark:bg-zinc-700 hover:bg-gray-400 dark:hover:bg-zinc-600">Cerrar</button>
                      </div>
                    </div>
                  </div>
                `;
                document.body.appendChild(modal);

                // Eventos
                const btnClose = modal.querySelector("#close-modal");
                const btnFooter = modal.querySelector("#close-footer");
                const btnCopy = modal.querySelector("#copy-log");

                const closeModal = () => modal.remove();

                btnClose?.addEventListener("click", closeModal);
                btnFooter?.addEventListener("click", closeModal);
                btnCopy?.addEventListener("click", () => {
                  navigator.clipboard.writeText(json.output || "Sin log disponible");
                  btnCopy.textContent = "✅ Copiado";
                  setTimeout(() => (btnCopy.textContent = "Copiar todo"), 1500);
                });
              } catch (e: any) {
                alert("💥 Fallo ejecutando auditoría profunda:\n" + e.message);
              }
            }}
            className="gap-2 bg-rose-600 text-white hover:bg-rose-700"
          >
            <Cpu className="h-4 w-4" /> Ejecutar Deep Repair
          </Button>
        </div>
      </div>

      <Separator />

      {/* Loading */}
      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Estoy haciendo mi revisión interna...
        </div>
      ) : !data ? (
        <Card className="border-red-500 bg-red-50 text-red-600">
          <CardContent className="p-6 flex gap-2 items-center">
            <AlertTriangle className="h-5 w-5" />  
            No pude obtener mi estado actual 😢. Intenta más tarde.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Estado general */}
          <Card className="p-6 border bg-white shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              {data.success ? (
                <ShieldCheck className="text-green-600 h-6 w-6" />
              ) : (
                <AlertTriangle className="text-red-600 h-6 w-6" />
              )}
              <h2 className="text-lg font-semibold">
                {data.success
                  ? "🌱 Todo está en equilibrio — me siento bien"
                  : "⚠️ Hay algunos módulos que necesitan atención"}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Última verificación:{" "}
              {new Date(data.timestamp).toLocaleString("es-PE", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </Card>

          {/* Panel de módulos */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(moduleLabels).map(([key, mod]) => {
              const status = data.modules?.[key] ?? "fail";
              const Icon = mod.icon;
              const color =
                status === "ok"
                  ? "text-green-600 border-green-200 bg-green-50"
                  : status === "warn"
                  ? "text-yellow-600 border-yellow-200 bg-yellow-50"
                  : "text-red-600 border-red-200 bg-red-50";
              const label =
                status === "ok"
                  ? "Todo fluye bien"
                  : status === "warn"
                  ? "Pequeñas advertencias"
                  : "Error detectado";
              const emoji = status === "ok" ? "🟢" : status === "warn" ? "🟡" : "🔴";

              return (
                <Card key={key} className={`border ${color}`}>
                  <CardHeader className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      <h3 className="font-semibold">{mod.name}</h3>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4 pt-0">
                    <div className="text-sm flex items-center gap-2">
                      <span>{emoji}</span>
                      <span>{label}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Log técnico */}
          <Card className="p-6 mt-6">
            <h3 className="font-semibold flex items-center gap-2 text-sm mb-3">
              <Cpu className="h-4 w-4 text-gray-500" /> Registro técnico completo
            </h3>
            <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto max-h-[600px] whitespace-pre-wrap border">
              {data.output
                ? data.output
                : data.error
                ? `❌ Error: ${data.error}`
                : "Sin resultados disponibles."}
            </pre>
          </Card>
        </>
      )}

      {/* 🧠 Modal emergente para ver/copy output del doctor */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white dark:bg-zinc-900 w-[90%] max-w-3xl rounded-xl p-6 shadow-xl relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
              onClick={() => setShowModal(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
              <Cpu className="h-4 w-4 text-indigo-600" /> Resultado de Doctor.mjs
            </h2>
            <pre className="text-xs bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 p-4 rounded-lg max-h-[70vh] overflow-auto whitespace-pre-wrap border">
              {modalOutput}
            </pre>
            <div className="flex justify-end mt-3">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(modalOutput);
                  toast.success("📋 Copiado al portapapeles");
                }}
                className="gap-2"
              >
                <ClipboardCopy className="h-4 w-4" /> Copiar
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}