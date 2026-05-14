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
       📝 Prompt para IA — contexto en prosa, NO en bullets
       (si le pasamos bullets, el AI tiende a producir bullets)
    ========================================================= */
    const generateAIPrompt = () => {
      const channelHint: Record<Channel, string> = {
        email: "Es un email. Formal pero humano. Asunto breve + cuerpo en párrafos.",
        whatsapp: "Es un WhatsApp. Casual, directo, máximo 200 caracteres. Sin saludo formal.",
        sms: "Es un SMS. Muy breve, máximo 160 caracteres.",
        call: "Es un guión de llamada. Conversacional, con un par de transiciones naturales.",
        speech: "Es un discurso breve. Lenguaje hablado, con pausas implícitas.",
      };

      const recipientNames = targets.map((t) => t.name);
      const greetingName =
        recipientNames.length === 1
          ? recipientNames[0]
          : recipientNames.length === 2
            ? recipientNames.join(" y ")
            : recipientNames.slice(0, -1).join(", ") + " y " + recipientNames[recipientNames.length - 1];

      let prompt = isGroup
        ? `Vas a escribir un mensaje dirigido a un grupo: ${greetingName}. ${channelHint[body.channel]}\n\nLo que quiero comunicarles: ${body.goal}\n\n`
        : `Vas a escribir un mensaje para ${targets[0].name}. ${channelHint[body.channel]}\n\nLo que quiero comunicar: ${body.goal}\n\n`;

      // Contexto interno en prosa narrativa, NO bullets — para que el AI no lo copie.
      if (isGroup) {
        const dominantStyle =
          Object.entries(styleDistribution).sort((a, b) => b[1] - a[1])[0]?.[0];

        prompt += `Contexto interno (no lo cites en el mensaje): este grupo mezcla varios perfiles cognitivos. `;
        const stylePhrases = perTarget.map(
          (pt) => `${pt.name} es ${pt.brainStyle.toLowerCase()} (responde mejor a un tono ${pt.prefs.tone})`
        );
        prompt += stylePhrases.join("; ") + ". ";

        if (dominantStyle) {
          prompt += `El estilo más común en el grupo es ${dominantStyle.toLowerCase()}. `;
        }
        if (commonAcrossAll.length > 0) {
          prompt += `Algo que compartes con todos: ${commonAcrossAll.slice(0, 3).join(", ").toLowerCase()}. `;
        }
        prompt += `Recuerda: no menciones nada de esto explícitamente en el mensaje; úsalo solo para calibrar tono y ejemplos.\n\n`;
      } else {
        const only = perTarget[0];
        prompt += `Contexto interno (no lo cites en el mensaje): ${only.name} es ${only.brainStyle.toLowerCase()}, responde mejor a un tono ${only.prefs.tone}. `;
        if (only.sharedTalents.length > 0) {
          prompt += `Comparten estos talentos: ${only.sharedTalents.slice(0, 3).join(", ").toLowerCase()}. `;
        }
        if (only.bio) prompt += `Contexto adicional: ${only.bio}. `;
        prompt += `Úsalo para calibrar, no para mencionarlo.\n\n`;
      }

      if (body.ask) {
        prompt += `Instrucción específica del remitente: ${body.ask}\n\n`;
      }

      prompt += `Devuelve el JSON con subject (o null), text (mensaje natural sin bullets) ${
        isGroup
          ? "e insight (2-4 frases para mí explicando qué tienen en común y cómo abordarlos)"
          : "e insight: null"
      }.`;
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
       Devuelve DOS cosas:
         - "text": el mensaje real, natural, listo para enviar
         - "insight": (solo cuando isGroup) análisis privado para el
           remitente sobre qué tienen en común y cómo abordarlos
    ========================================================= */
    try {
      const systemPrompt = `Eres ECO, un experto en comunicación emocionalmente inteligente.
Generas DOS cosas distintas: un MENSAJE para enviar, y un INSIGHT privado para el remitente.

=== REGLAS DEL MENSAJE (text) ===
- Suena como una persona escribiendo a otra(s), no como un template corporativo.
- NO uses bullet points, NO uses "pros/contras", NO uses secciones marcadas con headers, NO uses asteriscos ni markdown.
- Frases completas, párrafos breves (2-4 frases por párrafo).
- Tono cálido, conversacional, adaptado al canal (email un poco más formal, WhatsApp casual, SMS muy breve).
- Si hay varios destinatarios, escríbeles como si los conocieras a todos a la vez ("Hola Jaime, María y Daniela," / "Quiero plantearles..." / "¿qué les parece?").
- NUNCA menciones explícitamente brain styles, "perfil cognitivo", talentos, ni el análisis. Eso es información tuya como redactor, no se cuela en el mensaje.
- El mensaje cuenta la idea principal en lenguaje humano, no la formula como receta.

=== REGLAS DEL INSIGHT (insight, solo si hay varios destinatarios) ===
- 2-4 frases CORTAS, dirigidas al remitente (uso de "tú").
- Aterriza qué tienen en común los destinatarios y dónde difieren.
- Sugerencia ACCIONABLE de cómo abordarlos sin asumir nada.
- Tono útil, no académico. No repitas la palabra "denominador común" — sé concreto.

=== IDIOMA ===
Escribe en español a menos que se indique otro idioma.

=== FORMATO DE RESPUESTA ===
Responde SOLO en JSON válido:
{
  "subject": "Asunto del email, o null para otros canales",
  "text": "El mensaje natural listo para enviar, sin markdown ni bullets",
  "insight": "Insight privado de 2-4 frases sobre el grupo (solo si hay 2+ destinatarios; null si hay 1)"
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
