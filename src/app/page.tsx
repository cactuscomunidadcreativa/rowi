import { prisma } from "@/core/prisma";
import HomeClient, { type Section } from "./HomeClient";

/**
 * 🏠 Página de Inicio - Home (Server Component + ISR)
 *
 * El contenido del CMS (LandingSection con pageSlug="home") se resuelve AHORA
 * en el servidor y se revalida cada 5 min (ISR). Antes esto era un fetch
 * client-side con spinner, lo que perjudicaba SEO (los bots veían un loader)
 * y LCP. Ahora el HTML llega completo en la primera respuesta y cae al
 * contenido estático si el CMS no tiene secciones.
 */

export const revalidate = 300; // ISR: revalidar cada 5 minutos

async function getHomeSections(): Promise<Section[]> {
  try {
    const rows = await prisma.landingSection.findMany({
      where: {
        isVisible: true,
        config: {
          path: ["pageSlug"],
          equals: "home",
        },
      },
      orderBy: { order: "asc" },
    });

    let sections = rows as unknown as Section[];

    if (sections.length === 0) return [];

    // Auto-inject WORLD_MAP si no está presente (renderiza PublicWorldMap).
    // Misma lógica que tenía el cliente antes de la migración.
    if (!sections.find((s) => s.type === "WORLD_MAP")) {
      const statsSection = sections.find((s) => s.type === "STATS");
      const mapOrder = statsSection ? statsSection.order + 0.5 : 1.5;
      sections = [
        ...sections,
        { id: "world-map-auto", type: "WORLD_MAP", order: mapOrder, content: {} },
      ];
    }

    return sections;
  } catch (error) {
    // Ante cualquier fallo del CMS/DB, caer al contenido estático (fallback)
    // devolviendo lista vacía. La home nunca debe romperse.
    console.error("Error loading home sections (SSR):", error);
    return [];
  }
}

export default async function HomePage() {
  const sections = await getHomeSections();
  return <HomeClient sections={sections} />;
}
