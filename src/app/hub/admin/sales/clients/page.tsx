"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  RefreshCcw,
  Plus,
  Search,
  Loader2,
  Users,
  DollarSign,
  Calendar,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  Globe,
  Star,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  industry: string;
  country: string;
  totalSpent: number;
  subscriptionCount: number;
  rating: number;
  createdAt: string;
  lastActivity: string;
}

export default function ClientsPage() {
  const { t } = useI18n();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sales/clients");
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      } else {
        setClients([]);
      }
    } catch {
      setClients([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: clients.length,
    totalRevenue: clients.reduce((sum, c) => sum + c.totalSpent, 0),
    avgRevenue: clients.length > 0 ? clients.reduce((sum, c) => sum + c.totalSpent, 0) / clients.length : 0,
    avgRating: clients.length > 0 ? clients.reduce((sum, c) => sum + c.rating, 0) / clients.length : 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--rowi-foreground)] flex items-center gap-2">
            <Building2 className="w-7 h-7 text-blue-500" />
            {t("admin.sales.clients.title")}
          </h1>
          <p className="text-[var(--rowi-muted)] mt-1">{t("admin.sales.clients.description")}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => loadClients()} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-card)] hover:bg-[var(--rowi-muted)]/10 transition-colors disabled:opacity-50">
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-primary)] text-white hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            {t("admin.sales.clients.new")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-[var(--rowi-muted)] mb-2"><Building2 className="w-4 h-4" /><span className="text-xs">{t("admin.sales.clients.stats.total")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.total}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-green-500 mb-2"><DollarSign className="w-4 h-4" /><span className="text-xs">{t("admin.sales.clients.stats.totalRevenue")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">${stats.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-2"><DollarSign className="w-4 h-4" /><span className="text-xs">{t("admin.sales.clients.stats.avgRevenue")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">${stats.avgRevenue.toFixed(0)}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-amber-500 mb-2"><Star className="w-4 h-4" /><span className="text-xs">{t("admin.sales.clients.stats.avgRating")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.avgRating.toFixed(1)}</p>
        </div>
      </div>

      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rowi-muted)]" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("admin.sales.clients.search")} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-muted)]" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <div key={client.id} className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--rowi-foreground)]">{client.name}</h3>
                    <p className="text-xs text-[var(--rowi-muted)]">{client.industry}</p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < client.rating ? "text-amber-500 fill-amber-500" : "text-[var(--rowi-muted)]"}`} />
                  ))}
                </div>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center gap-2 text-[var(--rowi-muted)]"><Mail className="w-4 h-4" />{client.email}</div>
                <div className="flex items-center gap-2 text-[var(--rowi-muted)]"><MapPin className="w-4 h-4" />{client.country}</div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[var(--rowi-border)]">
                <div>
                  <p className="text-xs text-[var(--rowi-muted)]">{t("admin.sales.clients.totalSpent")}</p>
                  <p className="font-bold text-[var(--rowi-foreground)]">${client.totalSpent.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--rowi-muted)]">{t("admin.sales.clients.subscriptions")}</p>
                  <p className="font-bold text-[var(--rowi-foreground)]">{client.subscriptionCount}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
