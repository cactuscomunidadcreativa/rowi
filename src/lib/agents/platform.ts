/**
 * Platform agents live ONLY at global scope — they are never distributed/cloned
 * into tenants/hubs/superhubs/orgs. Distributing them would create one redundant
 * row per entity (resolveAgent falls back to global anyway), and some are gated
 * (e.g. research is restricted by researchAccessLevel).
 */
export const PLATFORM_AGENT_SLUGS = new Set<string>(["research"]);
