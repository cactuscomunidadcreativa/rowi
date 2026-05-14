// src/app/api/eco/compose/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";
import { isEcoLLMEnabled } from "@/domains/eco/libAI";
import { getOpenAIClient } from "@/lib/openai/client";

export const dynamic = "force-dynamic";

/* =========================================================
   🌐 ECO — Communication Engine con fallback sin IA
   Genera mensajes emocionalmente inteligentes basados en:
   - Brain Style del emisor y cada receptor
   - Talentos compartidos y complementarios
   - Competencias fuertes de cada destinatario
   - Si hay varios destinatarios, el mensaje se adapta al GRUPO
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

interface TargetData {
  name: string;
  brainStyle: string;
  talents: string[];
  competencies: { key: string; score: number }[];
  bio?: string;
}

/* =========================================================
   🧠 Brain Style Preferences — Cómo comunicarse con cada estilo
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
    dataStyle: "Prefiere bullet points y resúmenes ejecutivos",
  },
  Scientist: {
    prefers: "datos, evidencia y método",
    tone: "analítico y fundamentado",
    approach: "Incluye datos, referencias o ejemplos concretos. Explica el 'por qué'.",
    avoid: "Afirmaciones sin respaldo o generalizaciones",
    openWith: "Basándome en [datos/observaciones], quiero proponerte...",
    dataStyle: "Prefiere estadísticas, comparaciones y análisis",
  },
  Guardian: {
    prefers: "estabilidad, confianza y seguridad",
    tone: "cauto y confiable",
    approach: "Genera confianza primero. Muestra que has pensado en los riesgos.",
    avoid: "Cambios bruscos o propuestas arriesgadas sin contexto",
    openWith: "Pensando en cómo podemos avanzar de forma segura...",
    dataStyle: "Prefiere ejemplos probados y referencias de confianza",
  },
  Deliverer: {
    prefers: "acción, resultados y eficiencia",
    tone: "concreto y orientado a resultados",
    approach: "Enfócate en qué se logrará y cuándo. Sé breve y accionable.",
    avoid: "Teoría excesiva o reuniones sin agenda clara",
    openWith: "Quiero proponerte algo que puede generar resultados rápidos...",
    dataStyle: "Prefiere métricas de impacto y timelines",
  },
  Inventor: {
    prefers: "ideas nuevas, posibilidades y creatividad",
    tone: "inspirador y abierto",
    approach: "Presenta la visión grande primero. Invita a co-crear.",
    avoid: "Limitaciones rígidas o 'siempre se ha hecho así'",
    openWith: "Imagina si pudiéramos...",
    dataStyle: "Prefiere conceptos visuales y posibilidades futuras",
  },
  Energizer: {
    prefers: "impacto, entusiasmo y conexión",
    tone: "motivador y dinámico",
    approach: "Muestra pasión y energía. Conecta emocionalmente primero.",
    avoid: "Monotonía o comunicación fría/transaccional",
    openWith: "¡Tengo algo emocionante que compartir contigo!",
    dataStyle: "Prefiere historias de impacto y testimonios",
  },
  Sage: {
    prefers: "significado, propósito y profundidad",
    tone: "reflexivo y con sentido",
    approach: "Conecta con el propósito mayor. Da espacio para reflexionar.",
    avoid: "Superficialidad o urgencia artificial",
    openWith: "He estado reflexionando sobre algo importante...",
    dataStyle: "Prefiere contexto histórico y significado a largo plazo",
  },
};

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

const EXCLUDED_TALENTS = ["brainAgility", "BrainAgility", "brain_agility"];

/* =========================================================
   🔎 Helper — Resuelve un memberId a TargetData
========================================================= */
async function getTargetForMember(memberId: string): Promise<TargetData | null> {
  // Caso 1: tenant user (memberId prefijado con "user_")
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
    if (!memberUser) return null;
    const snap = memberUser.eqSnapshots?.[0];
    return {
      name: memberUser.name || "Contacto",
      brainStyle: memberUser.brainStyle || "Strategist",
      talents: snap?.talents?.map((t) => t.key) || [],
      competencies:
        snap?.competencies?.map((c) => ({ key: c.key, score: c.score || 0 })) || [],
    };
  }

  // Caso 2: community member
  const member = await prisma.communityMember.findUnique({
    where: { id: memberId },
  });
  if (!member) return null;

  let talents: string[] = [];
  let competencies: { key: string; score: number }[] = [];

  if (member.userId) {
    const linked = await prisma.user.findUnique({
      where: { id: member.userId },
      include: {
        eqSnapshots: {
          orderBy: { at: "desc" },
          take: 1,
          include: { talents: true, competencies: true },
        },
      },
    });
    if (linked?.eqSnapshots?.[0]) {
      talents = linked.eqSnapshots[0].talents?.map((t) => t.key) || [];
      competencies =
        linked.eqSnapshots[0].competencies?.map((c) => ({
          key: c.key,
          score: c.score || 0,
        })) || [];
    }
  }

  return {
    name: member.name || "Contacto",
    brainStyle: member.brainStyle || "Strategist",
    talents,
    competencies,
  };
}

/* =========================================================
   🧠 POST — Genera mensaje para 1 o varios destinatarios
========================================================= */
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase() || "";

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
    const userTalents = userSnap?.talents?.map((t) => t.key) || [];

    /* =========================================================
       👥 Resolver TODOS los destinatarios (no solo el primero)
       Paraleliza los fetch para no agregar latencia con N personas.
    ========================================================= */
    const targets: TargetData[] = [];

    if (body.memberIds?.length) {
      const memberTargets = await Promise.all(
        body.memberIds.map((id) => getTargetForMember(id))
      );
      for (const t of memberTargets) if (t) targets.push(t);
    }

    if (body.freeTargets?.length) {
      for (const ft of body.freeTargets) {
        if (!ft.name?.trim()) continue;
        targets.push({
          name: ft.name,
          brainStyle: ft.brainStyle || "Strategist",
          talents: [],
          competencies: [],
          bio: ft.bio,
        });
      }
    }

    // Si no hay nadie, usar fallback genérico (mantiene compat con caller existente)
    if (targets.length === 0) {
      targets.push({
        name: "tu contacto",
        brainStyle: "Strategist",
        talents: [],
        competencies: [],
      });
    }

    /* =========================================================
       📊 Análisis por destinatario + análisis agregado del grupo
    ========================================================= */
    const userPrefs = BRAIN_PREFS[userBrainStyle] || BRAIN_PREFS.Strategist;

    const perTarget = targets.map((target) => {
      const prefs = BRAIN_PREFS[target.brainStyle] || BRAIN_PREFS.Strategist;
      const sharedTalents = userTalents
        .filter((t) => target.talents.includes(t))
        .filter((t) => !EXCLUDED_TALENTS.includes(t));
      const sharedTalentLabels = sharedTalents.map((t) => TALENT_LABELS[t] || t);
      const strongCompetencies = target.competencies
        .filter((c) => c.score >= 70)
        .map((c) => c.key);
      return {
        name: target.name,
        brainStyle: target.brainStyle,
        prefs: {
          prefers: prefs.prefers,
          tone: prefs.tone,
          approach: prefs.approach,
          avoid: prefs.avoid,
          dataStyle: prefs.dataStyle,
        },
        sharedTalents: sharedTalentLabels,
        strongCompetencies,
        bio: target.bio,
      };
    });

    // Talentos compartidos por TODOS los destinatarios (intersección)
    const commonAcrossAll =
      targets.length > 0
        ? userTalents
            .filter((t) => targets.every((tg) => tg.talents.includes(t)))
            .filter((t) => !EXCLUDED_TALENTS.includes(t))
            .map((t) => TALENT_LABELS[t] || t)
        : [];

    // Mix de brain styles del grupo
    const styleDistribution: Record<string, number> = {};
    for (const tg of targets) {
      styleDistribution[tg.brainStyle] = (styleDistribution[tg.brainStyle] || 0) + 1;
    }

    const isGroup = targets.length > 1;

    /* =========================================================
       🧩 Mensaje estructurado (fallback sin IA)
    ========================================================= */
    const generateStructuredMessage = () => {
      const recipientNames = targets.map((t) => t.name);
      const greetingName =
        recipientNames.length === 1
          ? recipientNames[0]
          : recipientNames.length === 2
            ? recipientNames.join(" y ")
            : recipientNames.slice(0, -1).join(", ") + " y " + recipientNames[recipientNames.length - 1];

      let greeting = `Hola ${greetingName}`;
      let opening = isGroup
        ? "Quiero compartir algo con ustedes que creo es importante para todos."
        : (BRAIN_PREFS[targets[0].brainStyle] || BRAIN_PREFS.Strategist).openWith;
      let body_text = body.goal;
      let closing = "";

      if (body.channel === "email") {
        closing = `\n\nQuedo atento a sus comentarios.\n\nSaludos,\n${user.name || ""}`;
      } else if (body.channel === "whatsapp") {
        greeting = `¡Hola ${greetingName}! 👋`;
        closing = isGroup ? "\n\n¿Qué les parece?" : "\n\n¿Qué te parece?";
      } else if (body.channel === "call") {
        greeting = `[APERTURA] ${greeting}, ¿cómo están?`;
        closing = "\n\n[CIERRE] ¿Les parece si agendamos para profundizar?";
      }

      const fullMessage = `${greeting},\n\n${opening}\n\n${body_text}${closing}`;

      return {
        subject: body.channel === "email"
          ? `${body.goal.substring(0, 50)}${body.goal.length > 50 ? "..." : ""}`
          : null,
        text: fullMessage,
      };
    };

    /* =========================================================
       📝 Prompt para IA — describe a TODO el grupo
    ========================================================= */
    const generateAIPrompt = () => {
      const channelInstructions: Record<Channel, string> = {
        email: "Formato: Email profesional con asunto claro y cuerpo estructurado.",
        whatsapp: "Formato: WhatsApp (máx 200 caracteres, tono casual, directo).",
        sms: "Formato: SMS (máx 160 caracteres, muy breve).",
        call: "Formato: Guión de llamada con apertura, desarrollo y cierre.",
        speech: "Formato: Discurso breve con pausas naturales.",
      };

      let prompt = isGroup
        ? `Escribe un ${body.channel === "email" ? "email" : body.channel === "whatsapp" ? "mensaje de WhatsApp" : body.channel === "sms" ? "SMS" : body.channel === "call" ? "guión de llamada" : "discurso"} dirigido a un GRUPO de ${targets.length} personas. El mensaje debe ser uno solo, pero debe conectar con todos los perfiles a la vez.\n\n`
        : `Escribe un ${body.channel === "email" ? "email" : body.channel === "whatsapp" ? "mensaje de WhatsApp" : body.channel === "sms" ? "SMS" : body.channel === "call" ? "guión de llamada" : "discurso"} para ${targets[0].name}.\n\n`;

      prompt += `**OBJETIVO:** ${body.goal}\n\n`;

      if (isGroup) {
        prompt += `**DESTINATARIOS (${targets.length} personas):**\n`;
        perTarget.forEach((pt, i) => {
          prompt += `${i + 1}. ${pt.name} — ${pt.brainStyle}\n`;
          prompt += `   • Tono preferido: ${pt.prefs.tone}\n`;
          prompt += `   • Enfoque: ${pt.prefs.approach}\n`;
          prompt += `   • Evitar: ${pt.prefs.avoid}\n`;
          if (pt.sharedTalents.length > 0) {
            prompt += `   • Talentos compartidos contigo: ${pt.sharedTalents.slice(0, 3).join(", ")}\n`;
          }
        });
        prompt += `\n`;

        if (commonAcrossAll.length > 0) {
          prompt += `**TALENTOS QUE COMPARTES CON TODO EL GRUPO:** ${commonAcrossAll.slice(0, 4).join(", ")}\n\n`;
        }

        const dominantStyle = Object.entries(styleDistribution).sort((a, b) => b[1] - a[1])[0]?.[0];
        if (dominantStyle) {
          prompt += `**ESTILO DOMINANTE EN EL GRUPO:** ${dominantStyle} (${styleDistribution[dominantStyle]}/${targets.length})\n\n`;
        }

        prompt += `**ESTRATEGIA:** Busca el denominador común entre los estilos. Si hay perfiles muy distintos, prioriza claridad y respeto por las diferencias. Evita lo que "Evitar" lista para más de un destinatario.\n\n`;
      } else {
        const only = perTarget[0];
        prompt += `**DESTINATARIO (${only.brainStyle}):**\n`;
        prompt += `• Comunicación: ${only.prefs.tone}\n`;
        prompt += `• Enfoque: ${only.prefs.approach}\n`;
        prompt += `• NO usar: ${only.prefs.avoid}\n\n`;
        if (only.sharedTalents.length > 0) {
          prompt += `**PUNTOS DE CONEXIÓN:** ${only.sharedTalents.slice(0, 3).join(", ")}\n\n`;
        }
        if (only.bio) prompt += `**CONTEXTO:** ${only.bio}\n\n`;
      }

      if (body.ask) {
        prompt += `**INSTRUCCIONES ADICIONALES:** ${body.ask}\n\n`;
      }

      prompt += `${channelInstructions[body.channel]}`;
      return prompt;
    };

    const baseMessage = generateStructuredMessage();

    // Para mantener compat con la UI existente, exponemos AMBAS formas:
    // - Campos "target*" (singular, basados en el primer destinatario)
    // - Campos "recipients[]", "commonAcrossAll", "styleDistribution" (grupo)
    const primary = perTarget[0];
    const analysisData = {
      // Nueva forma (grupo)
      isGroup,
      recipients: perTarget,
      commonAcrossAll,
      styleDistribution,
      // Legacy compat (UI vieja consume estos campos)
      targetBrainStyle: primary?.brainStyle,
      targetPrefs: primary?.prefs,
      sharedTalents: isGroup
        ? commonAcrossAll
        : primary?.sharedTalents || [],
      strongCompetencies: primary?.strongCompetencies || [],
      compatibility: null,
    };

    /* =========================================================
       🤖 Intentar con IA siempre
    ========================================================= */
    try {
      const systemPrompt = `Eres ECO, un experto en comunicación emocionalmente inteligente.
Tu trabajo es generar mensajes altamente personalizados basados en el perfil cognitivo del receptor (o receptores).

REGLAS:
1. Adapta el tono y estructura al Brain Style del receptor.
2. Si hay varios receptores, busca el denominador común y respeta las diferencias clave.
3. Si hay talentos compartidos, úsalos para crear conexión.
4. Respeta el canal de comunicación (longitud y formalidad).
5. Sé auténtico, no genérico.
6. El mensaje debe estar listo para enviar, NO generes un prompt.
7. Escribe en español a menos que se indique lo contrario.

Responde SOLO en formato JSON:
{
  "subject": "Asunto (solo para email, null para otros)",
  "text": "Cuerpo del mensaje listo para enviar"
}`;

      const userPrompt = generateAIPrompt();

      const ai = await getOpenAIClient();
      const completion = await ai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.7,
        max_tokens: 800,
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
        base: baseMessage,
        refined: parsed,
        analysis: analysisData,
        aiPrompt: null,
        tokensUsed: completion.usage?.total_tokens || 0,
      });
    } catch (aiError) {
      console.warn("⚠️ ECO AI fallback — usando mensaje estructurado:", aiError);
      return NextResponse.json({
        ok: true,
        mode: "smart-local",
        base: baseMessage,
        refined: null,
        analysis: analysisData,
        aiPrompt: null,
        note: isGroup
          ? "Mensaje generado para un grupo según el perfil de cada destinatario."
          : "Mensaje generado según el perfil del destinatario.",
      });
    }
  } catch (e: any) {
    console.error("❌ /api/eco/compose error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error interno en ECO" },
      { status: 500 }
    );
  }
}
