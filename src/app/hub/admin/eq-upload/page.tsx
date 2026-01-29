"use client";

import React, { useState, useRef } from "react";

type UploadResult = {
  ok: boolean;
  inserted?: number;
  updated?: number;
  errors?: string[];
  durationMs?: number;
  message?: string;
};

type PreviewRow = {
  email: string;
  name: string;
  ky: number | null;
  cy: number | null;
  gy: number | null;
  brainStyle: string;
  status: "new" | "existing" | "error";
  errorMsg?: string;
};

export default function EqUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setResult(null);
    setError("");

    // Preview del archivo
    try {
      const text = await selectedFile.text();
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) {
        setError("El archivo debe tener al menos una fila de datos");
        return;
      }

      // Parsear headers
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const emailIdx = headers.findIndex((h) => h.includes("email") || h.includes("correo"));
      const nameIdx = headers.findIndex((h) => h.includes("name") || h.includes("nombre"));
      const kyIdx = headers.findIndex((h) => h === "ky" || h.includes("know yourself"));
      const cyIdx = headers.findIndex((h) => h === "cy" || h.includes("choose yourself"));
      const gyIdx = headers.findIndex((h) => h === "gy" || h.includes("give yourself"));
      const brainIdx = headers.findIndex((h) => h.includes("brain") || h.includes("estilo"));

      // Preview primeras 10 filas
      const previewRows: PreviewRow[] = [];
      for (let i = 1; i < Math.min(lines.length, 11); i++) {
        const cols = lines[i].split(",").map((c) => c.trim());
        previewRows.push({
          email: emailIdx >= 0 ? cols[emailIdx] || "" : "",
          name: nameIdx >= 0 ? cols[nameIdx] || "" : "",
          ky: kyIdx >= 0 ? parseFloat(cols[kyIdx]) || null : null,
          cy: cyIdx >= 0 ? parseFloat(cols[cyIdx]) || null : null,
          gy: gyIdx >= 0 ? parseFloat(cols[gyIdx]) || null : null,
          brainStyle: brainIdx >= 0 ? cols[brainIdx] || "" : "",
          status: "new",
        });
      }

      setPreview(previewRows);
    } catch (err) {
      setError("Error leyendo el archivo");
    }
  }

  async function handleUpload() {
    if (!file) return;

    setUploading(true);
    setResult(null);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload-csv/community", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.ok) {
        setResult({
          ok: true,
          inserted: data.inserted || 0,
          updated: data.updated || 0,
          durationMs: data.durationMs,
          message: data.message || "Importación completada",
        });
        setFile(null);
        setPreview([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        setResult({
          ok: false,
          errors: data.errors || [data.error || "Error desconocido"],
          message: data.message,
        });
      }
    } catch (err) {
      setError("Error de conexión al subir el archivo");
    } finally {
      setUploading(false);
    }
  }

  function downloadTemplate() {
    const template = `Email,Name,Surname,Country,Know Yourself,Choose Yourself,Give Yourself,EL,RP,ACT,NE,IM,OP,EMP,NG,Brain Style,Recent Mood
juan@example.com,Juan,García,PE,100,95,105,98,96,94,92,88,90,95,85,Analytical,Positive
maria@example.com,María,López,MX,105,100,98,100,95,92,90,95,88,100,90,Intuitive,Neutral`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rowi_eq_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Cargar Resultados EQ</h1>
        <p className="text-gray-500 mt-1">
          Sube los resultados de las evaluaciones SEI de Six Seconds en formato CSV
        </p>
      </header>

      {/* Instrucciones */}
      <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h2 className="font-medium text-blue-800 dark:text-blue-200 mb-2">📋 Instrucciones</h2>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• El CSV debe tener una columna <strong>Email</strong> para identificar al usuario</li>
          <li>• Columnas de scores: Know Yourself (KY), Choose Yourself (CY), Give Yourself (GY)</li>
          <li>• Competencias: EL, RP, ACT, NE, IM, OP, EMP, NG</li>
          <li>• Opcional: Brain Style, Recent Mood, Country</li>
          <li>• Si el email ya existe, se actualizará el snapshot</li>
        </ul>
        <button
          onClick={downloadTemplate}
          className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ⬇️ Descargar plantilla CSV
        </button>
      </section>

      {/* Upload form */}
      <section className="bg-white dark:bg-gray-800 rounded-lg border p-6">
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <div className="text-5xl mb-3">📄</div>
            <span className="text-lg font-medium">
              {file ? file.name : "Seleccionar archivo CSV"}
            </span>
            <span className="text-sm text-gray-500 mt-1">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : "Arrastra o haz clic para seleccionar"}
            </span>
          </label>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Preview */}
        {preview.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Vista previa ({preview.length} filas)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2 pr-3">Email</th>
                    <th className="py-2 pr-3">Nombre</th>
                    <th className="py-2 pr-3">KY</th>
                    <th className="py-2 pr-3">CY</th>
                    <th className="py-2 pr-3">GY</th>
                    <th className="py-2 pr-3">Brain Style</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-2 pr-3">{row.email || "—"}</td>
                      <td className="py-2 pr-3">{row.name || "—"}</td>
                      <td className="py-2 pr-3">{row.ky ?? "—"}</td>
                      <td className="py-2 pr-3">{row.cy ?? "—"}</td>
                      <td className="py-2 pr-3">{row.gy ?? "—"}</td>
                      <td className="py-2 pr-3">{row.brainStyle || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Upload button */}
        {file && (
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? "Subiendo..." : "📤 Subir e importar"}
            </button>
            <button
              onClick={() => {
                setFile(null);
                setPreview([]);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
          </div>
        )}
      </section>

      {/* Result */}
      {result && (
        <section
          className={`rounded-lg border p-4 ${
            result.ok
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
          }`}
        >
          <h3 className={`font-medium ${result.ok ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"}`}>
            {result.ok ? "✅ Importación exitosa" : "❌ Error en la importación"}
          </h3>
          {result.ok ? (
            <div className="mt-2 text-sm text-green-700 dark:text-green-300">
              <p>• {result.inserted} registros importados</p>
              {result.updated ? <p>• {result.updated} registros actualizados</p> : null}
              {result.durationMs ? <p>• Tiempo: {(result.durationMs / 1000).toFixed(2)}s</p> : null}
            </div>
          ) : (
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              {result.errors?.map((err, idx) => (
                <p key={idx}>• {err}</p>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Recent uploads */}
      <section className="bg-white dark:bg-gray-800 rounded-lg border p-6">
        <h2 className="font-medium mb-4">Últimos uploads</h2>
        <p className="text-sm text-gray-500">
          Para ver el historial de uploads, consulta los logs de actividad.
        </p>
      </section>
    </main>
  );
}
