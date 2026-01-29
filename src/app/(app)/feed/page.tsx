export const dynamic = "force-dynamic";
import Link from "next/link";
import { getBaseUrl } from "@/core/utils/base-url";
import { getI18n } from "@/lib/i18n/getI18n";

async function fetchFeed() {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/posts`, { cache: "no-store" });
  const data = await res.json();
  return data.posts as Array<{ id: string; author: { username: string }; content: string; createdAt: string }>;
}

export default async function FeedPage() {
  const posts = await fetchFeed();
  const { t } = await getI18n();

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("feed.title")}</h1>
        <Link href="/post/new" className="button button--primary">{t("feed.createPost")}</Link>
      </div>

      {posts.map((p) => (
        <article key={p.id} className="card">
          <header className="flex items-center gap-2 text-sm opacity-80">
            <Link href={`/profile/${p.author.username}`} className="font-medium">
              @{p.author.username}
            </Link>
            <span>• {new Date(p.createdAt).toLocaleString()}</span>
          </header>
          <p className="mt-2 whitespace-pre-wrap">{p.content}</p>
        </article>
      ))}

      {posts.length === 0 && (
        <p className="opacity-70">{t("feed.noPosts")} <Link className="underline" href="/post/new">{t("feed.createFirst")}</Link>.</p>
      )}
    </main>
  );
}
