/**
 * Localización pt/it/zh de la terminología Six Seconds para la UI de Vital
 * Signs (cards multi-contexto + drawer de detalle).
 *
 * El catálogo (`catalog.ts`) y los payloads de la API solo traen es/en.
 * Este módulo agrega portugués, italiano y chino (zh-CN) SIN tocar el
 * catálogo ni los tipos del servidor: los componentes resuelven el nombre
 * localizado por código (que siempre viaja en el payload) y caen a es/en si
 * falta.
 */

export type VsLang = "es" | "en" | "pt" | "it" | "zh";

type PtIt = { pt: string; it: string; zh: string };

/** Devuelve el texto en el idioma pedido; pt/it/zh caen a es/en si no hay dato. */
function pick(lang: VsLang, es: string, en: string, ptit?: PtIt): string {
  if (lang === "en") return en;
  if (lang === "pt") return ptit?.pt ?? es;
  if (lang === "it") return ptit?.it ?? en;
  if (lang === "zh") return ptit?.zh ?? en;
  return es;
}

const DRIVER_NAME: Record<string, PtIt> = {
  TRUST: { pt: "Confiança", it: "Fiducia", zh: "信任" },
  MOTIVATION: { pt: "Motivação", it: "Motivazione", zh: "动力" },
  CHANGE: { pt: "Mudança", it: "Cambiamento", zh: "改变" },
  TEAMWORK: { pt: "Trabalho em Equipe", it: "Lavoro di Squadra", zh: "团队协作" },
  EXECUTION: { pt: "Execução", it: "Esecuzione", zh: "执行" },
};

const DRIVER_NEED: Record<string, PtIt> = {
  TRUST: { pt: "Segurança", it: "Sicurezza", zh: "安全感" },
  MOTIVATION: { pt: "Significado", it: "Significato", zh: "意义" },
  CHANGE: { pt: "Crescimento", it: "Crescita", zh: "成长" },
  TEAMWORK: { pt: "Pertencimento", it: "Appartenenza", zh: "归属感" },
  EXECUTION: { pt: "Realização", it: "Realizzazione", zh: "成就" },
};

const PP_NAME: Record<string, PtIt> = {
  TRUST_TRANSPARENCY: { pt: "Transparência", it: "Trasparenza", zh: "透明" },
  TRUST_COHERENCE: { pt: "Coerência", it: "Coerenza", zh: "言行一致" },
  TRUST_CARE: { pt: "Cuidado", it: "Cura", zh: "关怀" },
  MOTIVATION_MEANING: { pt: "Significado", it: "Significato", zh: "意义" },
  MOTIVATION_MASTERY: { pt: "Maestria", it: "Padronanza", zh: "精进" },
  MOTIVATION_AUTONOMY: { pt: "Autonomia", it: "Autonomia", zh: "自主" },
  CHANGE_IMAGINATION: { pt: "Imaginação", it: "Immaginazione", zh: "想象力" },
  CHANGE_EXPLORATION: { pt: "Exploração", it: "Esplorazione", zh: "探索" },
  CHANGE_CELEBRATION: { pt: "Celebração", it: "Celebrazione", zh: "庆祝" },
  TEAMWORK_DIVERGENCE: { pt: "Divergência", it: "Divergenza", zh: "多元视角" },
  TEAMWORK_CONNECTION: { pt: "Conexão", it: "Connessione", zh: "连接" },
  TEAMWORK_JOY: { pt: "Alegria", it: "Gioia", zh: "喜悦" },
  EXECUTION_ACCOUNTABILITY: { pt: "Responsabilidade", it: "Responsabilità", zh: "担责" },
  EXECUTION_FEEDBACK: { pt: "Feedback", it: "Feedback", zh: "反馈" },
  EXECUTION_FOCUS: { pt: "Foco", it: "Focus", zh: "专注" },
};

const PP_FUNCTION: Record<string, PtIt> = {
  TRUST_TRANSPARENCY: { pt: "Compartilhar a verdade", it: "Condividere la verità", zh: "分享真相" },
  TRUST_COHERENCE: { pt: "Alinhar discurso e ação", it: "Allineare discorso e azione", zh: "言行合一" },
  TRUST_CARE: { pt: "Gerar conexão humana", it: "Generare connessione umana", zh: "建立人际连接" },
  MOTIVATION_MEANING: { pt: "Criar propósito", it: "Creare uno scopo", zh: "创造目标感" },
  MOTIVATION_MASTERY: { pt: "Construir forças", it: "Costruire punti di forza", zh: "培养优势" },
  MOTIVATION_AUTONOMY: { pt: "Gerar ownership", it: "Generare ownership", zh: "激发主人翁意识" },
  CHANGE_IMAGINATION: { pt: "Criar emoção para inovar", it: "Creare emozione per innovare", zh: "用情绪驱动创新" },
  CHANGE_EXPLORATION: { pt: "Prototipar e aprender", it: "Prototipare e imparare", zh: "原型试验与学习" },
  CHANGE_CELEBRATION: { pt: "Integrar o aprendizado", it: "Integrare l'apprendimento", zh: "整合所学" },
  TEAMWORK_DIVERGENCE: { pt: "Buscar perspectivas diferentes", it: "Cercare prospettive diverse", zh: "寻求不同视角" },
  TEAMWORK_CONNECTION: { pt: "Criar terreno comum", it: "Creare un terreno comune", zh: "建立共同基础" },
  TEAMWORK_JOY: { pt: "Amplificar a energia emocional", it: "Amplificare l'energia emotiva", zh: "放大情绪能量" },
  EXECUTION_ACCOUNTABILITY: { pt: "Tornar os resultados visíveis", it: "Rendere visibili i risultati", zh: "让成果可见" },
  EXECUTION_FEEDBACK: { pt: "Consciência contínua", it: "Consapevolezza continua", zh: "持续觉察" },
  EXECUTION_FOCUS: { pt: "Concentrar no essencial", it: "Concentrarsi sull'essenziale", zh: "聚焦核心" },
};

const SEI_NAME: Record<string, PtIt> = {
  EL: { pt: "Alfabetização Emocional", it: "Alfabetizzazione Emotiva", zh: "情绪识读" },
  RP: { pt: "Reconhecer Padrões", it: "Riconoscere Schemi", zh: "识别模式" },
  ACT: { pt: "Pensamento Consequente", it: "Pensiero Consequenziale", zh: "后果思维" },
  NE: { pt: "Navegar Emoções", it: "Navigare le Emozioni", zh: "驾驭情绪" },
  IM: { pt: "Motivação Intrínseca", it: "Motivazione Intrinseca", zh: "内在动力" },
  OP: { pt: "Exercitar Otimismo", it: "Esercitare l'Ottimismo", zh: "践行乐观" },
  EMP: { pt: "Aumentar a Empatia", it: "Aumentare l'Empatia", zh: "增进共情" },
  NG: { pt: "Metas Nobres", it: "Obiettivi Nobili", zh: "崇高目标" },
};

const OUTCOME_NAME: Record<string, PtIt> = {
  FUTURE_SUCCESS: { pt: "Sucesso Futuro", it: "Successo Futuro", zh: "未来成功" },
  CUSTOMER_FOCUS: { pt: "Foco no Cliente", it: "Focus sul Cliente", zh: "客户聚焦" },
  PRODUCTIVITY: { pt: "Produtividade", it: "Produttività", zh: "生产力" },
  RETENTION: { pt: "Retenção", it: "Ritenzione", zh: "员工留任" },
};

const ORIENTATION_NAME: Record<string, PtIt> = {
  LINTERNA: { pt: "Abertura de Caminho", it: "Apertura di Cammino", zh: "开路" },
  MAPA: { pt: "Expedição", it: "Spedizione", zh: "远征" },
  BOTIQUIN: { pt: "Acampamento Base", it: "Campo Base", zh: "大本营" },
  BOTAS: { pt: "Logística", it: "Logistica", zh: "后勤保障" },
};

const ORIENTATION_IDENTITY: Record<string, PtIt> = {
  LINTERNA: { pt: "Visionários · disruptores", it: "Visionari · innovatori dirompenti", zh: "远见者 · 颠覆者" },
  MAPA: { pt: "Exploradores · inovadores", it: "Esploratori · innovatori", zh: "探索者 · 创新者" },
  BOTIQUIN: { pt: "Estabilizadores centrados nas pessoas", it: "Stabilizzatori centrati sulle persone", zh: "以人为本的稳定者" },
  BOTAS: { pt: "Construtores de sistemas e execução", it: "Costruttori di sistemi ed esecuzione", zh: "系统与执行的建设者" },
};

const ARCHETYPE_NAME: Record<string, PtIt> = {
  LINTERNA: { pt: "Rowi Explorador", it: "Rowi Esploratore", zh: "Rowi 探路者" },
  MAPA: { pt: "Rowi Cartografia", it: "Rowi Cartografo", zh: "Rowi 制图师" },
  BOTIQUIN: { pt: "Rowi Paramédico", it: "Rowi Paramedico", zh: "Rowi 医护员" },
  BOTAS: { pt: "Rowi Sherpa", it: "Rowi Sherpa", zh: "Rowi 向导" },
};

const ARCHETYPE_TAGLINE: Record<string, PtIt> = {
  LINTERNA: {
    pt: "Vai à frente, vê riscos e oportunidades antes de todos",
    it: "Va avanti, vede rischi e opportunità prima di tutti",
    zh: "走在最前，比所有人更早看见风险与机遇",
  },
  MAPA: {
    pt: "Traça o rumo e dá sentido a aonde vamos",
    it: "Traccia la rotta e dà senso a dove andiamo",
    zh: "规划路线，为前行的方向赋予意义",
  },
  BOTIQUIN: {
    pt: "Cuida da equipe e repara os vínculos",
    it: "Si prende cura del team e ripara i legami",
    zh: "关怀团队，修复彼此间的纽带",
  },
  BOTAS: {
    pt: "Conhece o terreno, carrega a logística e abre a trilha",
    it: "Conosce il terreno, porta la logistica e apre il sentiero",
    zh: "熟悉地形，承担后勤，开辟道路",
  },
};

const TALENT_NAME: Record<string, PtIt> = {
  datamining: { pt: "Mineração de Dados", it: "Data Mining", zh: "数据挖掘" },
  modeling: { pt: "Modelagem", it: "Modellazione", zh: "建模" },
  prioritizing: { pt: "Priorizar", it: "Dare Priorità", zh: "排定优先级" },
  connection: { pt: "Conexão", it: "Connessione", zh: "连接" },
  emotionalinsight: { pt: "Insight Emocional", it: "Insight Emotivo", zh: "情绪洞察" },
  collaboration: { pt: "Colaboração", it: "Collaborazione", zh: "协作" },
  reflecting: { pt: "Refletir", it: "Riflettere", zh: "反思" },
  adaptability: { pt: "Adaptabilidade", it: "Adattabilità", zh: "适应力" },
  criticalthinking: { pt: "Pensamento Crítico", it: "Pensiero Critico", zh: "批判性思维" },
  resilience: { pt: "Resiliência", it: "Resilienza", zh: "韧性" },
  risktolerance: { pt: "Tolerância ao Risco", it: "Tolleranza al Rischio", zh: "风险容忍度" },
  imagination: { pt: "Imaginação", it: "Immaginazione", zh: "想象力" },
  proactivity: { pt: "Proatividade", it: "Proattività", zh: "主动性" },
  commitment: { pt: "Compromisso", it: "Impegno", zh: "投入" },
  problemsolving: { pt: "Resolução de Problemas", it: "Risoluzione dei Problemi", zh: "解决问题" },
  vision: { pt: "Visão", it: "Visione", zh: "愿景" },
  designing: { pt: "Design", it: "Progettazione", zh: "设计" },
  entrepreneurship: { pt: "Empreendedorismo", it: "Imprenditorialità", zh: "创业精神" },
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
