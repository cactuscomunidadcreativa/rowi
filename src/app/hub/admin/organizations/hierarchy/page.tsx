"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  RefreshCcw,
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  GitBranch,
  Globe,
  MapPin,
  Users,
  Briefcase,
  User,
  Move,
  X,
  Check,
  Loader2,
  AlertTriangle,
  Layers,
  Heart,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  AdminPage,
  AdminCard,
  AdminButton,
  AdminBadge,
  AdminInput,
  AdminSelect,
  AdminTextarea,
  AdminToggle,
  AdminSearch,
  AdminEmpty,
} from "@/components/admin/AdminPage";

/* =========================================================
   🌲 Organizations Hierarchy — Tree View Admin

   Gestión visual de la jerarquía organizacional.
   - Vista de árbol interactiva
   - Crear/editar/mover/eliminar organizaciones
   - Drag & drop (futuro)
========================================================= */

interface OrgNode {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  unitType: string;
  level: number;
  inheritPermissions: boolean;
  _count: {
    members: number;
    children: number;
  };
  children?: OrgNode[];
}

const UNIT_TYPES = ["WORLD", "REGION", "COUNTRY", "DIVISION", "TEAM", "COMMUNITY", "CLIENT"];

const UNIT_TYPE_ICONS: Record<string, typeof Globe> = {
  WORLD: Globe,
  REGION: MapPin,
  COUNTRY: MapPin,
  DIVISION: Briefcase,
  TEAM: Users,
  COMMUNITY: Heart,
  CLIENT: User,
};

const UNIT_TYPE_COLORS: Record<string, string> = {
  WORLD: "from-purple-500 to-indigo-600",
  REGION: "from-blue-500 to-cyan-600",
  COUNTRY: "from-green-500 to-emerald-600",
  DIVISION: "from-orange-500 to-amber-600",
  TEAM: "from-pink-500 to-rose-600",
  COMMUNITY: "from-red-500 to-pink-600",
  CLIENT: "from-gray-500 to-slate-600",
};

export default function HierarchyPage() {
  const { t } = useI18n();

  // Estado principal
  const [tree, setTree] = useState<OrgNode[]>([]);
  const [flatList, setFlatList] = useState<OrgNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Vista: "tree" (jerárquica) o "byType" (agrupada por tipo)
  const [viewMode, setViewMode] = useState<"tree" | "byType">("tree");

  // Filtro por tipo de unidad
  const [filterType, setFilterType] = useState<string>("ALL");

  // Nodos expandidos
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Modal de edición
  const [editModal, setEditModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    org?: OrgNode;
    parentId?: string | null;
  }>({ open: false, mode: "create" });

  // Modal de eliminación
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    org?: OrgNode;
  }>({ open: false });

  // Formulario
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    unitType: "TEAM",
    inheritPermissions: true,
    parentId: null as string | null,
  });
  const [saving, setSaving] = useState(false);

  // Cargar jerarquía al montar
  useEffect(() => {
    const fetchHierarchy = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/organizations/hierarchy");
        const data = await res.json();
        if (data.ok) {
          setTree(data.tree || []);
          setFlatList(data.organizations || []);
          // Expandir primer nivel por defecto
          if (data.tree) {
            const firstLevel = new Set<string>(data.tree.map((n: OrgNode) => n.id));
            setExpanded(firstLevel);
          }
        }
      } catch (error) {
        toast.error("Error al cargar jerarquía");
      } finally {
        setLoading(false);
      }
    };
    fetchHierarchy();
  }, []);

  // Función para recargar manualmente
  const loadHierarchy = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/organizations/hierarchy");
      const data = await res.json();
      if (data.ok) {
        setTree(data.tree || []);
        setFlatList(data.organizations || []);
        if (data.tree) {
          const firstLevel = new Set<string>(data.tree.map((n: OrgNode) => n.id));
          setExpanded(firstLevel);
        }
      }
    } catch (error) {
      toast.error("Error al cargar jerarquía");
    } finally {
      setLoading(false);
    }
  };

  // Toggle expandir nodo
  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  // Expandir todo
  const expandAll = () => {
    setExpanded(new Set(flatList.map((n) => n.id)));
  };

  // Colapsar todo
  const collapseAll = () => {
    setExpanded(new Set());
  };

  // Abrir modal crear
  const openCreateModal = (parentId: string | null = null, unitType?: string) => {
    const parent = flatList.find((n) => n.id === parentId);
    setForm({
      name: "",
      slug: "",
      description: "",
      unitType: unitType || (parent ? getNextUnitType(parent.unitType) : "WORLD"),
      inheritPermissions: true,
      parentId,
    });
    setEditModal({ open: true, mode: "create", parentId });
  };

  // Creación rápida
  const quickCreate = async (unitType: string, parentId: string | null = null) => {
    const nameMap: Record<string, string> = {
      WORLD: "Nueva Organización Global",
      REGION: "Nueva Región",
      COUNTRY: "Nuevo País",
      DIVISION: "Nueva División",
      TEAM: "Nuevo Equipo",
      COMMUNITY: "Nueva Comunidad",
      CLIENT: "Nuevo Cliente",
    };

    const name = prompt(t("admin.organizations.name"), nameMap[unitType] || "Nueva Unidad");
    if (!name) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/organizations/hierarchy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          unitType,
          parentId,
          inheritPermissions: true,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        toast.success(t("admin.organizations.created"));
        loadHierarchy();
      } else {
        toast.error(data.error || "Error");
      }
    } catch (error) {
      toast.error("Error al crear");
    } finally {
      setSaving(false);
    }
  };

  // Abrir modal editar
  const openEditModal = (org: OrgNode) => {
    setForm({
      name: org.name,
      slug: org.slug,
      description: org.description || "",
      unitType: org.unitType,
      inheritPermissions: org.inheritPermissions,
      parentId: org.parentId,
    });
    setEditModal({ open: true, mode: "edit", org });
  };

  // Guardar organización
  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error(t("admin.organizations.nameRequired"));
      return;
    }

    setSaving(true);
    try {
      const method = editModal.mode === "create" ? "POST" : "PUT";
      const body = editModal.mode === "create"
        ? form
        : { id: editModal.org?.id, ...form };

      const res = await fetch("/api/admin/organizations/hierarchy", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.ok) {
        toast.success(
          editModal.mode === "create"
            ? t("admin.organizations.created")
            : t("admin.organizations.updated")
        );
        setEditModal({ open: false, mode: "create" });
        loadHierarchy();
      } else {
        toast.error(data.error || t("common.error"));
      }
    } catch (error) {
      toast.error(t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  // Eliminar organización
  const handleDelete = async (cascade: boolean = false, reparent: boolean = false) => {
    if (!deleteModal.org) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/organizations/hierarchy", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: deleteModal.org.id,
          cascade,
          reparent,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        toast.success(t("admin.organizations.deleted"));
        setDeleteModal({ open: false });
        loadHierarchy();
      } else {
        toast.error(data.error || t("common.error"));
      }
    } catch (error) {
      toast.error(t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  // Obtener siguiente tipo de unidad
  const getNextUnitType = (currentType: string): string => {
    const idx = UNIT_TYPES.indexOf(currentType);
    return UNIT_TYPES[Math.min(idx + 1, UNIT_TYPES.length - 1)];
  };

  // Filtrar árbol por búsqueda
  const filterTree = (nodes: OrgNode[], searchTerm: string): OrgNode[] => {
    if (!searchTerm) return nodes;
    const lower = searchTerm.toLowerCase();

    return nodes.reduce((acc, node) => {
      const matches =
        node.name.toLowerCase().includes(lower) ||
        node.slug.toLowerCase().includes(lower);

      const filteredChildren = filterTree(node.children || [], searchTerm);

      if (matches || filteredChildren.length > 0) {
        acc.push({
          ...node,
          children: filteredChildren.length > 0 ? filteredChildren : node.children,
        });
      }

      return acc;
    }, [] as OrgNode[]);
  };

  const filteredTree = filterTree(tree, search);

  // Agrupar por tipo de unidad (para vista byType)
  const groupedByType = UNIT_TYPES.reduce((acc, type) => {
    const items = flatList.filter((n) => {
      const matchesType = n.unitType === type;
      const matchesSearch = !search ||
        n.name.toLowerCase().includes(search.toLowerCase()) ||
        n.slug.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filterType === "ALL" || n.unitType === filterType;
      return matchesType && matchesSearch && matchesFilter;
    });
    if (items.length > 0) {
      acc[type] = items;
    }
    return acc;
  }, {} as Record<string, OrgNode[]>);

  // Obtener el path completo de un nodo (para mostrar la jerarquía en vista plana)
  const getNodePath = (node: OrgNode): string => {
    const path: string[] = [node.name];
    let currentParentId = node.parentId;

    while (currentParentId) {
      const parent = flatList.find((n) => n.id === currentParentId);
      if (parent) {
        path.unshift(parent.name);
        currentParentId = parent.parentId;
      } else {
        break;
      }
    }

    return path.slice(0, -1).join(" → "); // Excluir el nombre propio
  };

  // Renderizar nodo del árbol
  const renderNode = (node: OrgNode, depth: number = 0) => {
    const Icon = UNIT_TYPE_ICONS[node.unitType] || Building2;
    const colorClass = UNIT_TYPE_COLORS[node.unitType] || "from-gray-500 to-slate-600";
    const isExpanded = expanded.has(node.id);
    const hasChildren = (node.children?.length || 0) > 0 || node._count.children > 0;

    return (
      <div key={node.id} className="select-none">
        <div
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg
            hover:bg-[var(--rowi-background)] transition-colors
            group cursor-pointer
          `}
          style={{ paddingLeft: `${depth * 24 + 12}px` }}
        >
          {/* Expand/collapse */}
          <button
            onClick={() => toggleExpand(node.id)}
            className={`w-5 h-5 flex items-center justify-center ${hasChildren ? "" : "invisible"}`}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-[var(--rowi-muted)]" />
            ) : (
              <ChevronRight className="w-4 h-4 text-[var(--rowi-muted)]" />
            )}
          </button>

          {/* Icon */}
          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center shadow-sm`}>
            <Icon className="w-3.5 h-3.5 text-white" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0" onClick={() => toggleExpand(node.id)}>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-[var(--rowi-foreground)] truncate">
                {node.name}
              </span>
              <AdminBadge variant="neutral" size="sm">
                {t(`admin.organizations.unitTypes.${node.unitType.toLowerCase()}`)}
              </AdminBadge>
            </div>
            <div className="flex items-center gap-3 text-xs text-[var(--rowi-muted)]">
              <span>{node.slug}</span>
              {node._count.members > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {node._count.members}
                </span>
              )}
              {node._count.children > 0 && (
                <span className="flex items-center gap-1">
                  <GitBranch className="w-3 h-3" />
                  {node._count.children}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => openCreateModal(node.id)}
              className="p-1.5 rounded-lg text-[var(--rowi-muted)] hover:text-[var(--rowi-foreground)] hover:bg-[var(--rowi-border)]"
              title={t("admin.organizations.addChild")}
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => openEditModal(node)}
              className="p-1.5 rounded-lg text-[var(--rowi-muted)] hover:text-[var(--rowi-foreground)] hover:bg-[var(--rowi-border)]"
              title={t("admin.common.edit")}
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeleteModal({ open: true, org: node })}
              className="p-1.5 rounded-lg text-[var(--rowi-muted)] hover:text-[var(--rowi-error)] hover:bg-[var(--rowi-error)]/10"
              title={t("admin.common.delete")}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Children */}
        {isExpanded && node.children && node.children.length > 0 && (
          <div>
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <AdminPage
      titleKey="admin.organizations.hierarchy.title"
      descriptionKey="admin.organizations.hierarchy.description"
      icon={GitBranch}
      loading={loading}
      actions={
        <div className="flex items-center gap-2">
          <AdminButton variant="ghost" onClick={expandAll} size="sm">
            {t("admin.organizations.expandAll")}
          </AdminButton>
          <AdminButton variant="ghost" onClick={collapseAll} size="sm">
            {t("admin.organizations.collapseAll")}
          </AdminButton>
          <AdminButton variant="primary" icon={Plus} onClick={() => openCreateModal(null)} size="sm">
            {t("admin.organizations.createRoot")}
          </AdminButton>
          <AdminButton variant="secondary" icon={RefreshCcw} onClick={loadHierarchy} size="sm">
            {t("admin.common.refresh")}
          </AdminButton>
        </div>
      }
    >
      {/* Quick Create & Search */}
      <AdminCard compact className="mb-4">
        <div className="flex flex-col gap-3">
          {/* Botones de creación rápida */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[var(--rowi-muted)] font-medium mr-2">
              {t("admin.organizations.quickCreate")}:
            </span>
            <button
              onClick={() => quickCreate("WORLD")}
              disabled={saving}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-purple-500/10 to-indigo-500/10 text-purple-600 hover:from-purple-500/20 hover:to-indigo-500/20 transition-all"
            >
              <Globe className="w-3.5 h-3.5" />
              {t("admin.organizations.unitTypes.world").split(" ")[0]}
            </button>
            <button
              onClick={() => quickCreate("REGION")}
              disabled={saving}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-600 hover:from-blue-500/20 hover:to-cyan-500/20 transition-all"
            >
              <MapPin className="w-3.5 h-3.5" />
              Región
            </button>
            <button
              onClick={() => quickCreate("COUNTRY")}
              disabled={saving}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-600 hover:from-green-500/20 hover:to-emerald-500/20 transition-all"
            >
              <MapPin className="w-3.5 h-3.5" />
              País
            </button>
            <button
              onClick={() => quickCreate("DIVISION")}
              disabled={saving}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-orange-500/10 to-amber-500/10 text-orange-600 hover:from-orange-500/20 hover:to-amber-500/20 transition-all"
            >
              <Briefcase className="w-3.5 h-3.5" />
              División
            </button>
            <button
              onClick={() => quickCreate("TEAM")}
              disabled={saving}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-pink-500/10 to-rose-500/10 text-pink-600 hover:from-pink-500/20 hover:to-rose-500/20 transition-all"
            >
              <Users className="w-3.5 h-3.5" />
              Equipo
            </button>
            <button
              onClick={() => quickCreate("COMMUNITY")}
              disabled={saving}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-red-500/10 to-pink-500/10 text-red-600 hover:from-red-500/20 hover:to-pink-500/20 transition-all"
            >
              <Heart className="w-3.5 h-3.5" />
              Comunidad
            </button>
            <button
              onClick={() => quickCreate("CLIENT")}
              disabled={saving}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-gray-500/10 to-slate-500/10 text-gray-600 hover:from-gray-500/20 hover:to-slate-500/20 transition-all"
            >
              <User className="w-3.5 h-3.5" />
              Cliente
            </button>
          </div>

          {/* Controles: Vista, Filtro y Búsqueda */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Toggle de vista */}
            <div className="flex p-0.5 bg-[var(--rowi-border)] rounded-lg">
              <button
                onClick={() => setViewMode("tree")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                  viewMode === "tree"
                    ? "bg-[var(--rowi-surface)] text-[var(--rowi-foreground)] shadow-sm"
                    : "text-[var(--rowi-muted)] hover:text-[var(--rowi-foreground)]"
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                Jerarquía
              </button>
              <button
                onClick={() => setViewMode("byType")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                  viewMode === "byType"
                    ? "bg-[var(--rowi-surface)] text-[var(--rowi-foreground)] shadow-sm"
                    : "text-[var(--rowi-muted)] hover:text-[var(--rowi-foreground)]"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Por Tipo
              </button>
            </div>

            {/* Filtro por tipo */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--rowi-background)] border border-[var(--rowi-border)] text-[var(--rowi-foreground)]"
            >
              <option value="ALL">Todos los tipos</option>
              {UNIT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`admin.organizations.unitTypes.${type.toLowerCase()}`).split(" ")[0]}
                </option>
              ))}
            </select>

            {/* Búsqueda */}
            <div className="flex-1 min-w-[200px]">
              <AdminSearch
                value={search}
                onChange={setSearch}
                placeholderKey="admin.organizations.searchOrg"
              />
            </div>
          </div>
        </div>
      </AdminCard>

      {/* Vista Jerárquica (Tree) */}
      {viewMode === "tree" && (
        <AdminCard>
          {filteredTree.length === 0 ? (
            <AdminEmpty
              icon={Building2}
              titleKey="admin.organizations.noOrganizations"
              descriptionKey="admin.organizations.createFirst"
              action={
                <AdminButton variant="primary" icon={Plus} onClick={() => openCreateModal(null)}>
                  {t("admin.organizations.createRoot")}
                </AdminButton>
              }
            />
          ) : (
            <div className="space-y-1">
              {filteredTree.map((node) => renderNode(node))}
            </div>
          )}
        </AdminCard>
      )}

      {/* Vista Por Tipo */}
      {viewMode === "byType" && (
        <div className="space-y-4">
          {Object.entries(groupedByType).length === 0 ? (
            <AdminCard>
              <AdminEmpty
                icon={Building2}
                titleKey="admin.organizations.noOrganizations"
                descriptionKey="admin.organizations.createFirst"
              />
            </AdminCard>
          ) : (
            Object.entries(groupedByType).map(([type, nodes]) => {
              const TypeIcon = UNIT_TYPE_ICONS[type] || Building2;
              const colorClass = UNIT_TYPE_COLORS[type] || "from-gray-500 to-slate-600";

              return (
                <AdminCard key={type}>
                  {/* Header del grupo */}
                  <div className="flex items-center gap-3 pb-3 mb-3 border-b border-[var(--rowi-border)]">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center`}>
                      <TypeIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--rowi-foreground)]">
                        {t(`admin.organizations.unitTypes.${type.toLowerCase()}`).split(" ")[0]}
                      </h3>
                      <p className="text-xs text-[var(--rowi-muted)]">
                        {nodes.length} {nodes.length === 1 ? "unidad" : "unidades"}
                      </p>
                    </div>
                  </div>

                  {/* Lista de nodos de este tipo */}
                  <div className="space-y-2">
                    {nodes.map((node) => {
                      const path = getNodePath(node);
                      return (
                        <div
                          key={node.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-[var(--rowi-background)] hover:bg-[var(--rowi-border)] transition-colors group"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-[var(--rowi-foreground)]">
                                {node.name}
                              </span>
                              {node._count.members > 0 && (
                                <span className="text-xs text-[var(--rowi-muted)] flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {node._count.members}
                                </span>
                              )}
                            </div>
                            {path && (
                              <p className="text-xs text-[var(--rowi-muted)] truncate">
                                {path}
                              </p>
                            )}
                          </div>

                          {/* Acciones */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openCreateModal(node.id)}
                              className="p-1.5 rounded-lg text-[var(--rowi-muted)] hover:text-[var(--rowi-foreground)] hover:bg-[var(--rowi-surface)]"
                              title={t("admin.organizations.addChild")}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(node)}
                              className="p-1.5 rounded-lg text-[var(--rowi-muted)] hover:text-[var(--rowi-foreground)] hover:bg-[var(--rowi-surface)]"
                              title={t("admin.common.edit")}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteModal({ open: true, org: node })}
                              className="p-1.5 rounded-lg text-[var(--rowi-muted)] hover:text-[var(--rowi-error)] hover:bg-[var(--rowi-error)]/10"
                              title={t("admin.common.delete")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AdminCard>
              );
            })
          )}
        </div>
      )}

      {/* Modal Crear/Editar */}
      {editModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--rowi-surface)] rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--rowi-border)] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--rowi-foreground)]">
                {editModal.mode === "create"
                  ? t("admin.organizations.create")
                  : t("admin.organizations.edit")}
              </h2>
              <button
                onClick={() => setEditModal({ open: false, mode: "create" })}
                className="p-1 rounded-lg hover:bg-[var(--rowi-border)]"
              >
                <X className="w-5 h-5 text-[var(--rowi-muted)]" />
              </button>
            </div>

            {/* Form */}
            <div className="px-6 py-4 space-y-4">
              <AdminInput
                labelKey="admin.organizations.name"
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
                placeholderKey="admin.organizations.namePlaceholder"
              />

              <AdminInput
                labelKey="admin.organizations.slug"
                value={form.slug}
                onChange={(v) => setForm({ ...form, slug: v })}
                placeholderKey="admin.organizations.slugPlaceholder"
              />

              <AdminTextarea
                labelKey="admin.organizations.description"
                value={form.description}
                onChange={(v) => setForm({ ...form, description: v })}
                placeholderKey="admin.organizations.descriptionPlaceholder"
                rows={2}
              />

              <AdminSelect
                labelKey="admin.organizations.unitType"
                value={form.unitType}
                onChange={(v) => setForm({ ...form, unitType: v })}
                options={UNIT_TYPES.map((type) => ({
                  value: type,
                  label: t(`admin.organizations.unitTypes.${type.toLowerCase()}`),
                }))}
              />

              {editModal.mode === "edit" && (
                <AdminSelect
                  labelKey="admin.organizations.parent"
                  value={form.parentId || ""}
                  onChange={(v) => setForm({ ...form, parentId: v || null })}
                  options={[
                    { value: "", label: t("admin.organizations.noParent") },
                    ...flatList
                      .filter((n) => n.id !== editModal.org?.id)
                      .map((n) => ({
                        value: n.id,
                        label: `${"  ".repeat(n.level)}${n.name}`,
                      })),
                  ]}
                />
              )}

              <AdminToggle
                checked={form.inheritPermissions}
                onChange={(v) => setForm({ ...form, inheritPermissions: v })}
                labelKey="admin.organizations.inheritPermissions"
              />
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-[var(--rowi-border)] flex justify-end gap-2">
              <AdminButton
                variant="ghost"
                onClick={() => setEditModal({ open: false, mode: "create" })}
              >
                {t("admin.common.cancel")}
              </AdminButton>
              <AdminButton
                variant="primary"
                icon={Check}
                onClick={handleSave}
                loading={saving}
              >
                {t("admin.common.save")}
              </AdminButton>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {deleteModal.open && deleteModal.org && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--rowi-surface)] rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--rowi-border)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--rowi-error)]/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-[var(--rowi-error)]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--rowi-foreground)]">
                    {t("admin.organizations.deleteConfirm")}
                  </h2>
                  <p className="text-sm text-[var(--rowi-muted)]">
                    {deleteModal.org.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              {deleteModal.org._count.children > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-[var(--rowi-foreground)]">
                    {t("admin.organizations.hasChildren").replace("{count}", String(deleteModal.org._count.children))}
                  </p>
                  <div className="flex flex-col gap-2">
                    <AdminButton
                      variant="secondary"
                      icon={Move}
                      onClick={() => handleDelete(false, true)}
                      loading={saving}
                    >
                      {t("admin.organizations.reparentChildren")}
                    </AdminButton>
                    <AdminButton
                      variant="danger"
                      icon={Trash2}
                      onClick={() => handleDelete(true, false)}
                      loading={saving}
                    >
                      {t("admin.organizations.deleteAll")}
                    </AdminButton>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--rowi-muted)]">
                  {t("admin.organizations.deleteWarning")}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-[var(--rowi-border)] flex justify-end gap-2">
              <AdminButton
                variant="ghost"
                onClick={() => setDeleteModal({ open: false })}
              >
                {t("admin.common.cancel")}
              </AdminButton>
              {deleteModal.org._count.children === 0 && (
                <AdminButton
                  variant="danger"
                  icon={Trash2}
                  onClick={() => handleDelete()}
                  loading={saving}
                >
                  {t("admin.common.delete")}
                </AdminButton>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminPage>
  );
}
