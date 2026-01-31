"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Package,
  RefreshCcw,
  Plus,
  Search,
  Loader2,
  DollarSign,
  Users,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Tag,
  Zap,
  Crown,
  Star,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: "month" | "year" | "one_time";
  currency: string;
  isActive: boolean;
  features: string[];
  subscriberCount: number;
  totalRevenue: number;
  createdAt: string;
}

const DEFAULT_PRODUCTS: Product[] = [
  { id: "1", name: "Basic", description: "Para individuos que comienzan", price: 9, interval: "month", currency: "USD", isActive: true, features: ["1 usuario", "Funciones básicas", "Soporte por email"], subscriberCount: 45, totalRevenue: 4050, createdAt: new Date(Date.now() - 86400000 * 365).toISOString() },
  { id: "2", name: "Pro", description: "Para profesionales y equipos pequeños", price: 29, interval: "month", currency: "USD", isActive: true, features: ["Hasta 10 usuarios", "Todas las funciones", "Soporte prioritario", "Analytics avanzados"], subscriberCount: 128, totalRevenue: 44544, createdAt: new Date(Date.now() - 86400000 * 300).toISOString() },
  { id: "3", name: "Enterprise", description: "Para grandes organizaciones", price: 99, interval: "month", currency: "USD", isActive: true, features: ["Usuarios ilimitados", "API access", "Soporte 24/7", "Custom integrations", "SLA garantizado"], subscriberCount: 23, totalRevenue: 27324, createdAt: new Date(Date.now() - 86400000 * 200).toISOString() },
  { id: "4", name: "Pro Anual", description: "Pro con descuento anual", price: 290, interval: "year", currency: "USD", isActive: true, features: ["Igual que Pro", "2 meses gratis"], subscriberCount: 34, totalRevenue: 9860, createdAt: new Date(Date.now() - 86400000 * 180).toISOString() },
  { id: "5", name: "Consultoría EQ", description: "Servicio de consultoría one-time", price: 500, interval: "one_time", currency: "USD", isActive: false, features: ["Sesión personalizada", "Informe detallado", "Plan de acción"], subscriberCount: 12, totalRevenue: 6000, createdAt: new Date(Date.now() - 86400000 * 150).toISOString() },
];

const PRODUCT_ICONS: Record<string, any> = {
  Basic: Star,
  Pro: Zap,
  Enterprise: Crown,
};

export default function ProductsPage() {
  const { t } = useI18n();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sales/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || DEFAULT_PRODUCTS);
      } else {
        setProducts(DEFAULT_PRODUCTS);
      }
    } catch {
      setProducts(DEFAULT_PRODUCTS);
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: products.length,
    active: products.filter((p) => p.isActive).length,
    totalRevenue: products.reduce((sum, p) => sum + p.totalRevenue, 0),
    totalSubscribers: products.reduce((sum, p) => sum + p.subscriberCount, 0),
  };

  const toggleProductStatus = (id: string) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p)));
    toast.success(t("admin.sales.products.statusUpdated"));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--rowi-foreground)] flex items-center gap-2">
            <Package className="w-7 h-7 text-amber-500" />
            {t("admin.sales.products.title")}
          </h1>
          <p className="text-[var(--rowi-muted)] mt-1">{t("admin.sales.products.description")}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => loadProducts()} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-card)] hover:bg-[var(--rowi-muted)]/10 transition-colors disabled:opacity-50">
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-primary)] text-white hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            {t("admin.sales.products.new")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-[var(--rowi-muted)] mb-2"><Package className="w-4 h-4" /><span className="text-xs">{t("admin.sales.products.stats.total")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.total}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-green-500 mb-2"><Eye className="w-4 h-4" /><span className="text-xs">{t("admin.sales.products.stats.active")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.active}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-2"><DollarSign className="w-4 h-4" /><span className="text-xs">{t("admin.sales.products.stats.revenue")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">${stats.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-purple-500 mb-2"><Users className="w-4 h-4" /><span className="text-xs">{t("admin.sales.products.stats.subscribers")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.totalSubscribers}</p>
        </div>
      </div>

      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rowi-muted)]" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("admin.sales.products.search")} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-muted)]" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const Icon = PRODUCT_ICONS[product.name] || Package;
            return (
              <div key={product.id} className={`bg-[var(--rowi-card)] rounded-xl border transition-all ${product.isActive ? "border-[var(--rowi-border)]" : "border-[var(--rowi-border)] opacity-60"}`}>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${product.isActive ? "bg-amber-500/10" : "bg-[var(--rowi-muted)]/10"}`}>
                        <Icon className={`w-6 h-6 ${product.isActive ? "text-amber-500" : "text-[var(--rowi-muted)]"}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[var(--rowi-foreground)]">{product.name}</h3>
                        <p className="text-xs text-[var(--rowi-muted)]">{product.description}</p>
                      </div>
                    </div>
                    <button onClick={() => toggleProductStatus(product.id)} className={`p-1 rounded ${product.isActive ? "text-green-500" : "text-[var(--rowi-muted)]"}`}>
                      {product.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-bold text-[var(--rowi-foreground)]">${product.price}</span>
                    <span className="text-[var(--rowi-muted)]">/{product.interval === "month" ? "mes" : product.interval === "year" ? "año" : "único"}</span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {product.features.slice(0, 3).map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-[var(--rowi-muted)]">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--rowi-primary)]" />
                        {feature}
                      </div>
                    ))}
                    {product.features.length > 3 && (
                      <p className="text-xs text-[var(--rowi-muted)]">+{product.features.length - 3} más</p>
                    )}
                  </div>
                </div>

                <div className="px-5 py-3 border-t border-[var(--rowi-border)] bg-[var(--rowi-muted)]/5 flex items-center justify-between text-xs">
                  <span className="text-[var(--rowi-muted)]">{product.subscriberCount} suscriptores</span>
                  <span className="text-green-500 font-medium">${product.totalRevenue.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
