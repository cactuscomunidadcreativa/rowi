export const dynamic = "force-dynamic";
import { getBaseUrl } from "@/core/utils/base-url";

export default async function NewPostPage() {
  const base = getBaseUrl();
  // Si no necesitas cargar nada al render, esto puede omitirse;
  // lo dejamos como smoke-test para evitar el placeholder roto.
  const res = await fetch(`${base}/api/posts`, { cache: "no-store" });
  const data = await res.json();

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-heading">Crear Post</h1>
      <p className="opacity-70 text-sm">
        (Smoke-test) Respuesta de <code>/api/posts</code>:
      </p>
      <pre className="rounded-xl border border-white/10 bg-white/60 dark:bg-white/5 p-4 text-sm overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </main>
  );
}
