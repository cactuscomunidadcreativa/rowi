"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, FileSpreadsheet, Check, Loader2, AlertCircle, Download } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function UploadCsvPage({
  params,
}: {
  params: Promise<{ communityId: string }>;
}) {
  const { communityId } = use(params);
  const { t } = useI18n();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/workspaces/${communityId}/upload-csv`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  const TEMPLATE_CSV = `First Name,Last Name,Email,Country,K,C,G,EL,RP,ACT,NE,IM,OP,EMP,NG,Overall4,Brain Style
Maria,Gonzalez,maria@example.com,Mexico,95,102,108,98,105,100,110,105,112,108,110,105,Empatico
John,Smith,john@example.com,USA,110,115,105,112,108,118,105,120,108,102,100,108,Cientifico`;

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rowi-members-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen py-6 px-4 max-w-3xl mx-auto">
      <Link
        href={`/workspace/${communityId}/members`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[var(--rowi-g2)] mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("workspace.modules.members")}
      </Link>

      <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 mb-2">
        <Upload className="w-7 h-7 text-[var(--rowi-g2)]" />
        {t("workspace.members.uploadCsv", "Upload CSV")}
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        {t("workspace.members.upload.description", "Bulk upload members with their SEI scores. 20+ members auto-creates a Benchmark.")}
      </p>

      {!result ? (
        <>
          {/* Template download */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                {t("workspace.members.upload.templateTitle", "Need a template?")}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                {t("workspace.members.upload.templateDesc", "Download a sample CSV with the correct columns")}
              </p>
            </div>
            <button
              onClick={downloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-zinc-900 rounded-lg text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
          </div>

          {/* File picker */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border-2 border-dashed border-gray-300 dark:border-zinc-700 p-8 text-center mb-4">
            {file ? (
              <div>
                <FileSpreadsheet className="w-12 h-12 text-[var(--rowi-g2)] mx-auto mb-3" />
                <p className="font-medium">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                <button
                  onClick={() => setFile(null)}
                  className="mt-3 text-xs text-gray-500 hover:text-red-500"
                >
                  {t("workspace.members.upload.clear", "Clear")}
                </button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="font-medium">
                  {t("workspace.members.upload.dropFile", "Select a CSV file")}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {t("workspace.members.upload.supportedCols", "Columns: Name, Email, Country, K/C/G, EL/RP/ACT/NE/IM/OP/EMP/NG, Brain Style...")}
                </p>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full py-3 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("workspace.members.upload.uploading", "Uploading...")}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                {t("workspace.members.upload.submit", "Upload members")}
              </>
            )}
          </button>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6"
        >
          <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <Check className="w-7 h-7 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-center mb-2">
            {t("workspace.members.upload.done", "Upload complete!")}
          </h2>
          <div className="grid grid-cols-3 gap-2 my-4">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
              <p className="text-xs text-green-700 dark:text-green-400 uppercase">
                {t("workspace.members.upload.created", "Created")}
              </p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                {result.created}
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
              <p className="text-xs text-blue-700 dark:text-blue-400 uppercase">
                {t("workspace.members.upload.updated", "Updated")}
              </p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                {result.updated}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-600 uppercase">
                {t("workspace.members.upload.errors", "Errors")}
              </p>
              <p className="text-2xl font-bold text-gray-600">{result.errors}</p>
            </div>
          </div>
          {result.autoBenchmarkId && (
            <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-3 text-sm text-violet-700 dark:text-violet-300 text-center">
              ✨ {t("workspace.members.upload.benchmarkCreated", "Auto-created a benchmark for this workspace!")}
            </div>
          )}
          <button
            onClick={() => router.push(`/workspace/${communityId}/members`)}
            className="mt-4 w-full py-2.5 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white font-semibold rounded-xl"
          >
            {t("workspace.members.upload.viewMembers", "View members")}
          </button>
        </motion.div>
      )}
    </div>
  );
}
