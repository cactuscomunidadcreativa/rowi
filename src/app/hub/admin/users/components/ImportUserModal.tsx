"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import Papa from "papaparse";

/* =========================================================
   📦 ImportUserModal — Subida y previsualización de usuarios
========================================================= */
export default function ImportUserModal({ tenants = [], onComplete }: any) {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [tenantId, setTenantId] = useState("");
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  /* =========================================================
     🧠 Leer archivo local y previsualizarlo
  ========================================================== */
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result;
      if (!content) return;

      try {
        let parsed: any[] = [];
        if (f.name.endsWith(".xlsx") || f.name.endsWith(".xls")) {
          const workbook = XLSX.read(content, { type: "binary" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          parsed = XLSX.utils.sheet_to_json(sheet);
        } else if (f.name.endsWith(".csv")) {
          const result = Papa.parse(content as string, {
            header: true,
            skipEmptyLines: true,
          });
          parsed = result.data;
        }

        setData(parsed.slice(0, 5)); // Mostrar solo 5 filas de preview
        toast.info(`Archivo cargado (${parsed.length} registros detectados)`);
      } catch (err: any) {
        console.error(err);
        toast.error("Error leyendo el archivo");
      }
    };

    if (f.name.endsWith(".xlsx") || f.name.endsWith(".xls")) {
      reader.readAsBinaryString(f);
    } else {
      reader.readAsText(f);
    }
  }

  /* =========================================================
     🚀 Subir al servidor y crear usuarios
  ========================================================== */
  async function handleUpload() {
    if (!file) return toast.error("Selecciona un archivo antes de continuar");
    if (!tenantId) return toast.error("Selecciona un tenant antes de importar");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("tenantId", tenantId);

    try {
      setLoading(true);
      toast.loading("Procesando importación...");

      const res = await fetch("/api/admin/users/import", {
        method: "POST",
        body: formData,
      });

      const j = await res.json();
      toast.dismiss();

      if (!res.ok) throw new Error(j.error);

      toast.success(
        `✅ Importación completa: ${j.created} nuevos, ${j.updated} actualizados`
      );
      setShow(false);
      setFile(null);
      setData([]);
      onComplete?.();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error subiendo archivo");
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     🎨 Render principal
  ========================================================== */
  if (!show)
    return (
      <Button
        variant="outline"
        onClick={() => setShow(true)}
        className="gap-1 text-blue-600 border-blue-400"
      >
        <Upload className="w-4 h-4" /> Importar Usuarios
      </Button>
    );

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <Card className="p-6 w-[480px] bg-white dark:bg-zinc-900 shadow-xl space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-lg">📤 Importar Usuarios</h2>
          <Button size="sm" variant="ghost" onClick={() => setShow(false)}>
            <X className="w-4 h-4" /> Cerrar
          </Button>
        </div>

        <div className="space-y-3">
          {/* Tenant */}
          <div>
            <label className="text-xs text-gray-500">Tenant de destino</label>
            <select
              className="w-full h-9 border rounded-md px-2"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
            >
              <option value="">Seleccionar...</option>
              {tenants.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Archivo */}
          <div>
            <label className="text-xs text-gray-500">Archivo CSV o Excel</label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="w-full border rounded-md p-2 text-sm"
            />
          </div>

          {/* Preview */}
          {data.length > 0 && (
            <div className="border rounded-md p-2 bg-gray-50 text-xs max-h-40 overflow-y-auto">
              <p className="font-semibold mb-1">Vista previa (5 registros)</p>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-200 text-[10px] uppercase">
                    {Object.keys(data[0])
                      .slice(0, 5)
                      .map((k) => (
                        <th key={k} className="border px-1 py-0.5 text-left">
                          {k}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((r, i) => (
                    <tr key={i}>
                      {Object.values(r)
                        .slice(0, 5)
                        .map((v: any, j) => (
                          <td
                            key={j}
                            className="border px-1 py-0.5 truncate max-w-[100px]"
                          >
                            {String(v)}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Botón principal */}
          <Button
            onClick={handleUpload}
            disabled={loading}
            className="w-full mt-2 gap-1"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Importando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" /> Iniciar Importación
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}