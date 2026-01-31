"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ClipboardList,
  RefreshCcw,
  Plus,
  Search,
  Loader2,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  MoreVertical,
  Download,
  Eye,
  Calendar,
  Package,
  Truck,
  Send,
  FileText,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

interface SalesOrder {
  id: string;
  number: string;
  customerName: string;
  customerEmail: string;
  items: number;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  status: "draft" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  orderDate: string;
  shippedDate?: string;
  deliveredDate?: string;
  invoiceNumber?: string;
}

const DEFAULT_ORDERS: SalesOrder[] = [
  { id: "1", number: "SO-2024-001", customerName: "TechCorp S.A.", customerEmail: "compras@techcorp.com", items: 3, subtotal: 4500, tax: 720, total: 5220, currency: "USD", status: "delivered", orderDate: new Date(Date.now() - 86400000 * 25).toISOString(), shippedDate: new Date(Date.now() - 86400000 * 20).toISOString(), deliveredDate: new Date(Date.now() - 86400000 * 15).toISOString(), invoiceNumber: "FAC-2024-001" },
  { id: "2", number: "SO-2024-002", customerName: "Innovatech", customerEmail: "orders@innovatech.com", items: 2, subtotal: 2800, tax: 448, total: 3248, currency: "USD", status: "shipped", orderDate: new Date(Date.now() - 86400000 * 10).toISOString(), shippedDate: new Date(Date.now() - 86400000 * 5).toISOString(), invoiceNumber: "FAC-2024-002" },
  { id: "3", number: "SO-2024-003", customerName: "HR Solutions", customerEmail: "purchasing@hrsolutions.com", items: 1, subtotal: 1500, tax: 240, total: 1740, currency: "USD", status: "processing", orderDate: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: "4", number: "SO-2024-004", customerName: "Global Retail", customerEmail: "orders@globalretail.com", items: 5, subtotal: 6200, tax: 992, total: 7192, currency: "USD", status: "confirmed", orderDate: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: "5", number: "SO-2024-005", customerName: "FinanceGroup", customerEmail: "compras@financegroup.com", items: 2, subtotal: 3500, tax: 560, total: 4060, currency: "USD", status: "draft", orderDate: new Date().toISOString() },
  { id: "6", number: "SO-2024-006", customerName: "Startup Labs", customerEmail: "admin@startuplabs.com", items: 4, subtotal: 2100, tax: 336, total: 2436, currency: "USD", status: "cancelled", orderDate: new Date(Date.now() - 86400000 * 15).toISOString() },
];

const STATUS_CONFIG = {
  draft: { label: "Borrador", color: "bg-gray-500/20 text-gray-500", icon: FileText },
  confirmed: { label: "Confirmada", color: "bg-blue-500/20 text-blue-500", icon: CheckCircle },
  processing: { label: "En Proceso", color: "bg-purple-500/20 text-purple-500", icon: Clock },
  shipped: { label: "Enviada", color: "bg-amber-500/20 text-amber-500", icon: Truck },
  delivered: { label: "Entregada", color: "bg-green-500/20 text-green-500", icon: Package },
  cancelled: { label: "Cancelada", color: "bg-red-500/20 text-red-500", icon: XCircle },
};

export default function SalesOrdersPage() {
  const { t } = useI18n();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/accounting/sales-orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || DEFAULT_ORDERS);
      } else {
        setOrders(DEFAULT_ORDERS);
      }
    } catch {
      setOrders(DEFAULT_ORDERS);
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders = orders.filter((o) => {
    const matchesSearch = o.number.toLowerCase().includes(search.toLowerCase()) || o.customerName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "confirmed" || o.status === "processing").length,
    pendingAmount: orders.filter((o) => o.status === "confirmed" || o.status === "processing").reduce((sum, o) => sum + o.total, 0),
    delivered: orders.filter((o) => o.status === "delivered").reduce((sum, o) => sum + o.total, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--rowi-foreground)] flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-cyan-500" />
            {t("admin.accounting.salesOrders.title")}
          </h1>
          <p className="text-[var(--rowi-muted)] mt-1">{t("admin.accounting.salesOrders.description")}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => loadOrders()} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-card)] hover:bg-[var(--rowi-muted)]/10 transition-colors disabled:opacity-50">
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-primary)] text-white hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            {t("admin.accounting.salesOrders.new")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-[var(--rowi-muted)] mb-2"><ClipboardList className="w-4 h-4" /><span className="text-xs">{t("admin.accounting.salesOrders.stats.total")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.total}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-amber-500 mb-2"><Clock className="w-4 h-4" /><span className="text-xs">{t("admin.accounting.salesOrders.stats.pending")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.pending}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-2"><DollarSign className="w-4 h-4" /><span className="text-xs">{t("admin.accounting.salesOrders.stats.pendingAmount")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">${stats.pendingAmount.toLocaleString()}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-green-500 mb-2"><Package className="w-4 h-4" /><span className="text-xs">{t("admin.accounting.salesOrders.stats.delivered")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">${stats.delivered.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rowi-muted)]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("admin.accounting.salesOrders.search")} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none">
          <option value="all">{t("admin.accounting.salesOrders.allStatus")}</option>
          <option value="draft">{t("admin.accounting.salesOrders.statusDraft")}</option>
          <option value="confirmed">{t("admin.accounting.salesOrders.statusConfirmed")}</option>
          <option value="processing">{t("admin.accounting.salesOrders.statusProcessing")}</option>
          <option value="shipped">{t("admin.accounting.salesOrders.statusShipped")}</option>
          <option value="delivered">{t("admin.accounting.salesOrders.statusDelivered")}</option>
          <option value="cancelled">{t("admin.accounting.salesOrders.statusCancelled")}</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-muted)]" /></div>
      ) : (
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--rowi-muted)]/5 border-b border-[var(--rowi-border)]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.accounting.salesOrders.number")}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.accounting.salesOrders.customer")}</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.accounting.salesOrders.total")}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.accounting.salesOrders.status")}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.accounting.salesOrders.invoice")}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const statusInfo = STATUS_CONFIG[order.status];
                const StatusIcon = statusInfo.icon;
                return (
                  <tr key={order.id} className="border-b border-[var(--rowi-border)] last:border-b-0 hover:bg-[var(--rowi-muted)]/5">
                    <td className="px-4 py-3">
                      <p className="font-mono text-sm font-medium text-[var(--rowi-foreground)]">{order.number}</p>
                      <p className="text-xs text-[var(--rowi-muted)]">{order.items} items • {new Date(order.orderDate).toLocaleDateString()}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[var(--rowi-foreground)]">{order.customerName}</p>
                      <p className="text-xs text-[var(--rowi-muted)]">{order.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-bold text-[var(--rowi-foreground)]">${order.total.toLocaleString()}</p>
                      <p className="text-xs text-[var(--rowi-muted)]">IVA: ${order.tax.toLocaleString()}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3" />{statusInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {order.invoiceNumber ? (
                        <span className="text-[var(--rowi-primary)] hover:underline cursor-pointer">{order.invoiceNumber}</span>
                      ) : (
                        <span className="text-[var(--rowi-muted)]">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button className="p-1 rounded hover:bg-[var(--rowi-muted)]/10"><Eye className="w-4 h-4 text-[var(--rowi-muted)]" /></button>
                        <button className="p-1 rounded hover:bg-[var(--rowi-muted)]/10"><Download className="w-4 h-4 text-[var(--rowi-muted)]" /></button>
                        <button className="p-1 rounded hover:bg-[var(--rowi-muted)]/10"><MoreVertical className="w-4 h-4 text-[var(--rowi-muted)]" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
