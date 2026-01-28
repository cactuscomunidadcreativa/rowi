"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, FileSpreadsheet, Eye } from "lucide-react";
import { toast } from "sonner";

/* =========================================================
   📤 Importar Usuarios desde CSV (Batch Import)
   ---------------------------------------------------------
   Permite subir archivos CSV para crear usuarios preconfigurados
========================================================= */
export default function UserImportsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  /* =========================================================
     🔁 Cargar lista de lotes existentes
  ========================================================== */
  async function loadBatches() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users/imports");
      const data = await res.json();
      setBatches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error("Error cargando importaciones");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBatches();
  }, []);

  /* =========================================================
     📤 Subir archivo CSV
  ========================================================== */
  async function handleUpload() {
    if (!file) {
      toast.error("Selecciona un archivo CSV primero");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const res = await fetch("/api/admin/users/imports", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Error subiendo archivo");

      toast.success(data.message || "Archivo procesado correctamente");
      setFile(null);
      loadBatches();
    } catch (err: any) {
      toast.error(err.message || "Error al subir CSV");
    } finally {
      setUploading(false);
    }
  }

  /* =========================================================
     🎨 Render principal
  ========================================================== */
  return (
    <main className="p-6 space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-rowi-blueDay" /> Importar Usuarios (CSV)
          </h1>
          <p className="text-sm text-muted-foreground">
            Sube archivos CSV para crear usuarios con Tenants, Hubs y Organizaciones preconfiguradas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-64"
          />
          <Button onClick={handleUpload} disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Subiendo...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" /> Subir CSV
              </>
            )}
          </Button>
        </div>
      </header>

      {/* 📋 Listado de importaciones */}
      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando importaciones...
        </div>
      ) : batches.length === 0 ? (
        <p className="text-sm text-gray-500">No hay importaciones registradas.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map((b) => (
            <Card
              key={b.id}
              className="p-4 border border-gray-200 dark:border-gray-800 space-y-2 hover:shadow-md transition"
            >
              <h2 className="font-semibold">{b.name}</h2>
              <p className="text-xs text-gray-500">
                Subido por: {b.uploadedBy || "—"}
              </p>
              <p className="text-xs text-gray-500">
                Filas: {b.totalRows} | Procesadas: {b.done} | Pendientes: {b.pending}
              </p>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-blue-600"
                  onClick={() => window.location.assign(`/hub/admin/users/imports/${b.id}`)}
                >
                  <Eye className="w-3 h-3" /> Revisar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}