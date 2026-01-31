"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ShoppingCart,
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
  Building2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

interface PurchaseOrder {
  id: string;
  number: string;
  supplierName: string;
  supplierEmail: string;
  items: number;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  status: "draft" | "sent" | "confirmed" | "received" | "cancelled";
  orderDate: string;
  expectedDate?: string;
  receivedDate?: string;
  notes?: string;
}

const DEFAULT_ORDERS: PurchaseOrder[] = [
  { id: "1", number: "PO-2024-001", supplierName: "Tech Supplies Inc", supplierEmail: "orders@techsupplies.com", items: 5, subtotal: 2500, tax: 400, total: 2900, currency: "USD", status: "received", orderDate: new Date(Date.now() - 86400000 * 30).toISOString(), expectedDate: new Date(Date.now() - 86400000 * 15).toISOString(), receivedDate: new Date(Date.now() - 86400000 * 12).toISOString() },
  { id: "2", number: "PO-2024-002", supplierName: "Office Depot", supplierEmail: "ventas@officedepot.com", items: 12, subtotal: 850, tax: 136, total: 986, currency: "USD", status: "confirmed", orderDate: new Date(Date.now() - 86400000 * 10).toISOString(), expectedDate: new Date(Date.now() + 86400000 * 5).toISOString() },
  { id: "3", number: "PO-2024-003", supplierName: "Cloud Services Ltd", supplierEmail: "billing@cloudservices.com", items: 1, subtotal: 1200, tax: 0, total: 1200, currency: "USD", status: "sent", orderDate: new Date(Date.now() - 86400000 * 5).toISOString(), expectedDate: new Date(Date.now() + 86400000 * 10).toISOString() },
  { id: "4", number: "PO-2024-004", supplierName: "Marketing Agency", supplierEmail: "finance@marketingagency.com", items: 3, subtotal: 4500, tax: 720, total: 5220, currency: "USD", status: "draft", orderDate: new Date().toISOString() },
  { id: "5", number: "PO-2024-005", supplierName: "Furniture Plus", supplierEmail: "orders@furnitureplus.com", items: 8, subtotal: 3200, tax: 512, total: 3712, currency: "USD", status: "cancelled", orderDate: new Date(Date.now() - 86400000 * 20).toISOString(), notes: "Cancelado por cambio de proveedor" },
];

const STATUS_CONFIG = {
  draft: { label: "Borrador", color: "bg-gray-500/20 text-gray-500", icon: Clock },
  sent: { label: "Enviada", color: "bg-blue-500/20 text-blue-500", icon: Truck },
  confirmed: { label: "Confirmada", color: "bg-purple-500/20 text-purple-500", icon: CheckCircle },
  received: { label: "Recibida", color: "bg-green-500/20 text-green-500", icon: Package },
  cancelled: { label: "Cancelada", color: "bg-red-500/20 text-red-500", icon: XCircle },
};

export default function PurchaseOrdersPage() {
  const { t } = useI18n();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/accounting/purchase-orders");
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
    const matchesSearch = o.number.toLowerCase().includes(search.toLowerCase()) || o.supplierName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "sent" || o.status === "confirmed").length,
    pendingAmount: orders.filter((o) => o.status === "sent" || o.status === "confirmed").reduce((sum, o) => sum + o.total, 0),
    received: orders.filter((o) => o.status === "received").reduce((sum, o) => sum + o.total, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--rowi-foreground)] flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-orange-500" />
            {t("admin.accounting.purchaseOrders.title")}
          </h1>
          <p className="text-[var(--rowi-muted)] mt-1">{t("admin.accounting.purchaseOrders.description")}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => loadOrders()} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-card)] hover:bg-[var(--rowi-muted)]/10 transition-colors disabled:opacity-50">
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-primary)] text-white hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            {t("admin.accounting.purchaseOrders.new")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-[var(--rowi-muted)] mb-2"><ShoppingCart className="w-4 h-4" /><span className="text-xs">{t("admin.accounting.purchaseOrders.stats.total")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.total}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-amber-500 mb-2"><Clock className="w-4 h-4" /><span className="text-xs">{t("admin.accounting.purchaseOrders.stats.pending")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.pending}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-2"><DollarSign className="w-4 h-4" /><span className="text-xs">{t("admin.accounting.purchaseOrders.stats.pendingAmount")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">${stats.pendingAmount.toLocaleString()}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-green-500 mb-2"><Package className="w-4 h-4" /><span className="text-xs">{t("admin.accounting.purchaseOrders.stats.received")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">${stats.received.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rowi-muted)]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("admin.accounting.purchaseOrders.search")} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none">
          <option value="all">{t("admin.accounting.purchaseOrders.allStatus")}</option>
          <option value="draft">{t("admin.accounting.purchaseOrders.statusDraft")}</option>
          <option value="sent">{t("admin.accounting.purchaseOrders.statusSent")}</option>
          <option value="confirmed">{t("admin.accounting.purchaseOrders.statusConfirmed")}</option>
          <option value="received">{t("admin.accounting.purchaseOrders.statusReceived")}</option>
          <option value="cancelled">{t("admin.accounting.purchaseOrders.statusCancelled")}</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-muted)]" /></div>
      ) : (
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--rowi-muted)]/5 border-b border-[var(--rowi-border)]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.accounting.purchaseOrders.number")}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.accounting.purchaseOrders.supplier")}</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.accounting.purchaseOrders.total")}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.accounting.purchaseOrders.status")}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.accounting.purchaseOrders.expectedDate")}</th>
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
                      <p className="text-xs text-[var(--rowi-muted)]">{order.items} items</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[var(--rowi-foreground)]">{order.supplierName}</p>
                      <p className="text-xs text-[var(--rowi-muted)]">{order.supplierEmail}</p>
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
                    <td className="px-4 py-3 text-xs text-[var(--rowi-muted)]">
                      {order.expectedDate ? new Date(order.expectedDate).toLocaleDateString() : "-"}
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
