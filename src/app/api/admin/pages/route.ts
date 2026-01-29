import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

const PAGE_DEFINITIONS = [
  { slug: "home", name: "Inicio", icon: "🏠" },
  { slug: "how-it-works", name: "Cómo funciona", icon: "🔄" },
  { slug: "for-you", name: "Para personas (B2C)", icon: "👤" },
  { slug: "for-organizations", name: "Para organizaciones (B2B)", icon: "🏢" },
  { slug: "pricing", name: "Planes y precios", icon: "💳" },
  { slug: "product-rowi", name: "Producto: Rowi", icon: "🦉" },
  { slug: "product-affinity", name: "Producto: Afinidad", icon: "❤️" },
  { slug: "product-insights", name: "Producto: Insights", icon: "📊" },
  { slug: "product-integrations", name: "Producto: Integraciones", icon: "🔌" },
  { slug: "stories", name: "Historias", icon: "📖" },
  { slug: "resources", name: "Recursos", icon: "📚" },
  { slug: "contact", name: "Contacto", icon: "📧" },
];

export async function GET() {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const sections = await prisma.landingSection.findMany({
      orderBy: { order: "asc" },
    });

    const pageMap = new Map<string, typeof sections>();
    for (const section of sections) {
      const pageSlug = (section.config as any)?.pageSlug || "home";
      if (!pageMap.has(pageSlug)) {
        pageMap.set(pageSlug, []);
      }
      pageMap.get(pageSlug)!.push(section);
    }

    const pages = PAGE_DEFINITIONS.map((def) => ({
      ...def,
      sections: pageMap.get(def.slug) || [],
      sectionCount: (pageMap.get(def.slug) || []).length,
    }));

    return NextResponse.json({ ok: true, pages, definitions: PAGE_DEFINITIONS });
  } catch (e: any) {
    console.error("❌ GET /api/admin/pages:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { action, pageSlug } = await req.json();

    if (action === "init-all") {
      let totalCreated = 0;
      for (const def of PAGE_DEFINITIONS) {
        const existing = await prisma.landingSection.count({
          where: { config: { path: ["pageSlug"], equals: def.slug } },
        });
        if (existing === 0) {
          const content = getDefaultPageContent(def.slug);
          if (content.length > 0) {
            await prisma.landingSection.createMany({ data: content });
            totalCreated += content.length;
          }
        }
      }
      return NextResponse.json({ ok: true, totalCreated });
    }

    return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
  } catch (e: any) {
    console.error("❌ POST /api/admin/pages:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

function getDefaultPageContent(slug: string): any[] {
  const contents: Record<string, any[]> = {
    home: [
      { type: "HERO", order: 0, config: { pageSlug: "home", layout: "centered", showBadge: true, showTrustBadges: true, gradient: true }, content: { es: { badge: "✨ IA + Inteligencia Emocional", title1: "Tu compañero de", title2: "Inteligencia Emocional", subtitle: "Rowi te ayuda a desarrollar tu inteligencia emocional", ctaPrimary: "Conoce a Rowi", ctaSecondary: "Ver cómo funciona", trustBadges: [{ icon: "shield", text: "Datos seguros" }, { icon: "globe", text: "Six Seconds" }, { icon: "star", text: "+10,000 usuarios" }] }, en: { badge: "✨ AI + Emotional Intelligence", title1: "Your companion for", title2: "Emotional Intelligence", subtitle: "Rowi helps you develop your emotional intelligence", ctaPrimary: "Meet Rowi", ctaSecondary: "See how it works", trustBadges: [{ icon: "shield", text: "Secure data" }, { icon: "globe", text: "Six Seconds" }, { icon: "star", text: "+10,000 users" }] } } },
      { type: "STATS", order: 1, config: { pageSlug: "home", layout: "gradient", columns: 4 }, content: { es: { stats: [{ value: "10,000", suffix: "+", label: "Usuarios" }, { value: "50,000", suffix: "+", label: "Conversaciones" }, { value: "95", suffix: "%", label: "Satisfacción" }, { value: "24", suffix: "/7", label: "Disponibilidad" }] }, en: { stats: [{ value: "10,000", suffix: "+", label: "Users" }, { value: "50,000", suffix: "+", label: "Conversations" }, { value: "95", suffix: "%", label: "Satisfaction" }, { value: "24", suffix: "/7", label: "Availability" }] } } },
      { type: "EVOLUTION", order: 2, config: { pageSlug: "home" }, content: {} },
      { type: "FEATURES", order: 3, config: { pageSlug: "home", columns: 3, showIcons: true }, content: { es: { title1: "Todo lo que necesitas para", title2: "crecer emocionalmente", features: [{ icon: "sparkles", title: "Coach IA Personal", description: "Tu coach 24/7" }, { icon: "brain", title: "Evaluación SEI", description: "Evaluación científica" }, { icon: "heart", title: "Afinidad", description: "Conecta con personas afines" }] }, en: { title1: "Everything you need to", title2: "grow emotionally", features: [{ icon: "sparkles", title: "Personal AI Coach", description: "Your 24/7 coach" }, { icon: "brain", title: "SEI Assessment", description: "Scientific assessment" }, { icon: "heart", title: "Affinity", description: "Connect with like-minded people" }] } } },
      { type: "CTA", order: 4, config: { pageSlug: "home", gradient: true }, content: { es: { title: "¿Listo para conocer a tu Rowi?", subtitle: "Comienza gratis.", buttonText: "Comenzar ahora", buttonIcon: "heart" }, en: { title: "Ready to meet your Rowi?", subtitle: "Start free.", buttonText: "Get started now", buttonIcon: "heart" } } },
    ],
    "how-it-works": [
      { type: "HERO", order: 0, config: { pageSlug: "how-it-works", layout: "split", showBadge: true, gradient: true }, content: { es: { badge: "🔄 Proceso simple", title1: "Cómo funciona", title2: "Rowi", subtitle: "Tu viaje hacia la inteligencia emocional", ctaPrimary: "Comenzar ahora", image: "/owl.png" }, en: { badge: "🔄 Simple process", title1: "How", title2: "Rowi works", subtitle: "Your journey to emotional intelligence", ctaPrimary: "Get started now", image: "/owl.png" } } },
      { type: "HOW_IT_WORKS", order: 1, config: { pageSlug: "how-it-works", layout: "timeline", showNumbers: true }, content: { es: { title: "Tu viaje en 3 pasos", steps: [{ number: "1", title: "Conoce a tu Rowi", description: "Crea tu cuenta gratis" }, { number: "2", title: "Evalúa", description: "Completa la evaluación SEI" }, { number: "3", title: "Crece", description: "Evoluciona con Rowi" }] }, en: { title: "Your journey in 3 steps", steps: [{ number: "1", title: "Meet your Rowi", description: "Create your free account" }, { number: "2", title: "Assess", description: "Complete SEI assessment" }, { number: "3", title: "Grow", description: "Evolve with Rowi" }] } } },
    ],
    "for-you": [
      { type: "HERO", order: 0, config: { pageSlug: "for-you", layout: "split", showBadge: true, gradient: true }, content: { es: { badge: "👤 Para ti", title1: "Tu espacio de", title2: "crecimiento personal", subtitle: "Un lugar seguro para explorar tus emociones", ctaPrimary: "Comenzar gratis", image: "/owl.png" }, en: { badge: "👤 For you", title1: "Your space for", title2: "personal growth", subtitle: "A safe place to explore your emotions", ctaPrimary: "Start free", image: "/owl.png" } } },
      { type: "FEATURES", order: 1, config: { pageSlug: "for-you", columns: 3 }, content: { es: { title1: "Experiencia", title2: "For You", features: [{ icon: "sparkles", title: "Rowi Personal", description: "Tu coach IA" }, { icon: "heart", title: "Matches", description: "Conecta con afines" }, { icon: "bar-chart", title: "Dashboard", description: "Tu progreso" }] }, en: { title1: "The", title2: "For You Experience", features: [{ icon: "sparkles", title: "Personal Rowi", description: "Your AI coach" }, { icon: "heart", title: "Matches", description: "Connect with like-minded" }, { icon: "bar-chart", title: "Dashboard", description: "Your progress" }] } } },
    ],
    "for-organizations": [
      { type: "HERO", order: 0, config: { pageSlug: "for-organizations", layout: "split", showBadge: true, gradient: true }, content: { es: { badge: "🏢 Para empresas", title1: "Inteligencia emocional", title2: "para tu organización", subtitle: "Potencia el bienestar de tu equipo", ctaPrimary: "Solicitar demo", image: "/owl.png" }, en: { badge: "🏢 For business", title1: "Emotional intelligence", title2: "for your organization", subtitle: "Boost your team's wellbeing", ctaPrimary: "Request demo", image: "/owl.png" } } },
      { type: "FEATURES", order: 1, config: { pageSlug: "for-organizations", columns: 3 }, content: { es: { title1: "Soluciones", title2: "B2B", features: [{ icon: "users", title: "Evaluaciones", description: "Para equipos" }, { icon: "bar-chart", title: "Analytics", description: "Dashboards ejecutivos" }, { icon: "shield", title: "Seguridad", description: "Enterprise-grade" }] }, en: { title1: "B2B", title2: "Solutions", features: [{ icon: "users", title: "Assessments", description: "For teams" }, { icon: "bar-chart", title: "Analytics", description: "Executive dashboards" }, { icon: "shield", title: "Security", description: "Enterprise-grade" }] } } },
    ],
    pricing: [
      { type: "HERO", order: 0, config: { pageSlug: "pricing", layout: "centered", showBadge: true }, content: { es: { badge: "💳 Precios transparentes", title1: "Planes para cada", title2: "etapa de tu viaje", subtitle: "Comienza gratis", ctaPrimary: "Ver planes" }, en: { badge: "💳 Transparent pricing", title1: "Plans for every", title2: "stage of your journey", subtitle: "Start free", ctaPrimary: "See plans" } } },
      { type: "PRICING", order: 1, config: { pageSlug: "pricing", columns: 3 }, content: { es: { title: "Elige tu plan", plans: [{ name: "Gratuito", price: "$0", period: "/siempre", features: ["Rowi personal", "5 conversaciones/mes"], cta: "Comenzar gratis", highlighted: false }, { name: "Pro", price: "$19", period: "/mes", badge: "Popular", features: ["Todo lo gratuito", "Conversaciones ilimitadas", "SEI completo"], cta: "Prueba gratis", highlighted: true }, { name: "Enterprise", price: "Custom", period: "", features: ["Todo Pro", "Admin dashboard", "API access"], cta: "Contactar", highlighted: false }] }, en: { title: "Choose your plan", plans: [{ name: "Free", price: "$0", period: "/forever", features: ["Personal Rowi", "5 conversations/month"], cta: "Start free", highlighted: false }, { name: "Pro", price: "$19", period: "/month", badge: "Popular", features: ["All Free features", "Unlimited conversations", "Full SEI"], cta: "Free trial", highlighted: true }, { name: "Enterprise", price: "Custom", period: "", features: ["All Pro features", "Admin dashboard", "API access"], cta: "Contact", highlighted: false }] } } },
    ],
  };
  return contents[slug] || [];
}
