/**
 * Platform agents would live ONLY at global scope — never distributed/cloned
 * into tenants/hubs/superhubs/orgs.
 *
 * Currently EMPTY: por decisión de producto, todos los agentes (incluido
 * `research`) se distribuyen a cada entidad para poder personalizarse. El
 * mecanismo se mantiene por si en el futuro hay un agente que deba quedar
 * solo en global; añadir su slug aquí lo excluye de la distribución y de la
 * limpieza del sync en un único lugar.
 */
export const PLATFORM_AGENT_SLUGS = new Set<string>([]);
