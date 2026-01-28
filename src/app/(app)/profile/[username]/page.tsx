import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";

type BrainStyle = "Analítico" | "Creativo" | "Práctico" | "Empático";
type CommTone = "Directo" | "Empático" | "Detallado" | "Breve" | "Visual" | "Inspirador";

type Profile = {
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  progress?: number; // 0-100
  brainStyle?: BrainStyle;
  // nuevos
  commTonePrimary?: CommTone | "";
  commToneSecondary?: CommTone | "";
  locationCity?: string;
  locationCountry?: string;
};

type Invite = {
  token: string;
  contact: string;
  kind: "email" | "phone";
  inviterEmail: string;
  createdAt: string;
  acceptedAt?: string | null;
};

type Post = {
  id: string;
  author: { email: string; username: string; name?: string; image?: string };
  content: string;
  createdAt: string;
};

// Helpers de filesystem
const ROOT = process.cwd();
const PROFILES = path.join(ROOT, "src", "data", "profiles.json");
const INVITES = path.join(ROOT, "src", "data", "invites.json");
const FEED = path.join(ROOT, "src", "data", "feed.json");

async function readJSON<T>(file: string, fallback: T): Promise<T> {
  const txt = await fs.readFile(file, "utf8").catch(() => "");
  try {
    return (txt ? JSON.parse(txt) : fallback) as T;
  } catch {
    return fallback;
  }
}

function dicebearAvatar(username: string, progress: number | undefined) {
  const seed = encodeURIComponent(`${username}-${progress ?? 0}`);
  return `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${seed}&radius=50`;
}

function pct(n: number | undefined) {
  const v = Math.max(0, Math.min(100, Number(n ?? 0)));
  return v;
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params; // App Router v15: params es async

  // 1) Perfil
  const profiles = await readJSON<Record<string, Profile>>(PROFILES, {});
  const profile = profiles[username];

  if (!profile) {
    return (
      <main className="p-6 space-y-4">
        <h1 className="text-2xl font-heading">Perfil no encontrado</h1>
        <p className="opacity-70">El usuario <strong>@{username}</strong> no existe todavía.</p>
        <Link href="/" className="underline">Volver al inicio</Link>
      </main>
    );
  }

  // 2) Invitaciones enviadas por este usuario
  const allInvites = await readJSON<Invite[]>(INVITES, []);
  const sent = allInvites.filter((i) => i.inviterEmail === profile.email);
  const pending = sent.filter((i) => !i.acceptedAt);
  const accepted = sent.filter((i) => !!i.acceptedAt);

  // 3) Posts de este usuario
  const allPosts = await readJSON<Post[]>(FEED, []);
  const myPosts = allPosts
    .filter((p) => p.author?.username === profile.username)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const progress = pct(profile.progress);
  const avatar = dicebearAvatar(profile.username, profile.progress);
  const fullName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.username;

  return (
    <main className="p-6 space-y-8 max-w-4xl">
      {/* Header */}
      <section className="card">
        <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
          {/* Avatar Rowi (no usamos foto real) */}
          <div className="w-[110px]">
            <div className="w-[110px] h-[110px] rounded-2xl overflow-hidden border border-white/10 bg-white/60 dark:bg-white/5 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatar} alt="Rowi Avatar" className="w-full h-full object-cover" />
            </div>
            <div className="mt-2 h-2.5 w-full rounded-full bg-white/30 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progress}%`,
                  background:
                    "linear-gradient(90deg, var(--color-rowi-blue), var(--color-rowi-pink))",
                }}
                aria-label={`Progreso ${progress}%`}
                title={`Progreso ${progress}%`}
              />
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <h1 className="text-2xl font-heading">{fullName}</h1>
            <div className="text-sm opacity-80">@{profile.username}</div>

            {(profile.locationCity || profile.locationCountry) && (
              <div className="text-sm opacity-80">
                {profile.locationCity || "—"}
                {profile.locationCity && profile.locationCountry ? ", " : ""}
                {profile.locationCountry || ""}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Datos de perfil (estilo + tonos) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="text-sm opacity-70">Estilo cerebral</div>
          <div className="text-base mt-1">{profile.brainStyle || "—"}</div>
        </div>

        <div className="card">
          <div className="text-sm opacity-70">Cómo te comunicas (Primario)</div>
          <div className="text-base mt-1">{profile.commTonePrimary || "—"}</div>
        </div>

        <div className="card">
          <div className="text-sm opacity-70">Cómo prefieres que te comuniquen (Secundario)</div>
          <div className="text-base mt-1">{profile.commToneSecondary || "—"}</div>
        </div>
      </section>

      {/* Invitaciones enviadas */}
      <section className="card">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Invitaciones enviadas</h2>
          <div className="text-sm opacity-70">
            Total: {sent.length} · Pendientes: {pending.length} · Aceptadas: {accepted.length}
          </div>
        </div>

        {sent.length === 0 ? (
          <p className="mt-3 opacity-70 text-sm">Aún no has enviado invitaciones.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {sent.map((inv) => (
              <div
                key={inv.token}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/60 dark:bg-white/5 p-3"
              >
                <div className="text-sm">
                  <div className="font-medium">
                    {inv.kind === "email" ? inv.contact : `+${inv.contact}`}
                  </div>
                  <div className="opacity-70">
                    Enviada: {new Date(inv.createdAt).toLocaleString()}
                  </div>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs ${
                    inv.acceptedAt
                      ? "bg-green-600/80 text-white"
                      : "bg-yellow-500/80 text-black"
                  }`}
                  title={
                    inv.acceptedAt
                      ? `Aceptada: ${new Date(inv.acceptedAt).toLocaleString()}`
                      : "Pendiente"
                  }
                >
                  {inv.acceptedAt ? "Aceptada" : "Pendiente"}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Posts */}
      <section className="card">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Posts</h2>
          <Link href="/post/new" className="button button--primary text-xs">
            Crear post
          </Link>
        </div>

        {myPosts.length === 0 ? (
          <p className="mt-3 opacity-70 text-sm">
            No hay posts aún. <Link className="underline" href="/post/new">Crea el primero</Link>.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {myPosts.map((p) => (
              <article key={p.id} className="rounded-2xl border border-white/10 bg-white/60 dark:bg-white/5 p-4">
                <header className="flex items-center gap-2 text-sm opacity-80">
                  <span className="font-medium">@{p.author.username}</span>
                  <span>• {new Date(p.createdAt).toLocaleString()}</span>
                </header>
                <p className="mt-2 whitespace-pre-wrap">{p.content}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}