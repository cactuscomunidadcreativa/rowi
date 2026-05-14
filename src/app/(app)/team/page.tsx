"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Briefcase, ArrowRight, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

type Report = {
  id: string;
  position: string | null;
  department: string | null;
  status: string;
  hireDate: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
};

type Profile = {
  id: string;
  position: string | null;
  department: string | null;
  tenant: { id: string; name: string; slug: string } | null;
  reports: Report[];
};

type Summary = {
  totalReports: number;
  profilesWithReports: Profile[];
  allProfiles: Profile[];
};

export default function TeamPage() {
  const { t } = useI18n();
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/team/summary", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json?.error || `HTTP ${res.status}`);
        }
        setData({
          totalReports: json.totalReports,
          profilesWithReports: json.profilesWithReports,
          allProfiles: json.allProfiles,
        });
      } catch (e: any) {
        setError(e?.message || "Error cargando equipo");
      } finally {
        setLoading(false);
      }
    }
    load();
    // t is intentionally NOT a dep — it's a non-memoized function from
    // I18nProvider, so depending on it would loop. Falling back to a
    // hardcoded ES string for the error message is fine; success-path
    // strings inside the JSX still re-render through t() normally.
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen py-8 px-4 max-w-4xl mx-auto">
        <div className="flex items-center gap-2 rowi-muted">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t("common.loading", "Cargando...")}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen py-8 px-4 max-w-4xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl p-6 text-red-700">
          {error}
        </div>
      </main>
    );
  }

  if (!data) return null;

  const isManager = data.totalReports > 0;
  const hasEmployeeProfile = data.allProfiles.length > 0;

  return (
    <main className="min-h-screen py-8 px-4 max-w-5xl mx-auto space-y-6">
      <header className="rowi-card">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-6 h-6 text-indigo-500" />
          <h1 className="text-2xl font-semibold">
            {t("team.title", "Mi equipo")}
          </h1>
        </div>
        <p className="rowi-muted text-sm">
          {isManager
            ? t(
                "team.subtitle.manager",
                "Reportes directos que ruedan hacia ti, agrupados por tenant.",
              )
            : t(
                "team.subtitle.empty",
                "Aún no tienes reportes directos asignados.",
              )}
        </p>
      </header>

      {!hasEmployeeProfile && (
        <section className="rowi-card text-center py-10">
          <div className="text-5xl mb-3">🪪</div>
          <h2 className="text-lg font-medium mb-2">
            {t("team.noProfile.title", "Aún no eres empleado de ninguna organización")}
          </h2>
          <p className="rowi-muted text-sm mb-4">
            {t(
              "team.noProfile.body",
              "El módulo /team agrupa a las personas que reportan a ti dentro de un tenant. Para que aparezca algo, primero un admin debe asignarte como manager en RRHH.",
            )}
          </p>
          <Link
            href="/workspace?type=TEAM_UNIT"
            className="rowi-btn-secondary inline-flex items-center gap-1 text-sm"
          >
            {t("team.exploreWorkspaces", "Explorar workspaces de equipo")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      )}

      {hasEmployeeProfile && !isManager && (
        <section className="rowi-card text-center py-10">
          <div className="text-5xl mb-3">👥</div>
          <h2 className="text-lg font-medium mb-2">
            {t("team.empty.title", "Todavía no tienes reportes directos")}
          </h2>
          <p className="rowi-muted text-sm mb-4">
            {t(
              "team.empty.body",
              "Si esperas tener reportes, pídele al admin de RRHH que te asigne como manager.",
            )}
          </p>
          <div className="text-xs rowi-muted">
            {t("team.empty.profilesLabel", "Eres empleado en:")}{" "}
            {data.allProfiles
              .map((p) => p.tenant?.name || p.position || "—")
              .join(", ")}
          </div>
        </section>
      )}

      {isManager &&
        data.profilesWithReports.map((profile) => (
          <section key={profile.id} className="rowi-card space-y-4">
            <header className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2 text-xs rowi-muted uppercase tracking-wide mb-1">
                  <Briefcase className="w-3 h-3" />
                  {profile.tenant?.name ||
                    t("team.noTenant", "Sin tenant asignado")}
                </div>
                <h2 className="font-medium">
                  {profile.position ||
                    t("team.unknownRole", "Rol no especificado")}
                  {profile.department && (
                    <span className="rowi-muted text-sm font-normal">
                      {" · "}
                      {profile.department}
                    </span>
                  )}
                </h2>
              </div>
              <div className="text-sm rowi-muted">
                {profile.reports.length}{" "}
                {profile.reports.length === 1
                  ? t("team.reportSingular", "reporte directo")
                  : t("team.reportPlural", "reportes directos")}
              </div>
            </header>

            <div className="space-y-2">
              {profile.reports.map((rep) => (
                <div
                  key={rep.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {rep.user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={rep.user.image}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                        {(rep.user.name || rep.user.email || "?")[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {rep.user.name || rep.user.email}
                      </div>
                      <div className="text-xs rowi-muted truncate">
                        {[rep.position, rep.department]
                          .filter(Boolean)
                          .join(" · ") ||
                          rep.user.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {rep.hireDate && (
                      <span className="text-xs rowi-muted">
                        {t("team.since", "Desde")}{" "}
                        {new Date(rep.hireDate).toLocaleDateString()}
                      </span>
                    )}
                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      {rep.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
    </main>
  );
}
