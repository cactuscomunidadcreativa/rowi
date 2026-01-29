// src/app/api/eco/compose/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";
import { isEcoLLMEnabled } from "@/domains/eco/libAI";

export const dynamic = "force-dynamic";

/* =========================================================
   🌐 ECO — Communication Engine con fallback sin IA
   Genera mensajes emocionalmente inteligentes basados en:
   - Brain Style del emisor y receptor
   - Talentos compartidos y complementarios
   - Competencias fuertes de ambos
========================================================= */
type Channel = "email" | "whatsapp" | "sms" | "call" | "speech";
type ComposeInput = {
  goal: string;
  channel: Channel;
  memberIds?: string[];
  freeTargets?: { name: string; brainStyle?: string; bio?: string }[];
  refine?: boolean;
  ask?: string;
  locale?: "es" | "en" | "pt" | "it";
};

/* =========================================================
   ⚙️ Setup IA (si está permitido)
========================================================= */
const ai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

/* =========================================================
   🧠 Brain Style Preferences - Cómo comunicarse con cada estilo
========================================================= */
const BRAIN_PREFS: Record<string, {
  prefers: string;
  tone: string;
  approach: string;
  avoid: string;
  openWith: string;
  dataStyle: string;
}> = {
  Strategist: {
    prefers: "claridad, foco y estructura",
    tone: "directo y preciso",
    approach: "Ve al grano con un plan claro. Presenta opciones con pros/contras.",
    avoid: "Rodeos, ambigüedad o detalles innecesarios",
    openWith: "Tengo una propuesta clara que quiero compartir contigo...",
    dataStyle: "Prefiere bullet points y resúmenes ejecutivos"
  },
  Scientist: {
    prefers: "datos, evidencia y método",
    tone: "analítico y fundamentado",
    approach: "Incluye datos, referencias o ejemplos concretos. Explica el 'por qué'.",
    avoid: "Afirmaciones sin respaldo o generalizaciones",
    openWith: "Basándome en [datos/observaciones], quiero proponerte...",
    dataStyle: "Prefiere estadísticas, comparaciones y análisis"
  },
  Guardian: {
    prefers: "estabilidad, confianza y seguridad",
    tone: "cauto y confiable",
    approach: "Genera confianza primero. Muestra que has pensado en los riesgos.",
    avoid: "Cambios bruscos o propuestas arriesgadas sin contexto",
    openWith: "Pensando en cómo podemos avanzar de forma segura...",
    dataStyle: "Prefiere ejemplos probados y referencias de confianza"
  },
  Deliverer: {
    prefers: "acción, resultados y eficiencia",
    tone: "concreto y orientado a resultados",
    approach: "Enfócate en qué se logrará y cuándo. Sé breve y accionable.",
    avoid: "Teoría excesiva o reuniones sin agenda clara",
    openWith: "Quiero proponerte algo que puede generar resultados rápidos...",
    dataStyle: "Prefiere métricas de impacto y timelines"
  },
  Inventor: {
    prefers: "ideas nuevas, posibilidades y creatividad",
    tone: "inspirador y abierto",
    approach: "Presenta la visión grande primero. Invita a co-crear.",
    avoid: "Limitaciones rígidas o 'siempre se ha hecho así'",
    openWith: "Imagina si pudiéramos...",
    dataStyle: "Prefiere conceptos visuales y posibilidades futuras"
  },
  Energizer: {
    prefers: "impacto, entusiasmo y conexión",
    tone: "motivador y dinámico",
    approach: "Muestra pasión y energía. Conecta emocionalmente primero.",
    avoid: "Monotonía o comunicación fría/transaccional",
    openWith: "¡Tengo algo emocionante que compartir contigo!",
    dataStyle: "Prefiere historias de impacto y testimonios"
  },
  Sage: {
    prefers: "significado, propósito y profundidad",
    tone: "reflexivo y con sentido",
    approach: "Conecta con el propósito mayor. Da espacio para reflexionar.",
    avoid: "Superficialidad o urgencia artificial",
    openWith: "He estado reflexionando sobre algo importante...",
    dataStyle: "Prefiere contexto histórico y significado a largo plazo"
  },
};

/* =========================================================
   🎯 Compatibilidad entre Brain Styles
========================================================= */
const STYLE_COMPATIBILITY: Record<string, Record<string, { tip: string; challenge: string }>> = {
  Strategist: {
    Scientist: { tip: "Comparten amor por la lógica", challenge: "Pueden ser muy fríos" },
    Inventor: { tip: "Strategist estructura las ideas del Inventor", challenge: "Velocidades diferentes" },
    Deliverer: { tip: "Ambos orientados a resultados", challenge: "Pueden chocar en el control" },
    Guardian: { tip: "Complementarios en planificación", challenge: "Guardian puede frenar al Strategist" },
    Energizer: { tip: "Energizer aporta pasión a los planes", challenge: "Estilos de comunicación opuestos" },
    Sage: { tip: "Sage da profundidad al Strategist", challenge: "Tiempos diferentes" },
  },
  Scientist: {
    Strategist: { tip: "Ambos valoran la precisión", challenge: "Pueden sobre-analizar" },
    Inventor: { tip: "Scientist valida ideas del Inventor", challenge: "Inventor puede frustrarse con tanto análisis" },
    Deliverer: { tip: "Scientist da fundamento, Deliverer ejecuta", challenge: "Deliverer impaciente con análisis largo" },
    Guardian: { tip: "Ambos cautelosos y metódicos", challenge: "Pueden ser muy lentos juntos" },
    Energizer: { tip: "Energizer motiva al Scientist", challenge: "Scientist puede ver al Energizer como superficial" },
    Sage: { tip: "Ambos disfrutan profundizar", challenge: "Pueden perderse en la teoría" },
  },
  // Simplified - add more as needed
};

/* =========================================================
   📊 Talent Labels en Español
========================================================= */
const TALENT_LABELS: Record<string, string> = {
  prioritizing: "Priorización",
  connection: "Conexión",
  emotionalInsight: "Perspicacia Emocional",
  reflecting: "Reflexión",
  problemSolving: "Resolución de Problemas",
  collaboration: "Colaboración",
  adaptability: "Adaptabilidad",
  criticalThinking: "Pensamiento Crítico",
  resilience: "Resiliencia",
  riskTolerance: "Tolerancia al Riesgo",
  imagination: "Imaginación",
  proactivity: "Proactividad",
  commitment: "Compromiso",
  vision: "Visión",
  designing: "Diseño",
  entrepreneurship: "Emprendimiento",
  dataMining: "Análisis de Datos",
  modeling: "Modelado",
};

/* =========================================================
   🚫 Talentos excluidos (no son talentos reales)
========================================================= */
const EXCLUDED_TALENTS = ["brainAgility", "BrainAgility", "brain_agility"];

/* =========================================================
   🧠 POST handler — Genera mensajes inteligentes
   - Sin IA: Genera mensaje estructurado basado en datos del perfil
   - Con IA: Genera un prompt completo para que el usuario lo use
========================================================= */
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase() || "";

    // Obtener usuario con su snapshot EQ
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        eqSnapshots: {
          orderBy: { at: "desc" },
          take: 1,
          include: { talents: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 401 });
    }

    const body = (await req.json()) as ComposeInput;
    const userSnap = user.eqSnapshots?.[0];
    const userBrainStyle = user.brainStyle || "Strategist";
    const userTalents = userSnap?.talents?.map(t => t.key) || [];

    // === Obtener datos del destinatario ===
    let targetData: {
      name: string;
      brainStyle: string;
      talents: string[];
      competencies: { key: string; score: number }[];
      bio?: string;
    } | null = null;

    // Si hay memberIds, obtener datos reales del miembro
    if (body.memberIds?.length) {
      const memberId = body.memberIds[0];

      // Check if it's a tenant user (starts with "user_")
      if (memberId.startsWith("user_")) {
        const realUserId = memberId.replace("user_", "");
        const memberUser = await prisma.user.findUnique({
          where: { id: realUserId },
          include: {
            eqSnapshots: {
              orderBy: { at: "desc" },
              take: 1,
              include: { talents: true, competencies: true },
            },
          },
        });

        if (memberUser) {
          const memberSnap = memberUser.eqSnapshots?.[0];
          targetData = {
            name: memberUser.name || "Contacto",
            brainStyle: memberUser.brainStyle || "Strategist",
            talents: memberSnap?.talents?.map(t => t.key) || [],
            competencies: memberSnap?.competencies?.map(c => ({ key: c.key, score: c.score || 0 })) || [],
          };
        }
      } else {
        // Regular community member
        const member = await prisma.communityMember.findUnique({
          where: { id: memberId },
        });

        if (member) {
          // Try to get linked user's EQ data
          let memberTalents: string[] = [];
          let memberCompetencies: { key: string; score: number }[] = [];

          if (member.userId) {
            const linkedUser = await prisma.user.findUnique({
              where: { id: member.userId },
              include: {
                eqSnapshots: {
                  orderBy: { at: "desc" },
                  take: 1,
                  include: { talents: true, competencies: true },
                },
              },
            });
            if (linkedUser?.eqSnapshots?.[0]) {
              memberTalents = linkedUser.eqSnapshots[0].talents?.map(t => t.key) || [];
              memberCompetencies = linkedUser.eqSnapshots[0].competencies?.map(c => ({ key: c.key, score: c.score || 0 })) || [];
            }
          }

          targetData = {
            name: member.name || "Contacto",
            brainStyle: member.brainStyle || "Strategist",
            talents: memberTalents,
            competencies: memberCompetencies,
          };
        }
      }
    }

    // Fallback a contacto externo
    if (!targetData && body.freeTargets?.length) {
      const freeTarget = body.freeTargets[0];
      targetData = {
        name: freeTarget.name || "Contacto",
        brainStyle: freeTarget.brainStyle || "Strategist",
        talents: [],
        competencies: [],
        bio: freeTarget.bio,
      };
    }

    // Default fallback
    if (!targetData) {
      targetData = {
        name: "tu contacto",
        brainStyle: "Strategist",
        talents: [],
        competencies: [],
      };
    }

    // === Análisis de compatibilidad ===
    const targetPrefs = BRAIN_PREFS[targetData.brainStyle] || BRAIN_PREFS.Strategist;
    const userPrefs = BRAIN_PREFS[userBrainStyle] || BRAIN_PREFS.Strategist;

    // Talentos compartidos (excluir brainAgility)
    const sharedTalents = userTalents
      .filter(t => targetData!.talents.includes(t))
      .filter(t => !EXCLUDED_TALENTS.includes(t));
    const sharedTalentLabels = sharedTalents.map(t => TALENT_LABELS[t] || t);

    // Competencias fuertes del destinatario (score > 70)
    const strongCompetencies = targetData.competencies
      .filter(c => c.score >= 70)
      .map(c => c.key);

    // Tips de compatibilidad
    const compatInfo = STYLE_COMPATIBILITY[userBrainStyle]?.[targetData.brainStyle];

    /* =========================================================
       🧩 Generar mensaje estructurado (sin consumir IA)
    ========================================================== */
    const generateStructuredMessage = () => {
      const channelFormats: Record<Channel, { maxLength: number; format: string }> = {
        email: { maxLength: 500, format: "formal con asunto" },
        whatsapp: { maxLength: 200, format: "conciso y amigable" },
        sms: { maxLength: 160, format: "muy breve" },
        call: { maxLength: 300, format: "guión conversacional" },
        speech: { maxLength: 400, format: "discurso con pausas" },
      };

      const format = channelFormats[body.channel];

      // Construir mensaje base según el brain style del destinatario
      let greeting = `Hola ${targetData!.name}`;
      let opening = targetPrefs.openWith;
      let body_text = body.goal;
      let closing = "";

      // Personalizar según canal
      if (body.channel === "email") {
        closing = `\n\nQuedo atento a tus comentarios.\n\nSaludos,\n${user.name || ""}`;
      } else if (body.channel === "whatsapp") {
        greeting = `¡Hola ${targetData!.name}! 👋`;
        closing = "\n\n¿Qué te parece?";
      } else if (body.channel === "call") {
        greeting = `[APERTURA] ${greeting}, ¿cómo estás?`;
        closing = "\n\n[CIERRE] ¿Te parece si agendamos una llamada para profundizar?";
      }

      // Construir el mensaje completo
      const fullMessage = `${greeting},\n\n${opening}\n\n${body_text}${closing}`;

      return {
        subject: body.channel === "email" ? `${body.goal.substring(0, 50)}${body.goal.length > 50 ? "..." : ""}` : null,
        text: fullMessage,
      };
    };

    /* =========================================================
       📝 Generar prompt para IA (cuando refine=true)
       - Prompt conciso y enfocado en lo accionable
       - Solo incluir los 3 talentos más relevantes
       - Evitar información redundante
    ========================================================== */
    const generateAIPrompt = () => {
      // Formato del canal
      const channelInstructions: Record<Channel, string> = {
        email: "Formato: Email profesional con asunto claro y cuerpo estructurado.",
        whatsapp: "Formato: WhatsApp (máx 200 caracteres, tono casual, directo).",
        sms: "Formato: SMS (máx 160 caracteres, muy breve).",
        call: "Formato: Guión de llamada con apertura, desarrollo y cierre.",
        speech: "Formato: Discurso breve con pausas naturales.",
      };

      // Solo mostrar los 3 talentos más relevantes para conexión
      const topSharedTalents = sharedTalentLabels.slice(0, 3);

      let prompt = `Escribe un ${body.channel === "email" ? "email" : body.channel === "whatsapp" ? "mensaje de WhatsApp" : body.channel === "sms" ? "SMS" : body.channel === "call" ? "guión de llamada" : "discurso"} para ${targetData!.name}.\n\n`;

      prompt += `**OBJETIVO:** ${body.goal}\n\n`;

      prompt += `**DESTINATARIO (${targetData!.brainStyle}):**\n`;
      prompt += `• Comunicación: ${targetPrefs.tone}\n`;
      prompt += `• Enfoque: ${targetPrefs.approach}\n`;
      prompt += `• NO usar: ${targetPrefs.avoid}\n\n`;

      if (topSharedTalents.length > 0) {
        prompt += `**PUNTOS DE CONEXIÓN:** ${topSharedTalents.join(", ")}\n\n`;
      }

      if (body.ask) {
        prompt += `**INSTRUCCIONES:** ${body.ask}\n\n`;
      }

      if (targetData!.bio) {
        prompt += `**CONTEXTO:** ${targetData!.bio}\n\n`;
      }

      prompt += `${channelInstructions[body.channel]}`;

      return prompt;
    };

    /* =========================================================
       🔀 Decidir modo: Con IA o Sin IA
    ========================================================== */
    const allowAI = user?.allowAI || false;
    const ecoEnabled = allowAI && isEcoLLMEnabled() && body.refine;

    if (!ecoEnabled) {
      // Modo sin IA - devolver mensaje estructurado + prompt para copiar
      const baseMessage = generateStructuredMessage();
      const aiPrompt = generateAIPrompt();

      return NextResponse.json({
        ok: true,
        mode: "smart-local",
        base: baseMessage,
        refined: null,
        // Datos de análisis para mostrar en UI
        analysis: {
          targetBrainStyle: targetData.brainStyle,
          targetPrefs: {
            prefers: targetPrefs.prefers,
            tone: targetPrefs.tone,
            approach: targetPrefs.approach,
            avoid: targetPrefs.avoid,
            dataStyle: targetPrefs.dataStyle,
          },
          sharedTalents: sharedTalentLabels,
          strongCompetencies,
          compatibility: compatInfo || null,
        },
        // Prompt listo para copiar y usar en ChatGPT/Claude
        aiPrompt: body.refine ? aiPrompt : null,
        note: "💡 Mensaje generado según el perfil del destinatario. Activa 'Refinar con IA' para obtener un prompt personalizado.",
      });
    }

    /* =========================================================
       🤖 Modo con IA — usar OpenAI (solo si refine=true)
    ========================================================== */
    const systemPrompt = `Eres ECO, un experto en comunicación emocionalmente inteligente.
Tu trabajo es generar mensajes altamente personalizados basados en el perfil cognitivo del receptor.

REGLAS:
1. Adapta el tono y estructura al Brain Style del receptor
2. Si hay talentos compartidos, úsalos para crear conexión
3. Respeta el canal de comunicación (longitud y formalidad)
4. Sé auténtico, no genérico

Responde SOLO en formato JSON:
{
  "subject": "Asunto (solo para email, null para otros)",
  "text": "Cuerpo del mensaje"
}`;

    const userPrompt = generateAIPrompt();

    const completion = await ai!.chat.completions.create({
      model: "gpt-4o-mini", // Usar mini para ahorrar tokens
      temperature: 0.7,
      max_tokens: 500,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0].message?.content || "{}";
    const parsed = JSON.parse(raw);

    return NextResponse.json({
      ok: true,
      mode: "ai-refined",
      base: generateStructuredMessage(),
      refined: parsed,
      analysis: {
        targetBrainStyle: targetData.brainStyle,
        targetPrefs: {
          prefers: targetPrefs.prefers,
          tone: targetPrefs.tone,
          approach: targetPrefs.approach,
          avoid: targetPrefs.avoid,
        },
        sharedTalents: sharedTalentLabels,
        compatibility: compatInfo || null,
      },
      tokensUsed: completion.usage?.total_tokens || 0,
    });
  } catch (e: any) {
    console.error("❌ /api/eco/compose error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error interno en ECO" },
      { status: 500 }
    );
  }
}