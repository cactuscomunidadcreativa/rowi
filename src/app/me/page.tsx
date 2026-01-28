"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useI18n } from "@/lib/i18n/react";
import { getEqLevel, EQ_MAX } from "@/domains/eq/lib/eqLevels";

type Snapshot = {
  brainStyle?: string | null;
  K?: number | null;
  C?: number | null;
  G?: number | null;
  EL?: number | null;
  RP?: number | null;
  ACT?: number | null;
  NE?: number | null;
  IM?: number | null;
  OP?: number | null;
  EMP?: number | null;
  NG?: number | null;
};

type Member = { id: string; name: string; brainStyle?: string };

export default function MePage() {
  const { data } = useSession();
  const { t } = useI18n();
  const userName = data?.user?.name || data?.user?.email || "Usuario";

  const [sei, setSei] = useState<Snapshot | null>(null);
  const [loadingSei, setLoadingSei] = useState(true);

  const [members, setMembers] = useState<Member[]>([]);
  const [loadingComm, setLoadingComm] = useState(true);
  const [avgAffinity, setAvgAffinity] = useState<number | null>(null);

  // === Snapshot EQ ===
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/eq/me", { cache: "no-store" });
        const j = await r.json();
        if (!alive) return;
        const s: Snapshot = {
          brainStyle: j?.brain?.style ?? null,
          K: j?.eq?.pursuits?.know ?? null,
          C: j?.eq?.pursuits?.choose ?? null,
          G: j?.eq?.pursuits?.give ?? null,
          EL: j?.eq?.competencias?.EL ?? null,
          RP: j?.eq?.competencias?.RP ?? null,
          ACT: j?.eq?.competencias?.ACT ?? null,
          NE: j?.eq?.competencias?.NE ?? null,
          IM: j?.eq?.competencias?.IM ?? null,
          OP: j?.eq?.competencias?.OP ?? null,
          EMP: j?.eq?.competencias?.EMP ?? null,
          NG: j?.eq?.competencias?.NG ?? null,
        };
        setSei(s);
      } catch {
        setSei(null);
      } finally {
        setLoadingSei(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // === Comunidad ===
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/community/members", { cache: "no-store" });
        const j = await r.json();
        const list: Member[] = Array.isArray(j?.members) ? j.members : [];
        setMembers(list);

        // Afinidad promedio
        const sample = list.slice(0, 20);
        if (sample.length) {
          const heats: number[] = [];
          for (const m of sample) {
            try {
              const rr = await fetch(`/api/affinity?project=execution&memberId=${m.id}`, {
                cache: "no-store",
              });
              const jj = await rr.json();
              const h = jj?.items?.[0]?.heat;
              if (typeof h === "number") heats.push(h);
            } catch {}
          }
          if (heats.length)
            setAvgAffinity(Math.round(heats.reduce((a, b) => a + b, 0) / heats.length));
        }
      } catch {
        setMembers([]);
      } finally {
        setLoadingComm(false);
      }
    })();
  }, []);

  // === Nivel Rowi (real, con colores y escala 135) ===
  const level = useMemo(() => {
    const K = sei?.K ?? 0,
      C = sei?.C ?? 0,
      G = sei?.G ?? 0;
    const arr = [K, C, G].filter((x) => typeof x === "number") as number[];
    const avg = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    return getEqLevel(avg);
  }, [sei]);

  return (
    <main className="space-y-6">
      {/* Header */}
      <section className="rowi-card flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{userName}</h1>
          <p className="rowi-muted text-sm">{t("nav.profile") || "Mi perfil en Rowi"}</p>
        </div>
        <div className="rowi-chip text-sm" style={{ background: level.color, color: "#fff" }}>
          {t(`rowi.level.${level.key}`) || level.label}
        </div>
      </section>

      {/* Snapshot EQ */}
      <section className="rowi-card grid gap-4 md:grid-cols-3">
        <div className="md:col-span-1">
          <h2 className="text-lg font-semibold">EQ (Six Seconds)</h2>
          <p className="rowi-muted text-sm">
            Brain: <b>{sei?.brainStyle ?? "—"}</b>
          </p>
          <p className="rowi-muted text-sm">K / C / G</p>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <Pill label="K" v={sei?.K} />
            <Pill label="C" v={sei?.C} />
            <Pill label="G" v={sei?.G} />
          </div>
        </div>

        {/* Competencias */}
        <div className="md:col-span-2">
          <h3 className="font-medium">Competencias (0–135)</h3>
          <div className="mt-2 grid grid-cols-4 gap-2">
            <MiniBar label="EL" v={sei?.EL} />
            <MiniBar label="RP" v={sei?.RP} />
            <MiniBar label="ACT" v={sei?.ACT} />
            <MiniBar label="NE" v={sei?.NE} />
            <MiniBar label="IM" v={sei?.IM} />
            <MiniBar label="OP" v={sei?.OP} />
            <MiniBar label="EMP" v={sei?.EMP} />
            <MiniBar label="NG" v={sei?.NG} />
          </div>
        </div>
      </section>

      {/* Comunidad */}
      <section className="rowi-card grid gap-3 md:grid-cols-3">
        <div className="md:col-span-1">
          <h2 className="font-medium">{t("community.title") || "Mi comunidad"}</h2>
          {loadingComm ? (
            <div className="rowi-muted text-sm">{t("status.loading") || "Cargando…"} </div>
          ) : (
            <div className="space-y-1 text-sm">
              <div>
                {t("community.subtitle.real")}: <b>{members.length}</b>
              </div>
              <div>
                Con SEI: <b>{members.filter((m) => !!m.brainStyle).length}</b>
              </div>
              <div>
                Afinidad promedio: <b>{avgAffinity ?? "—"}{typeof avgAffinity === "number" ? "%" : ""}</b>
              </div>
            </div>
          )}
        </div>
        <div className="md:col-span-2">
          <div className="grid sm:grid-cols-2 gap-2">
            <Action href="/community" title={t("community.title")} desc="Explorar miembros y afinidad" />
            <Action href="/settings/invites" title={t("nav.profile.invites")} desc="Enviar invitaciones" />
            <Action href="/eco" title="ECO" desc="Mensajes por canal" />
            <Action href="/rowi" title="Rowi Coach" desc="Conversar con Rowi" />
          </div>
        </div>
      </section>
    </main>
  );
}

// === Helpers ===
function clamp135(x: number) {
  return Math.max(0, Math.min(135, x));
}

function Pill({ label, v }: { label: string; v: number | null | undefined }) {
  const vv = v ?? 0;
  return (
    <div className="rowi-card text-center py-2">
      <div className="text-xs rowi-muted">{label}</div>
      <div className="text-lg font-semibold">
        {Math.round(vv)} <span className="text-xs text-gray-400">/135</span>
      </div>
    </div>
  );
}

function MiniBar({ label, v }: { label: string; v: number | null | undefined }) {
  const vv = clamp135(Math.round(v ?? 0));
  const widthPercent = (vv / EQ_MAX) * 100;
  return (
    <div>
      <div className="text-xs rowi-muted flex justify-between">
        <span>{label}</span>
        <span className="text-gray-400">{vv}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-800/50 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${widthPercent}%`,
            background: "linear-gradient(90deg,var(--rowi-g1),var(--rowi-g2),var(--rowi-g3))",
          }}
        />
      </div>
    </div>
  );
}

function Action({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href} className="rowi-card">
      <div className="font-medium">{title}</div>
      <div className="rowi-muted text-sm">{desc}</div>
    </Link>
  );
}