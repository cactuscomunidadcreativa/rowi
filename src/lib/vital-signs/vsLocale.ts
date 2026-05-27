/**
 * Localización pt/it de la terminología Six Seconds para la UI de Vital
 * Signs (cards multi-contexto + drawer de detalle).
 *
 * El catálogo (`catalog.ts`) y los payloads de la API solo traen es/en.
 * Este módulo agrega portugués e italiano SIN tocar el catálogo ni los
 * tipos del servidor: los componentes resuelven el nombre localizado por
 * código (que siempre viaja en el payload) y caen a es/en si falta.
 */

export type VsLang = "es" | "en" | "pt" | "it";

type PtIt = { pt: string; it: string };

/** Devuelve el texto en el idioma pedido; pt/it caen a es/en si no hay dato. */
function pick(lang: VsLang, es: string, en: string, ptit?: PtIt): string {
  if (lang === "en") return en;
  if (lang === "pt") return ptit?.pt ?? es;
  if (lang === "it") return ptit?.it ?? en;
  return es;
}

const DRIVER_NAME: Record<string, PtIt> = {
  TRUST: { pt: "Confiança", it: "Fiducia" },
  MOTIVATION: { pt: "Motivação", it: "Motivazione" },
  CHANGE: { pt: "Mudança", it: "Cambiamento" },
  TEAMWORK: { pt: "Trabalho em Equipe", it: "Lavoro di Squadra" },
  EXECUTION: { pt: "Execução", it: "Esecuzione" },
};

const DRIVER_NEED: Record<string, PtIt> = {
  TRUST: { pt: "Segurança", it: "Sicurezza" },
  MOTIVATION: { pt: "Significado", it: "Significato" },
  CHANGE: { pt: "Crescimento", it: "Crescita" },
  TEAMWORK: { pt: "Pertencimento", it: "Appartenenza" },
  EXECUTION: { pt: "Realização", it: "Realizzazione" },
};

const PP_NAME: Record<string, PtIt> = {
  TRUST_TRANSPARENCY: { pt: "Transparência", it: "Trasparenza" },
  TRUST_COHERENCE: { pt: "Coerência", it: "Coerenza" },
  TRUST_CARE: { pt: "Cuidado", it: "Cura" },
  MOTIVATION_MEANING: { pt: "Significado", it: "Significato" },
  MOTIVATION_MASTERY: { pt: "Maestria", it: "Padronanza" },
  MOTIVATION_AUTONOMY: { pt: "Autonomia", it: "Autonomia" },
  CHANGE_IMAGINATION: { pt: "Imaginação", it: "Immaginazione" },
  CHANGE_EXPLORATION: { pt: "Exploração", it: "Esplorazione" },
  CHANGE_CELEBRATION: { pt: "Celebração", it: "Celebrazione" },
  TEAMWORK_DIVERGENCE: { pt: "Divergência", it: "Divergenza" },
  TEAMWORK_CONNECTION: { pt: "Conexão", it: "Connessione" },
  TEAMWORK_JOY: { pt: "Alegria", it: "Gioia" },
  EXECUTION_ACCOUNTABILITY: { pt: "Responsabilidade", it: "Responsabilità" },
  EXECUTION_FEEDBACK: { pt: "Feedback", it: "Feedback" },
  EXECUTION_FOCUS: { pt: "Foco", it: "Focus" },
};

const PP_FUNCTION: Record<string, PtIt> = {
  TRUST_TRANSPARENCY: { pt: "Compartilhar a verdade", it: "Condividere la verità" },
  TRUST_COHERENCE: { pt: "Alinhar discurso e ação", it: "Allineare discorso e azione" },
  TRUST_CARE: { pt: "Gerar conexão humana", it: "Generare connessione umana" },
  MOTIVATION_MEANING: { pt: "Criar propósito", it: "Creare uno scopo" },
  MOTIVATION_MASTERY: { pt: "Construir forças", it: "Costruire punti di forza" },
  MOTIVATION_AUTONOMY: { pt: "Gerar ownership", it: "Generare ownership" },
  CHANGE_IMAGINATION: { pt: "Criar emoção para inovar", it: "Creare emozione per innovare" },
  CHANGE_EXPLORATION: { pt: "Prototipar e aprender", it: "Prototipare e imparare" },
  CHANGE_CELEBRATION: { pt: "Integrar o aprendizado", it: "Integrare l'apprendimento" },
  TEAMWORK_DIVERGENCE: { pt: "Buscar perspectivas diferentes", it: "Cercare prospettive diverse" },
  TEAMWORK_CONNECTION: { pt: "Criar terreno comum", it: "Creare un terreno comune" },
  TEAMWORK_JOY: { pt: "Amplificar a energia emocional", it: "Amplificare l'energia emotiva" },
  EXECUTION_ACCOUNTABILITY: { pt: "Tornar os resultados visíveis", it: "Rendere visibili i risultati" },
  EXECUTION_FEEDBACK: { pt: "Consciência contínua", it: "Consapevolezza continua" },
  EXECUTION_FOCUS: { pt: "Concentrar no essencial", it: "Concentrarsi sull'essenziale" },
};

const SEI_NAME: Record<string, PtIt> = {
  EL: { pt: "Alfabetização Emocional", it: "Alfabetizzazione Emotiva" },
  RP: { pt: "Reconhecer Padrões", it: "Riconoscere Schemi" },
  ACT: { pt: "Pensamento Consequente", it: "Pensiero Consequenziale" },
  NE: { pt: "Navegar Emoções", it: "Navigare le Emozioni" },
  IM: { pt: "Motivação Intrínseca", it: "Motivazione Intrinseca" },
  OP: { pt: "Exercitar Otimismo", it: "Esercitare l'Ottimismo" },
  EMP: { pt: "Aumentar a Empatia", it: "Aumentare l'Empatia" },
  NG: { pt: "Metas Nobres", it: "Obiettivi Nobili" },
};

const OUTCOME_NAME: Record<string, PtIt> = {
  FUTURE_SUCCESS: { pt: "Sucesso Futuro", it: "Successo Futuro" },
  CUSTOMER_FOCUS: { pt: "Foco no Cliente", it: "Focus sul Cliente" },
  PRODUCTIVITY: { pt: "Produtividade", it: "Produttività" },
  RETENTION: { pt: "Retenção", it: "Ritenzione" },
};

const ORIENTATION_NAME: Record<string, PtIt> = {
  LINTERNA: { pt: "Abertura de Caminho", it: "Apertura di Cammino" },
  MAPA: { pt: "Expedição", it: "Spedizione" },
  BOTIQUIN: { pt: "Acampamento Base", it: "Campo Base" },
  BOTAS: { pt: "Logística", it: "Logistica" },
};

const ORIENTATION_IDENTITY: Record<string, PtIt> = {
  LINTERNA: { pt: "Visionários · disruptores", it: "Visionari · innovatori dirompenti" },
  MAPA: { pt: "Exploradores · inovadores", it: "Esploratori · innovatori" },
  BOTIQUIN: { pt: "Estabilizadores centrados nas pessoas", it: "Stabilizzatori centrati sulle persone" },
  BOTAS: { pt: "Construtores de sistemas e execução", it: "Costruttori di sistemi ed esecuzione" },
};

const ARCHETYPE_NAME: Record<string, PtIt> = {
  LINTERNA: { pt: "Rowi Explorador", it: "Rowi Esploratore" },
  MAPA: { pt: "Rowi Cartografia", it: "Rowi Cartografo" },
  BOTIQUIN: { pt: "Rowi Paramédico", it: "Rowi Paramedico" },
  BOTAS: { pt: "Rowi Sherpa", it: "Rowi Sherpa" },
};

const ARCHETYPE_TAGLINE: Record<string, PtIt> = {
  LINTERNA: {
    pt: "Vai à frente, vê riscos e oportunidades antes de todos",
    it: "Va avanti, vede rischi e opportunità prima di tutti",
  },
  MAPA: {
    pt: "Traça o rumo e dá sentido a aonde vamos",
    it: "Traccia la rotta e dà senso a dove andiamo",
  },
  BOTIQUIN: {
    pt: "Cuida da equipe e repara os vínculos",
    it: "Si prende cura del team e ripara i legami",
  },
  BOTAS: {
    pt: "Conhece o terreno, carrega a logística e abre a trilha",
    it: "Conosce il terreno, porta la logistica e apre il sentiero",
  },
};

const TALENT_NAME: Record<string, PtIt> = {
  datamining: { pt: "Mineração de Dados", it: "Data Mining" },
  modeling: { pt: "Modelagem", it: "Modellazione" },
  prioritizing: { pt: "Priorizar", it: "Dare Priorità" },
  connection: { pt: "Conexão", it: "Connessione" },
  emotionalinsight: { pt: "Insight Emocional", it: "Insight Emotivo" },
  collaboration: { pt: "Colaboração", it: "Collaborazione" },
  reflecting: { pt: "Refletir", it: "Riflettere" },
  adaptability: { pt: "Adaptabilidade", it: "Adattabilità" },
  criticalthinking: { pt: "Pensamento Crítico", it: "Pensiero Critico" },
  resilience: { pt: "Resiliência", it: "Resilienza" },
  risktolerance: { pt: "Tolerância ao Risco", it: "Tolleranza al Rischio" },
  imagination: { pt: "Imaginação", it: "Immaginazione" },
  proactivity: { pt: "Proatividade", it: "Proattività" },
  commitment: { pt: "Compromisso", it: "Impegno" },
  problemsolving: { pt: "Resolução de Problemas", it: "Risoluzione dei Problemi" },
  vision: { pt: "Visão", it: "Visione" },
  designing: { pt: "Design", it: "Progettazione" },
  entrepreneurship: { pt: "Empreendedorismo", it: "Imprenditorialità" },
};

export const vsDriverName = (code: string, lang: VsLang, es: string, en: string) =>
  pick(lang, es, en, DRIVER_NAME[code]);
export const vsDriverNeed = (code: string, lang: VsLang, es: string, en: string) =>
  pick(lang, es, en, DRIVER_NEED[code]);
export const vsPpName = (code: string, lang: VsLang, es: string, en: string) =>
  pick(lang, es, en, PP_NAME[code]);
export const vsPpFunction = (code: string, lang: VsLang, es: string, en: string) =>
  pick(lang, es, en, PP_FUNCTION[code]);
export const vsSeiName = (key: string, lang: VsLang, es: string, en: string) =>
  pick(lang, es, en, SEI_NAME[key]);
export const vsOutcomeName = (code: string, lang: VsLang, es: string, en: string) =>
  pick(lang, es, en, OUTCOME_NAME[code]);
export const vsOrientationName = (quadrant: string, lang: VsLang, es: string, en: string) =>
  pick(lang, es, en, ORIENTATION_NAME[quadrant]);
export const vsOrientationIdentity = (quadrant: string, lang: VsLang, es: string, en: string) =>
  pick(lang, es, en, ORIENTATION_IDENTITY[quadrant]);
export const vsArchetypeName = (quadrant: string, lang: VsLang, es: string, en: string) =>
  pick(lang, es, en, ARCHETYPE_NAME[quadrant]);
export const vsArchetypeTagline = (quadrant: string, lang: VsLang, es: string, en: string) =>
  pick(lang, es, en, ARCHETYPE_TAGLINE[quadrant]);
export const vsTalentName = (key: string, lang: VsLang, es: string, en: string) =>
  pick(lang, es, en, TALENT_NAME[key]);
