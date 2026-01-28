"use client";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/react"; // usa tu hook existente

export default function HomePage() {
  const { t } = useI18n();

  return (
    <main className="relative min-h-screen bg-background text-foreground transition-colors">
      {/* halo sutil */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-40">
        <div
          className="absolute left-1/2 top-[-10%] h-[40rem] w-[40rem] -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side,rgba(215,151,207,0.25),rgba(49,162,227,0.25),transparent)",
          }}
        />
      </div>

      <section className="mx-auto max-w-3xl text-center pt-20">
        <h1 className="bg-gradient-to-r from-[#d797cf] to-[#31a2e3] bg-clip-text text-4xl font-bold text-transparent">
          Rowi SIA
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          {t("home.subtitle") ||
            "Conversa con Rowi, explora tu IE y conecta mejor con tu comunidad."}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/rowi"
            className="rounded-full px-4 py-2 text-sm text-white"
            style={{
              background:
                "linear-gradient(90deg, var(--rowiPink, #d797cf), var(--rowiBlue, #31a2e3))",
            }}
          >
            {t("home.coach") || "Hablar con Rowi Coach"}
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full border border-border bg-card px-4 py-2 text-sm hover:bg-card/80 transition"
          >
            {t("home.dashboard") || "Ir al Dashboard"}
          </Link>
          <Link
            href="/community"
            className="rounded-full border border-border bg-card px-4 py-2 text-sm hover:bg-card/80 transition"
          >
            {t("home.community") || "Comunidad"}
          </Link>
        </div>
      </section>

      <section className="mx-auto mt-10 grid gap-4 md:grid-cols-3 max-w-5xl px-4">
        <Card
          title={t("home.ie_title") || "IE (Six Seconds)"}
          desc={t("home.ie_desc") || "K/C/G, competencias, talentos y factores."}
          href="/dashboard"
        />
        <Card
          title={t("home.affinity_title") || "Afinidad"}
          desc={t("home.affinity_desc") || "Planes y guiones para relacionarte mejor."}
          href="/affinity"
        />
        <Card
          title={t("home.eco_title") || "ECO"}
          desc={t("home.eco_desc") || "WhatsApp, email, 1:1 o speech—con buen tono."}
          href="/eco"
        />
      </section>

      <footer className="mt-16 text-center text-xs text-gray-500 pb-4">
        © {new Date().getFullYear()} Rowi SIA — Emotional Intelligence Platform
      </footer>
    </main>
  );
}

function Card({ title, desc, href }: { title: string; desc: string; href: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-accent hover:bg-accent/10"
    >
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
    </Link>
  );
}