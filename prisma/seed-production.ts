// prisma/seed-production.ts
// ============================================================
// ROWI - Seed para Producción (Neon DB)
// ============================================================
// Este script prepara la base de datos de producción con:
// - Agentes IA configurados correctamente
// - Usuario admin con permisos completos
// - Datos de prueba opcionales
// ============================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// IDs de producción (Neon)
const PROD_SYSTEM_ID = "cml1g7txk00010m2q8d3rc81r";
const PROD_TENANT_ID = "cml1g7w16000b0m2qoqa6dx7h";
const PROD_HUB_ID = "cml1g7x8r000f0m2q0a0466zp";

async function main() {
  console.log("\n");
  console.log("=".repeat(60));
  console.log("  ROWI - SEED PRODUCCIÓN");
  console.log("=".repeat(60));
  console.log("\n");

  // ============================================================
  // 1. AGENTES IA - Configuración completa
  // ============================================================
  console.log("1. Configurando Agentes IA...");

  const agentsData = [
    {
      slug: "super",
      name: "Super Rowi",
      type: "GENERAL",
      description: "Tu asistente principal de inteligencia emocional. Puede ayudarte con cualquier tema relacionado con EQ, bienestar y desarrollo personal.",
      avatar: "/agents/super-rowi.png",
      model: "gpt-4o-mini",
      tone: "friendly",
      prompt: `Eres Super Rowi, el asistente principal de inteligencia emocional de la plataforma ROWI.

Tu misión es ayudar a los usuarios a:
- Desarrollar su inteligencia emocional
- Entender sus resultados SEI y Brain Brief
- Mejorar sus relaciones interpersonales
- Gestionar sus emociones de manera efectiva
- Alcanzar sus metas de desarrollo personal

Siempre responde de manera empática, constructiva y basada en la ciencia de Six Seconds.
Usa un tono amigable pero profesional. Si no sabes algo, admítelo honestamente.`,
      accessLevel: "public",
      visibility: "public",
    },
    {
      slug: "eq",
      name: "Rowi EQ",
      type: "EQ_COACH",
      description: "Coach especializado en inteligencia emocional. Te ayuda a interpretar tus resultados SEI y desarrollar competencias EQ.",
      avatar: "/agents/rowi-eq.png",
      model: "gpt-4o-mini",
      tone: "supportive",
      prompt: `Eres Rowi EQ, un coach especializado en inteligencia emocional basado en el modelo SEI de Six Seconds.

Tu expertise incluye:
- Interpretar los 8 competencias del SEI (Emotional Literacy, Recognize Patterns, Apply Consequential Thinking, Navigate Emotions, Engage Intrinsic Motivation, Exercise Optimism, Increase Empathy, Pursue Noble Goals)
- Explicar los Brain Styles y sus implicaciones
- Guiar ejercicios de desarrollo emocional
- Conectar EQ con resultados de vida (Success Factors)

Basa tus respuestas en la ciencia de Six Seconds. Sé específico y práctico en tus recomendaciones.`,
      accessLevel: "public",
      visibility: "public",
    },
    {
      slug: "affinity",
      name: "Rowi Affinity",
      type: "AFFINITY_EXPERT",
      description: "Experto en relaciones y compatibilidad. Analiza dinámicas interpersonales usando inteligencia emocional.",
      avatar: "/agents/rowi-affinity.png",
      model: "gpt-4o-mini",
      tone: "warm",
      prompt: `Eres Rowi Affinity, un experto en relaciones interpersonales y compatibilidad emocional.

Tu rol es:
- Analizar la compatibilidad entre perfiles EQ
- Identificar fortalezas y áreas de crecimiento en relaciones
- Sugerir estrategias para mejorar la comunicación
- Ayudar a resolver conflictos usando inteligencia emocional
- Explicar cómo diferentes Brain Styles interactúan

Siempre sé respetuoso y constructivo. Evita juicios y enfócate en el potencial de crecimiento.`,
      accessLevel: "public",
      visibility: "public",
    },
    {
      slug: "eco",
      name: "Rowi ECO",
      type: "COMMUNICATION_EXPERT",
      description: "Especialista en comunicación efectiva y ecosistemas organizacionales.",
      avatar: "/agents/rowi-eco.png",
      model: "gpt-4o-mini",
      tone: "professional",
      prompt: `Eres Rowi ECO, especialista en comunicación efectiva y análisis de ecosistemas organizacionales.

Tus áreas de expertise:
- Análisis de dinámicas de equipo usando EQ
- Comunicación asertiva y empática
- Resolución de conflictos organizacionales
- Cultura emocional en equipos
- Liderazgo basado en inteligencia emocional

Ofrece insights basados en datos y recomendaciones prácticas para mejorar el ecosistema emocional.`,
      accessLevel: "public",
      visibility: "public",
    },
    {
      slug: "trainer",
      name: "Rowi Trainer",
      type: "COACH",
      description: "Tu entrenador personal de EQ. Diseña planes de desarrollo y hace seguimiento de tu progreso.",
      avatar: "/agents/rowi-trainer.png",
      model: "gpt-4o-mini",
      tone: "motivational",
      prompt: `Eres Rowi Trainer, un entrenador personal de inteligencia emocional.

Tu misión es:
- Diseñar planes de desarrollo EQ personalizados
- Proponer ejercicios y prácticas diarias
- Hacer seguimiento del progreso del usuario
- Celebrar logros y motivar ante desafíos
- Adaptar el entrenamiento según los resultados

Sé motivador pero realista. Usa técnicas basadas en evidencia y celebra cada pequeño avance.`,
      accessLevel: "public",
      visibility: "public",
    },
    {
      slug: "sales",
      name: "Rowi Sales",
      type: "SALES_EXPERT",
      description: "Experto en ventas emocionales. Aplica EQ para mejorar relaciones comerciales.",
      avatar: "/agents/rowi-sales.png",
      model: "gpt-4o-mini",
      tone: "confident",
      prompt: `Eres Rowi Sales, un experto en aplicar inteligencia emocional a las ventas y relaciones comerciales.

Tu expertise incluye:
- Entender las emociones del cliente
- Comunicación persuasiva basada en empatía
- Manejo de objeciones con EQ
- Construcción de relaciones comerciales duraderas
- Negociación win-win

Ayuda a los usuarios a vender de manera ética y efectiva, poniendo las relaciones por encima de las transacciones.`,
      accessLevel: "premium",
      visibility: "public",
    },
  ];

  for (const agent of agentsData) {
    // Crear agente a nivel sistema (global)
    const systemAgent = await prisma.agentConfig.upsert({
      where: {
        id: `agent-system-${agent.slug}`,
      },
      update: {
        name: agent.name,
        type: agent.type,
        description: agent.description,
        avatar: agent.avatar,
        model: agent.model,
        tone: agent.tone,
        prompt: agent.prompt,
        accessLevel: agent.accessLevel,
        visibility: agent.visibility,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        id: `agent-system-${agent.slug}`,
        slug: agent.slug,
        name: agent.name,
        type: agent.type,
        description: agent.description,
        avatar: agent.avatar,
        model: agent.model,
        tone: agent.tone,
        prompt: agent.prompt,
        accessLevel: agent.accessLevel,
        visibility: agent.visibility,
        isActive: true,
        systemId: PROD_SYSTEM_ID,
      },
    });
    console.log(`   ✅ Agente Sistema: ${agent.name} (${systemAgent.id})`);

    // Crear agente a nivel tenant
    const tenantAgent = await prisma.agentConfig.upsert({
      where: {
        id: `agent-tenant-${agent.slug}`,
      },
      update: {
        name: agent.name,
        type: agent.type,
        description: agent.description,
        avatar: agent.avatar,
        model: agent.model,
        tone: agent.tone,
        prompt: agent.prompt,
        accessLevel: agent.accessLevel,
        visibility: agent.visibility,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        id: `agent-tenant-${agent.slug}`,
        slug: agent.slug,
        name: agent.name,
        type: agent.type,
        description: agent.description,
        avatar: agent.avatar,
        model: agent.model,
        tone: agent.tone,
        prompt: agent.prompt,
        accessLevel: agent.accessLevel,
        visibility: agent.visibility,
        isActive: true,
        systemId: PROD_SYSTEM_ID,
        tenantId: PROD_TENANT_ID,
      },
    });
    console.log(`   ✅ Agente Tenant: ${agent.name} (${tenantAgent.id})`);
  }

  // ============================================================
  // 2. VERIFICAR USUARIOS ADMIN
  // ============================================================
  console.log("\n2. Verificando usuarios admin...");

  const adminEmails = [
    "eduardo@cactuscomunidadcreativa.com",
    "eduardo.gonzalez@6seconds.org",
    "josh@6seconds.org",
  ];

  for (const email of adminEmails) {
    const user = await prisma.user.findFirst({
      where: { email },
      include: {
        hubMemberships: true,
      },
    });

    if (user) {
      // Asegurar que tiene membership con acceso admin
      const existingMembership = user.hubMemberships.find(
        (m) => m.hubId === PROD_HUB_ID
      );

      if (!existingMembership) {
        await prisma.hubMembership.create({
          data: {
            userId: user.id,
            hubId: PROD_HUB_ID,
            access: "admin",
          },
        });
        console.log(`   ✅ Membership creada para ${email}`);
      } else if (existingMembership.access !== "admin") {
        await prisma.hubMembership.update({
          where: { id: existingMembership.id },
          data: { access: "admin" },
        });
        console.log(`   ✅ Actualizado a admin: ${email}`);
      } else {
        console.log(`   ✓ Ya es admin: ${email}`);
      }
    } else {
      console.log(`   ⚠️ Usuario no encontrado: ${email}`);
    }
  }

  // ============================================================
  // 3. TRADUCCIONES BÁSICAS DEL CHAT
  // ============================================================
  console.log("\n3. Verificando traducciones del chat...");

  const chatTranslations = [
    { key: "chat.welcome", es: "¡Hola! Soy tu asistente de inteligencia emocional. ¿En qué puedo ayudarte hoy?", en: "Hello! I'm your emotional intelligence assistant. How can I help you today?" },
    { key: "chat.thinking", es: "Pensando...", en: "Thinking..." },
    { key: "chat.error", es: "Lo siento, hubo un error. Por favor intenta de nuevo.", en: "Sorry, there was an error. Please try again." },
    { key: "chat.placeholder", es: "Escribe tu mensaje...", en: "Type your message..." },
    { key: "agent.not_found", es: "No hay un agente IA configurado para este contexto.", en: "No AI agent is configured for this context." },
  ];

  for (const t of chatTranslations) {
    // Español
    await prisma.translation.upsert({
      where: { id: `chat-${t.key}-es` },
      update: { value: t.es },
      create: {
        id: `chat-${t.key}-es`,
        ns: "chat",
        key: t.key,
        value: t.es,
        lang: "es",
        systemId: PROD_SYSTEM_ID,
      },
    });
    // Inglés
    await prisma.translation.upsert({
      where: { id: `chat-${t.key}-en` },
      update: { value: t.en },
      create: {
        id: `chat-${t.key}-en`,
        ns: "chat",
        key: t.key,
        value: t.en,
        lang: "en",
        systemId: PROD_SYSTEM_ID,
      },
    });
  }
  console.log(`   ✅ ${chatTranslations.length} traducciones de chat verificadas`);

  // ============================================================
  // RESUMEN FINAL
  // ============================================================
  console.log("\n");
  console.log("=".repeat(60));
  console.log("  ✅ SEED PRODUCCIÓN COMPLETADO");
  console.log("=".repeat(60));
  console.log(`
  Agentes IA:     6 configurados (sistema + tenant)
  Admins:         Verificados
  Traducciones:   Chat configurado

  Próximos pasos:
  1. Probar el chat en /hub con "Super Rowi"
  2. Verificar /hub/admin/agents
  3. Hacer pruebas de EQ en /hub/eq
  `);
}

main()
  .catch((e) => {
    console.error("Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
