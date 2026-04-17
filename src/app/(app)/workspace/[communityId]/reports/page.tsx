"use client";

import { use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, Download, Printer } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function WorkspaceReportsPage({
  params,
}: {
  params: Promise<{ communityId: string }>;
}) {
  const { communityId } = use(params);
  const { t } = useI18n();

  function printReport() {
    window.print();
  }

  return (
    <div className="min-h-screen py-6 px-4 max-w-4xl mx-auto space-y-6">
      <Link
        href={`/workspace/${communityId}`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[var(--rowi-g2)]"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("workspace.landing.overview")}
      </Link>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <FileText className="w-7 h-7 text-slate-500" />
          {t("workspace.modules.reports")}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t("workspace.reports.subtitle", "Export professional reports for clients")}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <motion.button
          onClick={() => window.open(`/workspace/${communityId}/dashboard`, "_blank")}
          whileHover={{ scale: 1.02 }}
          className="text-left bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5 hover:border-[var(--rowi-g2)] transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="font-semibold mb-1">
            {t("workspace.reports.dashboard", "Dashboard Summary")}
          </h3>
          <p className="text-sm text-gray-500">
            {t("workspace.reports.dashboardDesc", "Full dashboard view (open in new tab and print as PDF)")}
          </p>
        </motion.button>

        <motion.button
          onClick={printReport}
          whileHover={{ scale: 1.02 }}
          className="text-left bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5 hover:border-[var(--rowi-g2)] transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
            <Printer className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="font-semibold mb-1">
            {t("workspace.reports.print", "Print Current Page")}
          </h3>
          <p className="text-sm text-gray-500">
            {t("workspace.reports.printDesc", "Use browser print dialog (Cmd/Ctrl + P)")}
          </p>
        </motion.button>

        <motion.button
          onClick={async () => {
            const res = await fetch(`/api/workspaces/${communityId}/members`);
            const data = await res.json();
            const members = data.members || [];
            const csv = [
              "Name,Email,Country,BrainStyle,Role,EQ,K,C,G",
              ...members.map((m: any) =>
                [m.name, m.email, m.country, m.brainStyle, m.role, m.snapshot?.overall4 || "", m.snapshot?.K || "", m.snapshot?.C || "", m.snapshot?.G || ""].join(",")
              ),
            ].join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `workspace-${communityId}-members.csv`;
            a.click();
          }}
          whileHover={{ scale: 1.02 }}
          className="text-left bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5 hover:border-[var(--rowi-g2)] transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3">
            <Download className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="font-semibold mb-1">
            {t("workspace.reports.exportCsv", "Export members CSV")}
          </h3>
          <p className="text-sm text-gray-500">
            {t("workspace.reports.exportCsvDesc", "Download all members with SEI scores")}
          </p>
        </motion.button>
      </div>
    </div>
  );
}
