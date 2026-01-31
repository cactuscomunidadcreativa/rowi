"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Target,
  RefreshCcw,
  Plus,
  Search,
  Loader2,
  DollarSign,
  User,
  Calendar,
  MoreVertical,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

interface Opportunity {
  id: string;
  name: string;
  company: string;
  contact: string;
  email: string;
  value: number;
  stage: "lead" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
  probability: number;
  expectedClose: string;
  createdAt: string;
}

const DEFAULT_OPPORTUNITIES: Opportunity[] = [
  { id: "1", name: "Implementación Enterprise", company: "TechCorp S.A.", contact: "Roberto Méndez", email: "roberto@techcorp.com", value: 15000, stage: "proposal", probability: 60, expectedClose: new Date(Date.now() + 86400000 * 30).toISOString(), createdAt: new Date(Date.now() - 86400000 * 20).toISOString() },
  { id: "2", name: "Licencias Team Pro", company: "Innovatech", contact: "Lucía Fernández", email: "lucia@innovatech.com", value: 5000, stage: "negotiation", probability: 80, expectedClose: new Date(Date.now() + 86400000 * 15).toISOString(), createdAt: new Date(Date.now() - 86400000 * 45).toISOString() },
  { id: "3", name: "Consultoría EQ", company: "HR Solutions", contact: "Miguel Ángel Torres", email: "miguel@hrsolutions.com", value: 8000, stage: "qualified", probability: 40, expectedClose: new Date(Date.now() + 86400000 * 60).toISOString(), createdAt: new Date(Date.now() - 86400000 * 10).toISOString() },
  { id: "4", name: "Expansión Regional", company: "Global Retail", contact: "Andrea Paredes", email: "andrea@globalretail.com", value: 25000, stage: "lead", probability: 20, expectedClose: new Date(Date.now() + 86400000 * 90).toISOString(), createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: "5", name: "Renovación Anual", company: "FinanceGroup", contact: "Carlos Vega", email: "cvega@financegroup.com", value: 12000, stage: "won", probability: 100, expectedClose: new Date(Date.now() - 86400000 * 10).toISOString(), createdAt: new Date(Date.now() - 86400000 * 60).toISOString() },
];

const STAGE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  lead: { label: "Lead", color: "text-gray-500", bg: "bg-gray-500/20" },
  qualified: { label: "Calificado", color: "text-blue-500", bg: "bg-blue-500/20" },
  proposal: { label: "Propuesta", color: "text-purple-500", bg: "bg-purple-500/20" },
  negotiation: { label: "Negociación", color: "text-amber-500", bg: "bg-amber-500/20" },
  won: { label: "Ganada", color: "text-green-500", bg: "bg-green-500/20" },
  lost: { label: "Perdida", color: "text-red-500", bg: "bg-red-500/20" },
};

export default function OpportunitiesPage() {
  const { t } = useI18n();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadOpportunities();
  }, []);

  async function loadOpportunities() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sales/opportunities");
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data.opportunities || DEFAULT_OPPORTUNITIES);
      } else {
        setOpportunities(DEFAULT_OPPORTUNITIES);
      }
    } catch {
      setOpportunities(DEFAULT_OPPORTUNITIES);
    } finally {
      setLoading(false);
    }
  }

  const filteredOpportunities = opportunities.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase()) || o.company.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: opportunities.length,
    pipeline: opportunities.filter((o) => !["won", "lost"].includes(o.stage)).reduce((sum, o) => sum + o.value, 0),
    won: opportunities.filter((o) => o.stage === "won").reduce((sum, o) => sum + o.value, 0),
    avgProbability: opportunities.filter((o) => !["won", "lost"].includes(o.stage)).reduce((sum, o, _, arr) => sum + o.probability / arr.length, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--rowi-foreground)] flex items-center gap-2">
            <Target className="w-7 h-7 text-purple-500" />
            {t("admin.sales.opportunities.title")}
          </h1>
          <p className="text-[var(--rowi-muted)] mt-1">{t("admin.sales.opportunities.description")}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => loadOpportunities()} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-card)] hover:bg-[var(--rowi-muted)]/10 transition-colors disabled:opacity-50">
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-primary)] text-white hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            {t("admin.sales.opportunities.new")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-[var(--rowi-muted)] mb-2"><Target className="w-4 h-4" /><span className="text-xs">{t("admin.sales.opportunities.stats.total")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.total}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-2"><DollarSign className="w-4 h-4" /><span className="text-xs">{t("admin.sales.opportunities.stats.pipeline")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">${stats.pipeline.toLocaleString()}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-green-500 mb-2"><CheckCircle className="w-4 h-4" /><span className="text-xs">{t("admin.sales.opportunities.stats.won")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">${stats.won.toLocaleString()}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-purple-500 mb-2"><TrendingUp className="w-4 h-4" /><span className="text-xs">{t("admin.sales.opportunities.stats.avgProbability")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.avgProbability.toFixed(0)}%</p>
        </div>
      </div>

      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rowi-muted)]" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("admin.sales.opportunities.search")} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-muted)]" /></div>
      ) : (
        <div className="space-y-4">
          {filteredOpportunities.map((opp) => {
            const stageInfo = STAGE_CONFIG[opp.stage];
            return (
              <div key={opp.id} className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-[var(--rowi-foreground)]">{opp.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${stageInfo.bg} ${stageInfo.color}`}>{stageInfo.label}</span>
                    </div>
                    <p className="text-sm text-[var(--rowi-muted)] mb-3">{opp.company} • {opp.contact}</p>
                    <div className="flex items-center gap-6 text-sm">
                      <span className="flex items-center gap-1 text-[var(--rowi-foreground)]"><DollarSign className="w-4 h-4" />${opp.value.toLocaleString()}</span>
                      <span className="flex items-center gap-1 text-[var(--rowi-muted)]"><TrendingUp className="w-4 h-4" />{opp.probability}%</span>
                      <span className="flex items-center gap-1 text-[var(--rowi-muted)]"><Calendar className="w-4 h-4" />{new Date(opp.expectedClose).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button className="p-2 rounded-lg hover:bg-[var(--rowi-muted)]/10"><MoreVertical className="w-4 h-4 text-[var(--rowi-muted)]" /></button>
                </div>
                <div className="mt-4 h-2 bg-[var(--rowi-muted)]/20 rounded-full overflow-hidden">
                  <div className={`h-full ${stageInfo.color.replace("text-", "bg-")}`} style={{ width: `${opp.probability}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
