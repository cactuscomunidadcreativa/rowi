"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, User, FileSpreadsheet, RefreshCw, ChevronDown, X, Check } from "lucide-react";
import useSWR from "swr";

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

type UserOption = {
  id: string;
  name: string;
  email: string;
};

type EqSnapshot = {
  id: string;
  at: string;
  K: number | null;
  C: number | null;
  G: number | null;
  EL: number | null;
  RP: number | null;
  ACT: number | null;
  NE: number | null;
  IM: number | null;
  OP: number | null;
  EMP: number | null;
  NG: number | null;
  brainStyle: string | null;
  country: string | null;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Componente de búsqueda de miembros
function MemberSearch({
  onSelect,
  selectedUser,
}: {
  onSelect: (user: UserOption | null) => void;
  selectedUser: UserOption | null;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch users con búsqueda
  const { data, isLoading } = useSWR(
    search.length >= 2 ? `/api/admin/users?q=${encodeURIComponent(search)}&limit=20` : null,
    fetcher,
    { dedupingInterval: 300 }
  );

  const users: UserOption[] = useMemo(() => {
    if (!data?.users) return [];
    return data.users.map((u: any) => ({
      id: u.id,
      name: u.name || u.email,
      email: u.email,
    }));
  }, [data]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (user: UserOption) => {
    onSelect(user);
    setOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
    setSearch("");
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="flex h-12 w-full items-center justify-between rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {selectedUser ? (
          <span className="flex items-center gap-2">
            <User className="w-4 h-4 text-blue-500" />
            <span className="font-medium">{selectedUser.name}</span>
            <span className="text-gray-500 text-xs">({selectedUser.email})</span>
          </span>
        ) : (
          <span className="text-gray-500 flex items-center gap-2">
            <Search className="w-4 h-4" />
            Buscar miembro por nombre o email...
          </span>
        )}
        <div className="flex items-center gap-1">
          {selectedUser && (
            <X
              className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-pointer"
              onClick={handleClear}
            />
          )}
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Escribe al menos 2 caracteres..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
            {search && (
              <X
                className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-pointer"
                onClick={() => setSearch("")}
              />
            )}
          </div>

          {/* Results */}
          <div className="max-h-64 overflow-y-auto">
            {search.length < 2 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                Escribe al menos 2 caracteres para buscar
              </div>
            ) : isLoading ? (
              <div className="py-8 text-center text-sm text-gray-500">
                <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
                Buscando...
              </div>
            ) : users.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                No se encontraron miembros
              </div>
            ) : (
              users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelect(user)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  {selectedUser?.id === user.id && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Formulario de EQ individual
function SingleMemberEqForm({ userId }: { userId: string }) {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Fetch current EQ data
  const { data, mutate } = useSWR(`/api/admin/eq/member?userId=${userId}`, fetcher);
  const snapshot = data?.snapshot as EqSnapshot | null;

  const [formData, setFormData] = useState({
    K: "",
    C: "",
    G: "",
    EL: "",
    RP: "",
    ACT: "",
    NE: "",
    IM: "",
    OP: "",
    EMP: "",
    NG: "",
    brainStyle: "",
    country: "",
  });

  // Sync form with snapshot data
  useEffect(() => {
    if (snapshot) {
      setFormData({
        K: snapshot.K?.toString() || "",
        C: snapshot.C?.toString() || "",
        G: snapshot.G?.toString() || "",
        EL: snapshot.EL?.toString() || "",
        RP: snapshot.RP?.toString() || "",
        ACT: snapshot.ACT?.toString() || "",
        NE: snapshot.NE?.toString() || "",
        IM: snapshot.IM?.toString() || "",
        OP: snapshot.OP?.toString() || "",
        EMP: snapshot.EMP?.toString() || "",
        NG: snapshot.NG?.toString() || "",
        brainStyle: snapshot.brainStyle || "",
        country: snapshot.country || "",
      });
    }
  }, [snapshot]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/admin/eq/member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          ...formData,
        }),
      });

      const json = await res.json();
      if (json.ok) {
        setSuccess(true);
        mutate();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(json.error || "Error al guardar");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const BRAIN_STYLES = [
    "Analytical",
    "Intuitive",
    "Empathetic",
    "Adaptive",
    "Balanced",
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Datos actuales */}
      {snapshot && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            📊 Último registro SEI
          </h4>
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p>Fecha: {new Date(snapshot.at).toLocaleDateString("es")}</p>
            <p>
              Scores: K={snapshot.K || "—"}, C={snapshot.C || "—"}, G={snapshot.G || "—"}
            </p>
            {snapshot.brainStyle && <p>Brain Style: {snapshot.brainStyle}</p>}
          </div>
        </div>
      )}

      {/* Scores principales */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Know Yourself (K)</label>
          <input
            type="number"
            min="0"
            max="150"
            value={formData.K}
            onChange={(e) => handleChange("K", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            placeholder="0-150"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Choose Yourself (C)</label>
          <input
            type="number"
            min="0"
            max="150"
            value={formData.C}
            onChange={(e) => handleChange("C", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            placeholder="0-150"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Give Yourself (G)</label>
          <input
            type="number"
            min="0"
            max="150"
            value={formData.G}
            onChange={(e) => handleChange("G", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            placeholder="0-150"
          />
        </div>
      </div>

      {/* Competencias */}
      <details className="group">
        <summary className="cursor-pointer font-medium text-sm flex items-center gap-2">
          <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
          Competencias detalladas (opcional)
        </summary>
        <div className="mt-4 grid grid-cols-4 gap-3">
          {[
            { key: "EL", label: "Emotional Literacy" },
            { key: "RP", label: "Recognize Patterns" },
            { key: "ACT", label: "Apply Consequential Thinking" },
            { key: "NE", label: "Navigate Emotions" },
            { key: "IM", label: "Intrinsic Motivation" },
            { key: "OP", label: "Exercise Optimism" },
            { key: "EMP", label: "Increase Empathy" },
            { key: "NG", label: "Pursue Noble Goals" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs text-gray-500 mb-1">{label}</label>
              <input
                type="number"
                min="0"
                max="150"
                value={formData[key as keyof typeof formData]}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-full px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                placeholder={key}
              />
            </div>
          ))}
        </div>
      </details>

      {/* Brain Style y Country */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Brain Style</label>
          <select
            value={formData.brainStyle}
            onChange={(e) => handleChange("brainStyle", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="">Seleccionar...</option>
            {BRAIN_STYLES.map((style) => (
              <option key={style} value={style}>
                {style}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">País</label>
          <input
            type="text"
            value={formData.country}
            onChange={(e) => handleChange("country", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            placeholder="PE, MX, CO..."
          />
        </div>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-green-700 dark:text-green-300 text-sm">
          ✅ Datos SEI guardados correctamente
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={saving}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
      >
        {saving ? "Guardando..." : "💾 Guardar datos SEI"}
      </button>
    </form>
  );
}

export default function EqUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado para búsqueda individual
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [mode, setMode] = useState<"single" | "bulk">("single");

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

      const res = await fetch("/api/admin/six-seconds/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.ok) {
        setResult({
          ok: true,
          inserted: data.stats?.newSnapshots || 0,
          updated: data.stats?.matchedUsers || 0,
          durationMs: data.durationMs,
          message: `${data.stats?.processedRows || 0} registros procesados`,
        });
        setFile(null);
        setPreview([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        setResult({
          ok: false,
          errors: data.stats?.errors?.map((e: any) => e.error) || [data.error || "Error desconocido"],
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
    const template = `Email,Test Taker Name,Test Taker Surname,Country,Know Yourself Score,Choose Yourself Score,Give Yourself Score,Enhance Emotional Literacy Score,Recognize Patterns Score,Apply Consequential Thinking Score,Navigate Emotions Score,Engage Intrinsic Motivation Score,Excercise Optimism Score,Increase Empathy Score,Pursue Noble Goals Score,Profile
juan@example.com,Juan,García,PE,100,95,105,98,96,94,92,88,90,95,85,Analytical
maria@example.com,María,López,MX,105,100,98,100,95,92,90,95,88,100,90,Intuitive`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rowi_sei_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="p-6 space-y-6 max-w-5xl mx-auto">
      <header>
        <h1 className="text-2xl font-bold">Cargar Resultados SEI</h1>
        <p className="text-gray-500 mt-1">
          Sube los resultados de las evaluaciones SEI de Six Seconds
        </p>
      </header>

      {/* Mode Toggle */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
        <button
          onClick={() => setMode("single")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === "single"
              ? "bg-white dark:bg-gray-700 text-blue-600 shadow"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
          }`}
        >
          <User className="w-4 h-4" />
          Individual
        </button>
        <button
          onClick={() => setMode("bulk")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === "bulk"
              ? "bg-white dark:bg-gray-700 text-blue-600 shadow"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Importar CSV
        </button>
      </div>

      {/* Individual Mode */}
      {mode === "single" && (
        <section className="bg-white dark:bg-gray-800 rounded-lg border p-6 space-y-6">
          <div>
            <h2 className="font-medium mb-3">🔍 Buscar miembro</h2>
            <MemberSearch
              selectedUser={selectedUser}
              onSelect={setSelectedUser}
            />
          </div>

          {selectedUser && (
            <div className="border-t pt-6">
              <h3 className="font-medium mb-4">
                📝 Datos SEI para {selectedUser.name}
              </h3>
              <SingleMemberEqForm userId={selectedUser.id} />
            </div>
          )}
        </section>
      )}

      {/* Bulk Mode */}
      {mode === "bulk" && (
        <>
          {/* Instrucciones */}
          <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h2 className="font-medium text-blue-800 dark:text-blue-200 mb-2">📋 Instrucciones</h2>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• El CSV debe tener una columna <strong>Email</strong> para identificar al usuario</li>
              <li>• Columnas de scores: Know Yourself Score, Choose Yourself Score, Give Yourself Score</li>
              <li>• Competencias: EL, RP, ACT, NE, IM, OP, EMP, NG</li>
              <li>• Opcional: Profile (Brain Style), Country</li>
              <li>• Si el email ya existe, se creará un nuevo snapshot</li>
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
                  <p>• {result.inserted} snapshots creados</p>
                  {result.updated ? <p>• {result.updated} usuarios encontrados</p> : null}
                  {result.message && <p>• {result.message}</p>}
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
        </>
      )}
    </main>
  );
}
