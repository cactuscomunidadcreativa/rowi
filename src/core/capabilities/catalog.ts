/**
 * 🧩 Catálogo de CAPABILITIES (módulos del Rowiverse).
 *
 * Una capability = permiso de ver/usar un módulo. El acceso se decide por DOS
 * ejes que se combinan (decisión Eduardo, 2026-06):
 *   1. SCOPE/ROL  — qué TIPO de cosa puede ver (rowiverse=SuperAdmin, tenant=HR/
 *      admin del cliente, hub, consultor). Lo da requireAdminWithScope.
 *   2. SUSCRIPCIÓN — si el tenant COMPRÓ el módulo (flags del modelo Plan).
 *
 * Una capability se concede solo si AMBOS ejes se cumplen. Así:
 *   - platform.*  → solo SuperAdmin (tú). Nunca depende de suscripción.
 *   - consultant.* → rol consultor, scoped a SUS clientes.
 *   - tp.* / hr.*  → rol del tenant (HR/admin) Y el plan del tenant lo activa.
 *
 * Este archivo NO ejecuta lógica de acceso — solo DECLARA el mapa. El helper
 * resolveCapabilities() (resolve.ts) lo aplica. Mantener puro y testeable.
 */

/** Ámbitos de admin que ya produce requireAdminWithScope. */
export type AdminScopeType = "rowiverse" | "superhub" | "tenant" | "hub";

/** Flags de suscripción del Plan que una capability puede requerir. */
export type PlanFlag =
  | "benchmarkAccess"
  | "apiAccess"
  | "weekflowAccess"
  | "rowiECOAccess"
  | "rowiAffinityAccess"
  | "rowiEQAccess"
  | "rowiTrainerAccess"
  | "rowiSalesAccess"
  | "superRowiAccess";

export type Capability =
  // ── Plataforma (solo tú / SuperAdmin) ──
  | "platform.agents"
  | "platform.benchmarks"
  | "platform.cms"
  | "platform.coupons"
  | "platform.knowledge"
  | "platform.tenants"
  | "platform.settings"
  // ── Consultor (rol consultor, scoped a sus clientes) ──
  | "consultant.profile" // perfil integral SEI↔VS
  | "consultant.cross" // cross-analysis cohorte
  | "consultant.narrative"
  | "consultant.hiring" // proceso de hiring/selección (CSV SEI → caso archivado)
  // ── Operación del cliente: TP Hub (HR + team-leads del tenant) ──
  | "tp.dashboard"
  | "tp.people"
  | "tp.teams"
  | "tp.alerts"
  | "tp.roi"
  | "tp.eco"
  | "tp.coach"
  // ── RR.HH. del tenant ──
  | "hr.employees"
  | "hr.reviews"
  | "hr.vitalSigns";

export interface CapabilityRule {
  /** Scopes de admin que pueden tener esta capability. */
  scopes: AdminScopeType[];
  /**
   * Flag de Plan requerido. Si null, no depende de suscripción (típico de
   * platform.* — solo importa el scope rowiverse).
   */
  planFlag: PlanFlag | null;
  /** Descripción corta (para el panel de planes / debugging). */
  desc: string;
}

/**
 * EL MAPA. scopes = quién (eje rol), planFlag = activado por suscripción (eje
 * plan). rowiverse (SuperAdmin) está en todo: tú ves todo, sin depender de plan.
 */
export const CAPABILITY_CATALOG: Record<Capability, CapabilityRule> = {
  // Plataforma — solo rowiverse, sin gate de plan.
  "platform.agents": { scopes: ["rowiverse"], planFlag: null, desc: "Config de agentes IA" },
  "platform.benchmarks": { scopes: ["rowiverse"], planFlag: null, desc: "Benchmarks globales" },
  "platform.cms": { scopes: ["rowiverse"], planFlag: null, desc: "CMS / landing" },
  "platform.coupons": { scopes: ["rowiverse"], planFlag: null, desc: "Ventas / cupones" },
  "platform.knowledge": { scopes: ["rowiverse"], planFlag: null, desc: "Knowledge layer" },
  "platform.tenants": { scopes: ["rowiverse"], planFlag: null, desc: "Gestión de tenants" },
  "platform.settings": { scopes: ["rowiverse"], planFlag: null, desc: "Ajustes de plataforma" },

  // Consultor — rowiverse o tenant (consultor del cliente), gated por benchmark.
  "consultant.profile": { scopes: ["rowiverse", "tenant", "superhub"], planFlag: "benchmarkAccess", desc: "Perfil integral SEI↔VS" },
  "consultant.cross": { scopes: ["rowiverse", "tenant", "superhub"], planFlag: "benchmarkAccess", desc: "Cross-analysis de cohorte" },
  "consultant.narrative": { scopes: ["rowiverse", "tenant", "superhub"], planFlag: "benchmarkAccess", desc: "Narrativa IA del consultor" },
  "consultant.hiring": { scopes: ["rowiverse", "tenant", "superhub"], planFlag: "benchmarkAccess", desc: "Proceso de hiring/selección (CSV SEI)" },

  // TP Hub — operación del cliente: tenant/hub (HR + team-leads), gated por benchmark.
  "tp.dashboard": { scopes: ["rowiverse", "tenant", "hub"], planFlag: "benchmarkAccess", desc: "Dashboard TP" },
  "tp.people": { scopes: ["rowiverse", "tenant", "hub"], planFlag: "benchmarkAccess", desc: "Personas" },
  "tp.teams": { scopes: ["rowiverse", "tenant", "hub"], planFlag: "benchmarkAccess", desc: "Equipos" },
  "tp.alerts": { scopes: ["rowiverse", "tenant", "hub"], planFlag: "benchmarkAccess", desc: "Alertas" },
  "tp.roi": { scopes: ["rowiverse", "tenant"], planFlag: "benchmarkAccess", desc: "ROI (solo HR/tenant)" },
  "tp.eco": { scopes: ["rowiverse", "tenant", "hub"], planFlag: "rowiECOAccess", desc: "ECO de equipo" },
  "tp.coach": { scopes: ["rowiverse", "tenant", "hub"], planFlag: null, desc: "Coach" },

  // RR.HH. del tenant.
  "hr.employees": { scopes: ["rowiverse", "tenant"], planFlag: null, desc: "Empleados" },
  "hr.reviews": { scopes: ["rowiverse", "tenant"], planFlag: null, desc: "Evaluaciones" },
  "hr.vitalSigns": { scopes: ["rowiverse", "tenant"], planFlag: "benchmarkAccess", desc: "Vital Signs RR.HH." },
};

export const ALL_CAPABILITIES = Object.keys(CAPABILITY_CATALOG) as Capability[];
