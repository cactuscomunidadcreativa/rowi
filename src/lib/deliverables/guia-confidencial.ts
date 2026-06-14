/**
 * 📄 Entregable: GUÍA CONFIDENCIAL DEL PARTNER (módulo Consulting).
 *
 * Clona el modelo validado (Guia_Confidencial_Partner_Bancolombia_ROWI):
 * "Guía de lectura e intervención" — el documento de preparación que se queda
 * SOLO con el partner facilitador. NO se comparte con el cliente. Diseña la
 * conversación, no la expone.
 *
 * Secciones:
 *  1. El mapa, en una mirada (equipos + persona puente)
 *  2. El espejo líder–equipo (el hallazgo más delicado)
 *  3. El movimiento entre dos tomas (señal humana) — opcional
 *  4. Otras señales a atender
 *  5. ¿Tocar el SEI o no? — tabla de decisión
 *  6. La conversación con la persona puente (cómo entrar / preguntas / qué evitar)
 *  7. Límites de confidencialidad y ética
 *
 * Datos: consume `insights.partner` (Insight[]) del motor real
 * (consultant/diagnosis-engine, vía /api/consultant/report) para los hallazgos
 * data-driven; el método (cómo entrar, preguntas, ética) es doctrina Rowi
 * estable. Texto HÍBRIDO: plantillas + `enrich` (IA) para los pasajes delicados.
 *
 * Server-side (pdfkit, vía deliverables/pdf-kit). Parametrizado por idioma.
 */
import { RowiPdf, C, type Lang } from "./pdf-kit";
import type { Insight } from "@/lib/consultant/diagnosis-engine";

// ── Entrada ──
export interface TeamMapRow {
  team: string; // "Piloto · Gerencia Desarrollo de Talento (13)"
  measured: string; // "TVS de equipo + SEI individual · oct 2025"
  bridgeRole: string; // "Líder de este equipo"
}

export interface MovementRow {
  strengthened: string; // "Navega Emociones +12.3"
  cooled: string; // "Optimismo -23.8 (ahora bajo la norma)"
}

export interface MirrorData {
  /** competencias que el equipo replica del líder (las más altas del líder) */
  replicated: string; // "empatía (+14.7), reconocer patrones (+13.5)…"
  lowestCompLabel: string; // "Navega Emociones"
  lowestCompValue: number; // 81.5
  pulsePointLed: string; // pulse point que el equipo lidera = el más bajo del líder
}

export interface GuiaConfidencialData {
  subjectLabel: string; // "Bancolombia" — nombre del proyecto/cliente
  scopeLabel: string; // "Vital Signs + SEI" o "Solo SEI"
  bridgePersonNote?: string; // contexto de la persona puente (identidad a confirmar)
  teamMap: TeamMapRow[];
  mirror?: MirrorData; // el espejo líder-equipo (si hay líder + equipo)
  movement?: { fromTo: string; rows: MovementRow[]; note?: string }; // dos tomas
  otherSignal?: string; // párrafo de §4
  partnerInsights: Insight[]; // del motor real (canasta partner)
  /** Textos de IA opcionales (plan superior) para los pasajes delicados. */
  enrich?: {
    mirrorReading?: string; // lectura del espejo líder-equipo
    bridgeQuestions?: string[]; // preguntas que abren sin encasillar
  };
}

type LStrings = (typeof L)[Lang];

// ── i18n ──
const L = {
  es: {
    eyebrow: "Documento confidencial · solo para el partner facilitador",
    title: "Guía de lectura e intervención",
    subtitle: (s: string, sc: string) => `${s} · ${sc} — qué hablar, cómo hablarlo y si tocar o no el SEI`,
    footer: "Be to Grow · EQ Latam — uso interno del partner · línea Rowi",
    badge: "CONFIDENCIAL",
    confLead: "Confidencialidad.",
    conf: "Este documento contiene lecturas individuales y de liderazgo que no deben compartirse con el cliente ni incluirse en la presentación oficial. Es material de preparación para el partner. La data personal de cada persona le pertenece a esa persona; aquí se usa solo para diseñar una conversación cuidadosa.",
    s1: "1 · El mapa, en una mirada",
    s1Intro: "Hay equipos y una persona que los conecta:",
    s1Cols: ["Equipo", "Qué se midió", "Rol de la persona puente"],
    s1Note: "La persona puente puede liderar un equipo y, a la vez, reportar/participar en otro. Identidad a confirmar con el cliente antes de personalizar nada.",
    s2: "2 · El espejo líder–equipo (el hallazgo más delicado y más útil)",
    s2Mirror: (rep: string) => `Como líder, la persona puente es el techo cálido de su equipo: por encima de los suyos en ${rep}.`,
    s2Lowest: (comp: string, v: number, pulse: string) => `Pero su competencia más baja es ${comp} — ${v.toFixed(1)}, por debajo de su propio equipo. Y el punto más bajo del equipo lidera es exactamente el mismo: ${pulse}.`,
    s2Read: "Lectura para el partner: lo que un líder no logra modelar en autorregulación tiende a reaparecer en el clima del equipo. Es la palanca de coaching más potente disponible — y también la más sensible. No se plantea como causa-efecto ni como “culpa”; se ofrece como espejo para que ella misma lo conecte.",
    s3: (ft: string) => `3 · El movimiento entre ${ft} (señal humana)`,
    s3Cols: ["Se fortaleció hacia adentro", "Se enfrió hacia afuera"],
    s3Care: "Manejar con cuidado.",
    s3CareTxt: "Un cambio así es una señal que merece una conversación humana, no un diagnóstico. Puede ser carga, un período difícil o varias cosas. No la nombres como problema clínico ni la interpretes por ella. Abre, escucha, deja que ella le ponga nombre.",
    s4: "4 · Otras señales a atender",
    s5: "5 · ¿Tocar el SEI o no? — guía de decisión",
    s5Cols: ["Situación", "¿SEI individual?", "Cómo"],
    s5Rows: [
      ["Presentación / propuesta al cliente", "No", "Solo TVS de equipo y SEI agregado. Nunca nombres ni perfiles individuales."],
      ["Debrief de equipo", "No a nivel persona", "Patrones del grupo (p. ej. “como equipo, navegar emociones es el reto”). Sin señalar a nadie."],
      ["Sesión 1:1 / coaching con la persona", "Sí, si ella lo autoriza", "Su SEI es de ella. Se trabaja con su permiso, en privado, como espejo — no como evaluación."],
      ["Conversación sobre otra persona", "Sí, solo con ella", "Nunca cruzar su data frente a terceros ni frente a su equipo."],
    ],
    s5Rule: "Regla simple: lo agregado es del proyecto; lo individual es de la persona. El SEI solo se “toca” en privado, con la persona dueña del dato, y con propósito de desarrollo.",
    s6: "6 · La conversación con la persona puente: qué y cómo",
    s6Enter: "Cómo entrar",
    s6EnterBullets: [
      "Sin diagnóstico y sin defender el reporte: el SEI es un espejo, no un veredicto.",
      "Empieza por reconocer lo que se fortaleció (regular emociones, adaptarse) antes de explorar lo que se enfrió.",
      "Una emoción por vez. Curiosidad antes que juicio.",
    ],
    s6Q: "Preguntas que abren sin encasillar",
    s6Qs: [
      "“Si miras estos meses, ¿cómo ha estado tu energía? ¿Qué te ha dado y qué te ha quitado?”",
      "“Algo se fortaleció —tu forma de regular emociones bajo presión— y algo se enfrió —tu optimismo y conexión con el propósito. ¿Resuena?”",
      "“Como líder, navegar emociones es tu mayor reto, y tu equipo comparte ese mismo reto. ¿Qué crees que podrías estar transmitiendo, sin querer, ahí?”",
    ],
    s6Avoid: "Qué evitar",
    s6AvoidBullets: [
      "Etiquetar (burnout, depresión, etc.). No es nuestro rol ni lo permite el dato.",
      "Comparar su perfil con el de su equipo o con el de otra persona delante de ella.",
      "Convertir el espejo líder-equipo en “tú eres la causa del problema del equipo”.",
    ],
    s7: "7 · Límites de confidencialidad y ética",
    s7Bullets: [
      "Agregado vs individual: el cliente recibe lecturas de equipo; las individuales quedan entre el partner y cada persona.",
      "Debrief de equipo ≠ exposición individual: el protocolo trabaja al equipo como grupo, no señala personas.",
      "Autorización: antes de personalizar el caso de la persona puente, confirmar su identidad y su consentimiento con el cliente.",
      "Señales de bienestar: si en la conversación aparece malestar significativo, el rol del partner es acompañar y, si corresponde, sugerir apoyo profesional — no diagnosticar.",
    ],
    finalLead: "Recordatorio final.",
    final: "Este material existe para que la conversación sea más humana y más útil, no para “tener data sobre alguien”. Si una lectura no ayuda a la persona, no se usa.",
    insightsTitle: "Señales del motor (canasta partner)",
    insightsIntro: "Lecturas individuales/sensibles que el motor de reglas marcó para el partner. No exponer al cliente.",
    flagSmallN: "n pequeño", flagDisp: "dispersión alta", flagWell: "bienestar",
  },
  en: {
    eyebrow: "Confidential document · for the facilitating partner only",
    title: "Reading & intervention guide",
    subtitle: (s: string, sc: string) => `${s} · ${sc} — what to discuss, how to discuss it, and whether to touch the SEI`,
    footer: "Be to Grow · EQ Latam — partner internal use · Rowi line",
    badge: "CONFIDENTIAL",
    confLead: "Confidentiality.",
    conf: "This document contains individual and leadership readings that must not be shared with the client or included in the official presentation. It is preparation material for the partner. Each person's personal data belongs to that person; here it is used only to design a careful conversation.",
    s1: "1 · The map, at a glance",
    s1Intro: "There are teams and one person who connects them:",
    s1Cols: ["Team", "What was measured", "Bridge person's role"],
    s1Note: "The bridge person may lead one team and, at the same time, report to or take part in another. Identity to confirm with the client before personalizing anything.",
    s2: "2 · The leader–team mirror (the most delicate and most useful finding)",
    s2Mirror: (rep: string) => `As a leader, the bridge person is the warm ceiling of their team: above their own people in ${rep}.`,
    s2Lowest: (comp: string, v: number, pulse: string) => `But their lowest competency is ${comp} — ${v.toFixed(1)}, below their own team. And the team's lowest point is exactly the same: ${pulse}.`,
    s2Read: "Read for the partner: what a leader can't model in self-regulation tends to reappear in the team's climate. It's the most powerful coaching lever available — and also the most sensitive. Don't frame it as cause-effect or as “blame”; offer it as a mirror so they connect it themselves.",
    s3: (ft: string) => `3 · The movement between ${ft} (human signal)`,
    s3Cols: ["Strengthened inward", "Cooled outward"],
    s3Care: "Handle with care.",
    s3CareTxt: "A change like this is a signal that deserves a human conversation, not a diagnosis. It may be load, a hard period, or several things. Don't name it as a clinical problem or interpret it for them. Open up, listen, let them name it.",
    s4: "4 · Other signals to attend to",
    s5: "5 · Touch the SEI or not? — decision guide",
    s5Cols: ["Situation", "Individual SEI?", "How"],
    s5Rows: [
      ["Client presentation / proposal", "No", "Team TVS and aggregate SEI only. Never names or individual profiles."],
      ["Team debrief", "Not at person level", "Group patterns (e.g. “as a team, navigating emotions is the challenge”). Without pointing at anyone."],
      ["1:1 session / coaching with the person", "Yes, if they authorize it", "Their SEI is theirs. Worked with their permission, in private, as a mirror — not an evaluation."],
      ["Conversation about another person", "Yes, only with them", "Never cross their data in front of others or their team."],
    ],
    s5Rule: "Simple rule: the aggregate belongs to the project; the individual belongs to the person. The SEI is only “touched” in private, with the person who owns the data, and for development.",
    s6: "6 · The conversation with the bridge person: what and how",
    s6Enter: "How to enter",
    s6EnterBullets: [
      "No diagnosis and no defending the report: the SEI is a mirror, not a verdict.",
      "Start by acknowledging what strengthened (regulating emotions, adapting) before exploring what cooled.",
      "One emotion at a time. Curiosity before judgment.",
    ],
    s6Q: "Questions that open without boxing in",
    s6Qs: [
      "“Looking at these months, how has your energy been? What gave to you and what took from you?”",
      "“Something strengthened —how you regulate emotions under pressure— and something cooled —your optimism and connection to purpose. Does that resonate?”",
      "“As a leader, navigating emotions is your biggest challenge, and your team shares that same challenge. What do you think you might be transmitting, unintentionally, there?”",
    ],
    s6Avoid: "What to avoid",
    s6AvoidBullets: [
      "Labeling (burnout, depression, etc.). It's not our role nor does the data allow it.",
      "Comparing their profile with their team's or another person's in front of them.",
      "Turning the leader-team mirror into “you are the cause of the team's problem”.",
    ],
    s7: "7 · Confidentiality & ethics limits",
    s7Bullets: [
      "Aggregate vs individual: the client receives team readings; individual ones stay between the partner and each person.",
      "Team debrief ≠ individual exposure: the protocol works the team as a group, it doesn't point at people.",
      "Authorization: before personalizing the bridge person's case, confirm their identity and consent with the client.",
      "Wellbeing signals: if significant distress appears in the conversation, the partner's role is to support and, if appropriate, suggest professional help — not to diagnose.",
    ],
    finalLead: "Final reminder.",
    final: "This material exists to make the conversation more human and more useful, not to “have data on someone”. If a reading doesn't help the person, it isn't used.",
    insightsTitle: "Engine signals (partner basket)",
    insightsIntro: "Individual/sensitive readings the rules engine flagged for the partner. Do not expose to the client.",
    flagSmallN: "small n", flagDisp: "high dispersion", flagWell: "wellbeing",
  },
  pt: {
    eyebrow: "Documento confidencial · só para o partner facilitador",
    title: "Guia de leitura e intervenção",
    subtitle: (s: string, sc: string) => `${s} · ${sc} — o que falar, como falar e se tocar ou não o SEI`,
    footer: "Be to Grow · EQ Latam — uso interno do partner · linha Rowi",
    badge: "CONFIDENCIAL",
    confLead: "Confidencialidade.",
    conf: "Este documento contém leituras individuais e de liderança que não devem ser compartilhadas com o cliente nem incluídas na apresentação oficial. É material de preparação para o partner. O dado pessoal de cada pessoa pertence a essa pessoa; aqui é usado apenas para desenhar uma conversa cuidadosa.",
    s1: "1 · O mapa, num olhar",
    s1Intro: "Há equipes e uma pessoa que as conecta:",
    s1Cols: ["Equipe", "O que se mediu", "Papel da pessoa ponte"],
    s1Note: "A pessoa ponte pode liderar uma equipe e, ao mesmo tempo, reportar/participar de outra. Identidade a confirmar com o cliente antes de personalizar qualquer coisa.",
    s2: "2 · O espelho líder–equipe (o achado mais delicado e mais útil)",
    s2Mirror: (rep: string) => `Como líder, a pessoa ponte é o teto caloroso de sua equipe: acima dos seus em ${rep}.`,
    s2Lowest: (comp: string, v: number, pulse: string) => `Mas sua competência mais baixa é ${comp} — ${v.toFixed(1)}, abaixo da própria equipe. E o ponto mais baixo que a equipe lidera é exatamente o mesmo: ${pulse}.`,
    s2Read: "Leitura para o partner: o que um líder não consegue modelar em autorregulação tende a reaparecer no clima da equipe. É a alavanca de coaching mais potente disponível — e também a mais sensível. Não se coloca como causa-efeito nem como “culpa”; oferece-se como espelho para que ela mesma conecte.",
    s3: (ft: string) => `3 · O movimento entre ${ft} (sinal humano)`,
    s3Cols: ["Fortaleceu para dentro", "Esfriou para fora"],
    s3Care: "Manejar com cuidado.",
    s3CareTxt: "Uma mudança assim é um sinal que merece uma conversa humana, não um diagnóstico. Pode ser carga, um período difícil ou várias coisas. Não a nomeie como problema clínico nem a interprete por ela. Abra, escute, deixe que ela dê o nome.",
    s4: "4 · Outros sinais a atender",
    s5: "5 · Tocar o SEI ou não? — guia de decisão",
    s5Cols: ["Situação", "SEI individual?", "Como"],
    s5Rows: [
      ["Apresentação / proposta ao cliente", "Não", "Só TVS de equipe e SEI agregado. Nunca nomes nem perfis individuais."],
      ["Debrief de equipe", "Não a nível pessoa", "Padrões do grupo (p. ex. “como equipe, navegar emoções é o desafio”). Sem apontar ninguém."],
      ["Sessão 1:1 / coaching com a pessoa", "Sim, se ela autorizar", "O SEI é dela. Trabalha-se com a permissão dela, em privado, como espelho — não como avaliação."],
      ["Conversa sobre outra pessoa", "Sim, só com ela", "Nunca cruzar o dado dela diante de terceiros nem da equipe."],
    ],
    s5Rule: "Regra simples: o agregado é do projeto; o individual é da pessoa. O SEI só se “toca” em privado, com a pessoa dona do dado, e com propósito de desenvolvimento.",
    s6: "6 · A conversa com a pessoa ponte: o quê e como",
    s6Enter: "Como entrar",
    s6EnterBullets: [
      "Sem diagnóstico e sem defender o relatório: o SEI é um espelho, não um veredito.",
      "Comece por reconhecer o que fortaleceu (regular emoções, adaptar-se) antes de explorar o que esfriou.",
      "Uma emoção por vez. Curiosidade antes do julgamento.",
    ],
    s6Q: "Perguntas que abrem sem rotular",
    s6Qs: [
      "“Olhando estes meses, como tem estado sua energia? O que te deu e o que te tirou?”",
      "“Algo fortaleceu —sua forma de regular emoções sob pressão— e algo esfriou —seu otimismo e conexão com o propósito. Ressoa?”",
      "“Como líder, navegar emoções é seu maior desafio, e sua equipe compartilha esse mesmo desafio. O que você acha que poderia estar transmitindo, sem querer, aí?”",
    ],
    s6Avoid: "O que evitar",
    s6AvoidBullets: [
      "Rotular (burnout, depressão, etc.). Não é nosso papel nem o dado permite.",
      "Comparar o perfil dela com o da equipe ou de outra pessoa na frente dela.",
      "Transformar o espelho líder-equipe em “você é a causa do problema da equipe”.",
    ],
    s7: "7 · Limites de confidencialidade e ética",
    s7Bullets: [
      "Agregado vs individual: o cliente recebe leituras de equipe; as individuais ficam entre o partner e cada pessoa.",
      "Debrief de equipe ≠ exposição individual: o protocolo trabalha a equipe como grupo, não aponta pessoas.",
      "Autorização: antes de personalizar o caso da pessoa ponte, confirmar a identidade e o consentimento com o cliente.",
      "Sinais de bem-estar: se na conversa aparecer mal-estar significativo, o papel do partner é acompanhar e, se for o caso, sugerir apoio profissional — não diagnosticar.",
    ],
    finalLead: "Lembrete final.",
    final: "Este material existe para que a conversa seja mais humana e mais útil, não para “ter dado sobre alguém”. Se uma leitura não ajuda a pessoa, não se usa.",
    insightsTitle: "Sinais do motor (cesta partner)",
    insightsIntro: "Leituras individuais/sensíveis que o motor de regras marcou para o partner. Não expor ao cliente.",
    flagSmallN: "n pequeno", flagDisp: "dispersão alta", flagWell: "bem-estar",
  },
};

export async function buildGuiaConfidencial(data: GuiaConfidencialData, lang: Lang = "es", owl?: Buffer): Promise<Buffer> {
  const t = L[lang];
  const pdf = new RowiPdf({ lang, footerLeft: t.footer, badge: t.badge, badgeColor: C.amberTxt, owl });

  pdf.header({ eyebrow: t.eyebrow, eyebrowColor: C.violet, title: t.title, subtitle: t.subtitle(data.subjectLabel, data.scopeLabel) });

  // Confidencialidad
  pdf.callout(t.conf, { lead: t.confLead, bg: C.violetBg, leadColor: C.violetDark });

  // 1 · El mapa
  pdf.h2(t.s1);
  pdf.para(t.s1Intro, { size: 9, color: C.muted });
  pdf.table(t.s1Cols, data.teamMap.map((r) => [r.team, r.measured, r.bridgeRole]), [0.36, 0.4, 0.24]);
  if (data.bridgePersonNote) pdf.note(data.bridgePersonNote);
  else pdf.note(t.s1Note);

  // 2 · El espejo líder–equipo
  if (data.mirror) {
    pdf.h2(t.s2);
    pdf.para(t.s2Mirror(data.mirror.replicated), { size: 9 });
    pdf.callout(t.s2Lowest(data.mirror.lowestCompLabel, data.mirror.lowestCompValue, data.mirror.pulsePointLed));
    pdf.para(data.enrich?.mirrorReading ?? t.s2Read, { size: 9 });
  }

  // 3 · El movimiento entre dos tomas
  if (data.movement) {
    pdf.h2(t.s3(data.movement.fromTo));
    if (data.movement.note) pdf.para(data.movement.note, { size: 9, color: C.muted });
    pdf.table(t.s3Cols, data.movement.rows.map((r) => [r.strengthened, r.cooled]), [0.5, 0.5]);
    pdf.callout(t.s3CareTxt, { lead: t.s3Care, bg: C.coralBg, leadColor: C.amberTxt });
  }

  // 4 · Otras señales
  if (data.otherSignal) {
    pdf.h2(t.s4);
    pdf.para(data.otherSignal, { size: 9 });
  }

  // 5 · ¿Tocar el SEI o no?
  pdf.h2(t.s5);
  pdf.table(t.s5Cols, t.s5Rows as unknown as string[][], [0.3, 0.2, 0.5]);
  pdf.note(t.s5Rule);

  // 6 · La conversación con la persona puente
  pdf.h2(t.s6);
  pdf.para(t.s6Enter, { size: 10, bold: true, color: C.violetDark });
  pdf.bullets(t.s6EnterBullets as unknown as string[]);
  pdf.para(t.s6Q, { size: 10, bold: true, color: C.violetDark });
  for (const q of (data.enrich?.bridgeQuestions ?? (t.s6Qs as unknown as string[]))) pdf.quote(q);
  pdf.para(t.s6Avoid, { size: 10, bold: true, color: C.violetDark });
  pdf.bullets(t.s6AvoidBullets as unknown as string[]);

  // 7 · Límites de confidencialidad y ética
  pdf.h2(t.s7);
  pdf.bullets(t.s7Bullets as unknown as string[]);

  // Señales del motor (canasta partner) — data real del diagnosis-engine
  if (data.partnerInsights.length) {
    pdf.h2(t.insightsTitle);
    pdf.para(t.insightsIntro, { size: 8.5, color: C.muted });
    insightsTable(pdf, data.partnerInsights, t);
  }

  // Recordatorio final
  pdf.callout(t.final, { lead: t.finalLead, bg: C.coralBg, leadColor: C.amberTxt });

  return pdf.finish();
}

function insightsTable(pdf: RowiPdf, insights: Insight[], t: LStrings) {
  const rows = insights.map((i) => {
    const flags: string[] = [];
    if (i.flags.smallN) flags.push(t.flagSmallN);
    if (i.flags.highDispersion) flags.push(t.flagDisp);
    if (i.flags.isWellbeing) flags.push(t.flagWell);
    return [i.label, `${i.value.toFixed(1)} (${i.vsNorm >= 0 ? "+" : ""}${i.vsNorm})`, i.reading + (flags.length ? `  [${flags.join(", ")}]` : "")];
  });
  pdf.table(["", "vs 100", ""], rows, [0.22, 0.14, 0.64], { fs: 8 });
}
