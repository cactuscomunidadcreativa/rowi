import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

/**
 * 🎨 POST /api/admin/landing-builder/init
 * ---------------------------------------------------------
 * Inicializa la landing page con las secciones por defecto.
 * Solo crea secciones si no existen.
 */
export async function POST() {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Verificar si ya hay secciones
    const existing = await prisma.landingSection.count();
    if (existing > 0) {
      return NextResponse.json({
        ok: true,
        message: "Landing already initialized",
        existing,
      });
    }

    // Secciones por defecto con contenido traducible
    const defaultSections = [
      {
        type: "NAVBAR" as const,
        order: 0,
        name: "Navbar",
        config: {
          fixed: true,
          transparent: false,
          blur: true,
        },
        content: {
          es: {
            brand: "Rowi",
            links: [
              { label: "Funciones", href: "#features" },
              { label: "Cómo funciona", href: "#how-it-works" },
              { label: "Precios", href: "#pricing" },
            ],
            loginText: "Iniciar sesión",
            ctaText: "Comenzar gratis",
          },
          en: {
            brand: "Rowi",
            links: [
              { label: "Features", href: "#features" },
              { label: "How it works", href: "#how-it-works" },
              { label: "Pricing", href: "#pricing" },
            ],
            loginText: "Sign in",
            ctaText: "Get started free",
          },
        },
      },
      {
        type: "HERO" as const,
        order: 1,
        name: "Hero Section",
        config: {
          layout: "centered",
          showBadge: true,
          showTrustBadges: true,
          animation: "fade-up",
          gradient: true,
        },
        content: {
          es: {
            badge: "Potenciado por IA",
            title1: "Transforma tu",
            title2: "Inteligencia Emocional",
            subtitle: "La plataforma que combina neurociencia, IA y metodología Six Seconds para potenciar tu desarrollo personal y profesional",
            ctaPrimary: "Comenzar gratis",
            ctaSecondary: "Ver demo",
            trustBadges: [
              { icon: "shield", text: "Datos 100% seguros" },
              { icon: "globe", text: "Metodología Six Seconds" },
              { icon: "star", text: "+10,000 usuarios" },
            ],
          },
          en: {
            badge: "AI Powered",
            title1: "Transform your",
            title2: "Emotional Intelligence",
            subtitle: "The platform that combines neuroscience, AI and Six Seconds methodology to boost your personal and professional development",
            ctaPrimary: "Get started free",
            ctaSecondary: "Watch demo",
            trustBadges: [
              { icon: "shield", text: "100% secure data" },
              { icon: "globe", text: "Six Seconds methodology" },
              { icon: "star", text: "+10,000 users" },
            ],
          },
        },
      },
      {
        type: "FEATURES" as const,
        order: 2,
        name: "Features Section",
        config: {
          columns: 3,
          layout: "cards",
          showIcons: true,
        },
        content: {
          es: {
            title1: "Todo lo que necesitas para",
            title2: "crecer emocionalmente",
            subtitle: "Herramientas potentes impulsadas por inteligencia artificial para tu desarrollo personal",
            features: [
              {
                icon: "brain",
                title: "Evaluación SEI",
                description: "Descubre tus fortalezas emocionales con la evaluación científica de Six Seconds",
                gradient: "from-[var(--rowi-g1)] to-[var(--rowi-g3)]",
              },
              {
                icon: "message-circle",
                title: "Coach AI Personal",
                description: "Tu coach de inteligencia emocional disponible 24/7 para guiarte en tu desarrollo",
                gradient: "from-[var(--rowi-g2)] to-[var(--rowi-g3)]",
              },
              {
                icon: "users",
                title: "Afinidad Emocional",
                description: "Conecta con personas compatibles emocionalmente en tu organización",
                gradient: "from-[var(--rowi-g3)] to-[var(--rowi-g1)]",
              },
              {
                icon: "zap",
                title: "Ecosistema Integrado",
                description: "Todo conectado: evaluaciones, coaching, comunidades y progreso en un solo lugar",
                gradient: "from-[var(--rowi-g1)] to-[var(--rowi-g2)]",
              },
              {
                icon: "bar-chart",
                title: "Dashboard Inteligente",
                description: "Visualiza tu progreso emocional con métricas claras y recomendaciones personalizadas",
                gradient: "from-[var(--rowi-g2)] to-[var(--rowi-g1)]",
              },
              {
                icon: "target",
                title: "Metas y Seguimiento",
                description: "Define objetivos de desarrollo emocional y recibe seguimiento automático",
                gradient: "from-[var(--rowi-g3)] to-[var(--rowi-g2)]",
              },
            ],
          },
          en: {
            title1: "Everything you need to",
            title2: "grow emotionally",
            subtitle: "Powerful AI-powered tools for your personal development",
            features: [
              {
                icon: "brain",
                title: "SEI Assessment",
                description: "Discover your emotional strengths with Six Seconds scientific assessment",
                gradient: "from-[var(--rowi-g1)] to-[var(--rowi-g3)]",
              },
              {
                icon: "message-circle",
                title: "Personal AI Coach",
                description: "Your emotional intelligence coach available 24/7 to guide your development",
                gradient: "from-[var(--rowi-g2)] to-[var(--rowi-g3)]",
              },
              {
                icon: "users",
                title: "Emotional Affinity",
                description: "Connect with emotionally compatible people in your organization",
                gradient: "from-[var(--rowi-g3)] to-[var(--rowi-g1)]",
              },
              {
                icon: "zap",
                title: "Integrated Ecosystem",
                description: "Everything connected: assessments, coaching, communities and progress in one place",
                gradient: "from-[var(--rowi-g1)] to-[var(--rowi-g2)]",
              },
              {
                icon: "bar-chart",
                title: "Smart Dashboard",
                description: "Visualize your emotional progress with clear metrics and personalized recommendations",
                gradient: "from-[var(--rowi-g2)] to-[var(--rowi-g1)]",
              },
              {
                icon: "target",
                title: "Goals & Tracking",
                description: "Set emotional development goals and receive automatic follow-up",
                gradient: "from-[var(--rowi-g3)] to-[var(--rowi-g2)]",
              },
            ],
          },
        },
      },
      {
        type: "HOW_IT_WORKS" as const,
        order: 3,
        name: "How It Works",
        config: {
          columns: 3,
          showNumbers: true,
        },
        content: {
          es: {
            title: "Comienza en 3 simples pasos",
            subtitle: "Tu viaje hacia la inteligencia emocional empieza aquí",
            steps: [
              {
                number: "1",
                title: "Regístrate gratis",
                description: "Crea tu cuenta en segundos y accede a tu primer análisis emocional básico",
              },
              {
                number: "2",
                title: "Completa tu SEI",
                description: "Realiza la evaluación Six Seconds Emotional Intelligence para descubrir tu perfil",
              },
              {
                number: "3",
                title: "Crece con tu Coach AI",
                description: "Recibe recomendaciones personalizadas y acompañamiento continuo",
              },
            ],
          },
          en: {
            title: "Start in 3 simple steps",
            subtitle: "Your journey to emotional intelligence starts here",
            steps: [
              {
                number: "1",
                title: "Sign up free",
                description: "Create your account in seconds and access your first basic emotional analysis",
              },
              {
                number: "2",
                title: "Complete your SEI",
                description: "Take the Six Seconds Emotional Intelligence assessment to discover your profile",
              },
              {
                number: "3",
                title: "Grow with your AI Coach",
                description: "Receive personalized recommendations and continuous support",
              },
            ],
          },
        },
      },
      {
        type: "TESTIMONIALS" as const,
        order: 4,
        name: "Testimonials",
        config: {
          columns: 3,
          showRating: true,
        },
        content: {
          es: {
            title: "Lo que dicen nuestros usuarios",
            testimonials: [
              {
                quote: "Rowi transformó completamente mi forma de entender mis emociones. El coach AI es como tener un mentor personal disponible siempre.",
                author: "María García",
                role: "Directora de RRHH",
                rating: 5,
              },
              {
                quote: "La evaluación SEI me dio claridad sobre mis fortalezas. Ahora tomo mejores decisiones en mi empresa.",
                author: "Carlos Mendoza",
                role: "CEO & Founder",
                rating: 5,
              },
              {
                quote: "Increíble cómo la plataforma conecta equipos. La afinidad emocional mejoró nuestra colaboración enormemente.",
                author: "Ana Rodríguez",
                role: "Team Lead",
                rating: 5,
              },
            ],
          },
          en: {
            title: "What our users say",
            testimonials: [
              {
                quote: "Rowi completely transformed how I understand my emotions. The AI coach is like having a personal mentor always available.",
                author: "Maria Garcia",
                role: "HR Director",
                rating: 5,
              },
              {
                quote: "The SEI assessment gave me clarity about my strengths. Now I make better decisions in my company.",
                author: "Carlos Mendoza",
                role: "CEO & Founder",
                rating: 5,
              },
              {
                quote: "Incredible how the platform connects teams. Emotional affinity greatly improved our collaboration.",
                author: "Ana Rodriguez",
                role: "Team Lead",
                rating: 5,
              },
            ],
          },
        },
      },
      {
        type: "PRICING" as const,
        order: 5,
        name: "Pricing Section",
        config: {
          columns: 2,
          highlightPro: true,
        },
        content: {
          es: {
            title: "Planes simples y transparentes",
            subtitle: "Comienza gratis, actualiza cuando quieras",
            plans: [
              {
                name: "Gratuito",
                price: "$0",
                period: "/siempre",
                features: [
                  "Evaluación emocional básica",
                  "5 conversaciones con Coach AI/mes",
                  "Dashboard personal",
                  "Comunidad Rowi",
                ],
                cta: "Comenzar gratis",
                highlighted: false,
              },
              {
                name: "Pro",
                price: "$19",
                period: "/mes",
                badge: "Más popular",
                features: [
                  "Evaluación SEI completa",
                  "Coach AI ilimitado",
                  "Análisis de afinidad",
                  "Reportes avanzados",
                  "Soporte prioritario",
                ],
                cta: "Comenzar prueba gratis",
                highlighted: true,
              },
            ],
          },
          en: {
            title: "Simple and transparent pricing",
            subtitle: "Start free, upgrade when you want",
            plans: [
              {
                name: "Free",
                price: "$0",
                period: "/forever",
                features: [
                  "Basic emotional assessment",
                  "5 AI Coach conversations/month",
                  "Personal dashboard",
                  "Rowi community",
                ],
                cta: "Start free",
                highlighted: false,
              },
              {
                name: "Pro",
                price: "$19",
                period: "/month",
                badge: "Most popular",
                features: [
                  "Complete SEI assessment",
                  "Unlimited AI Coach",
                  "Affinity analysis",
                  "Advanced reports",
                  "Priority support",
                ],
                cta: "Start free trial",
                highlighted: true,
              },
            ],
          },
        },
      },
      {
        type: "CTA" as const,
        order: 6,
        name: "Final CTA",
        config: {
          layout: "centered",
          gradient: false,
        },
        content: {
          es: {
            title: "¿Listo para transformar tu inteligencia emocional?",
            subtitle: "Únete a miles de personas que ya están desarrollando su potencial emocional con Rowi",
            buttonText: "Comenzar mi viaje",
            buttonIcon: "heart",
          },
          en: {
            title: "Ready to transform your emotional intelligence?",
            subtitle: "Join thousands of people already developing their emotional potential with Rowi",
            buttonText: "Start my journey",
            buttonIcon: "heart",
          },
        },
      },
      {
        type: "FOOTER" as const,
        order: 7,
        name: "Footer",
        config: {
          showSocial: true,
          columns: 4,
        },
        content: {
          es: {
            brand: "Rowi SIA",
            links: [
              { label: "Términos", href: "/terms" },
              { label: "Privacidad", href: "/privacy" },
              { label: "Contacto", href: "/contact" },
            ],
            copyright: "Rowi. Todos los derechos reservados.",
          },
          en: {
            brand: "Rowi SIA",
            links: [
              { label: "Terms", href: "/terms" },
              { label: "Privacy", href: "/privacy" },
              { label: "Contact", href: "/contact" },
            ],
            copyright: "Rowi. All rights reserved.",
          },
        },
      },
    ];

    // Crear todas las secciones
    await prisma.landingSection.createMany({
      data: defaultSections,
    });

    return NextResponse.json({
      ok: true,
      message: "Landing initialized successfully",
      created: defaultSections.length,
    });
  } catch (e: any) {
    console.error("❌ POST /api/admin/landing-builder/init:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
