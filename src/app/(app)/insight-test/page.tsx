export const dynamic = "force-dynamic";
import Link from "next/link";
import { getBaseUrl } from "@/core/utils/base-url";

export default async function InsightTestPage() {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/insight`, { cache: "no-store" });
  const data = await res.json();

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-heading">Insight Test</h1>
      <pre className="rounded-xl border border-white/10 bg-white/60 dark:bg-white/5 p-4 text-sm overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </main>
  );
}
