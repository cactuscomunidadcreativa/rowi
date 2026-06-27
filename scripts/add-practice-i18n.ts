/**
 * Inserta las claves i18n del AI Practice Partner (Track B) en los 5 locales
 * (es/en/pt/it/zh) con paridad perfecta. Idempotente: no pisa claves existentes.
 *
 * Ejecutar: `tsx scripts/add-practice-i18n.ts`
 */
import * as fs from "fs";
import * as path from "path";

type Five = { es: string; en: string; pt: string; it: string; zh: string };

const KEYS: Record<string, Five> = {
  // ── Main nav ──
  "navbar.nav.practice": {
    es: "Practicar",
    en: "Practice",
    pt: "Praticar",
    it: "Esercitati",
    zh: "练习",
  },

  // ── Admin nav ──
  "admin.nav.scenarios": {
    es: "Escenarios de práctica",
    en: "Practice scenarios",
    pt: "Cenários de prática",
    it: "Scenari di pratica",
    zh: "练习场景",
  },

  // ── Practice (user UI) ──
  "practice.title": {
    es: "Practica una conversación",
    en: "Practice a conversation",
    pt: "Pratique uma conversa",
    it: "Esercitati in una conversazione",
    zh: "练习一段对话",
  },
  "practice.subtitle": {
    es: "Elige un escenario y practica con tu compañero de IA. Al final recibes una evaluación.",
    en: "Pick a scenario and practice with your AI partner. You'll get feedback at the end.",
    pt: "Escolha um cenário e pratique com seu parceiro de IA. No final, você recebe uma avaliação.",
    it: "Scegli uno scenario ed esercitati con il tuo partner IA. Alla fine ricevi una valutazione.",
    zh: "选择一个场景，与你的 AI 伙伴练习。结束后你会得到评估反馈。",
  },
  "practice.difficulty": {
    es: "Dificultad",
    en: "Difficulty",
    pt: "Dificuldade",
    it: "Difficoltà",
    zh: "难度",
  },
  "practice.noScenarios": {
    es: "Aún no hay escenarios disponibles.",
    en: "No scenarios available yet.",
    pt: "Ainda não há cenários disponíveis.",
    it: "Nessuno scenario disponibile ancora.",
    zh: "暂无可用场景。",
  },
  "practice.exit": { es: "Salir", en: "Exit", pt: "Sair", it: "Esci", zh: "退出" },
  "practice.finish": {
    es: "Terminar y evaluar",
    en: "Finish and score",
    pt: "Terminar e avaliar",
    it: "Termina e valuta",
    zh: "结束并评分",
  },
  "practice.send": { es: "Enviar", en: "Send", pt: "Enviar", it: "Invia", zh: "发送" },
  "practice.inputPlaceholder": {
    es: "Escribe tu respuesta…",
    en: "Type your reply…",
    pt: "Escreva sua resposta…",
    it: "Scrivi la tua risposta…",
    zh: "输入你的回应…",
  },
  "practice.limitReached": {
    es: "Has llegado al final de la práctica. Pulsa Terminar para tu evaluación.",
    en: "You've reached the end of the practice. Tap Finish for your feedback.",
    pt: "Você chegou ao fim da prática. Toque em Terminar para sua avaliação.",
    it: "Hai raggiunto la fine della pratica. Tocca Termina per la tua valutazione.",
    zh: "练习已结束。点击「结束」查看你的评估。",
  },
  "practice.points": { es: "puntos", en: "points", pt: "pontos", it: "punti", zh: "积分" },
  "practice.evolved": {
    es: "¡tu Rowi evolucionó!",
    en: "your Rowi evolved!",
    pt: "seu Rowi evoluiu!",
    it: "il tuo Rowi si è evoluto!",
    zh: "你的 Rowi 进化了！",
  },
  "practice.byCriterion": {
    es: "Por criterio",
    en: "By criterion",
    pt: "Por critério",
    it: "Per criterio",
    zh: "按评分维度",
  },
  "practice.strengths": {
    es: "Fortalezas",
    en: "Strengths",
    pt: "Pontos fortes",
    it: "Punti di forza",
    zh: "优势",
  },
  "practice.improvements": {
    es: "A mejorar",
    en: "To improve",
    pt: "A melhorar",
    it: "Da migliorare",
    zh: "待改进",
  },
  "practice.again": {
    es: "Practicar otra vez",
    en: "Practice again",
    pt: "Praticar de novo",
    it: "Esercitati di nuovo",
    zh: "再练一次",
  },

  // ── Scenarios admin ──
  "scenarios.title": {
    es: "Banco de escenarios de práctica",
    en: "Practice scenario bank",
    pt: "Banco de cenários de prática",
    it: "Banca degli scenari di pratica",
    zh: "练习场景库",
  },
  "scenarios.subtitle": {
    es: "Sube el guion que la IA interpreta y la rúbrica de evaluación. Alimenta el AI Practice Partner.",
    en: "Upload the script the AI plays and the scoring rubric. Feeds the AI Practice Partner.",
    pt: "Envie o roteiro que a IA interpreta e a rubrica de avaliação. Alimenta o AI Practice Partner.",
    it: "Carica il copione che l'IA interpreta e la rubrica di valutazione. Alimenta l'AI Practice Partner.",
    zh: "上传 AI 扮演的脚本和评分量规，为 AI 练习伙伴提供内容。",
  },
  "scenarios.newTitle": {
    es: "Nuevo escenario",
    en: "New scenario",
    pt: "Novo cenário",
    it: "Nuovo scenario",
    zh: "新建场景",
  },
  "scenarios.editTitle": {
    es: "Editar escenario",
    en: "Edit scenario",
    pt: "Editar cenário",
    it: "Modifica scenario",
    zh: "编辑场景",
  },
  "scenarios.field.title": { es: "Título", en: "Title", pt: "Título", it: "Titolo", zh: "标题" },
  "scenarios.field.summary": {
    es: "Resumen",
    en: "Summary",
    pt: "Resumo",
    it: "Riepilogo",
    zh: "摘要",
  },
  "scenarios.field.brief": {
    es: "Brief (lo que la IA interpreta)",
    en: "Brief (what the AI plays)",
    pt: "Brief (o que a IA interpreta)",
    it: "Brief (ciò che l'IA interpreta)",
    zh: "脚本（AI 扮演的内容）",
  },
  "scenarios.field.locale": { es: "Idioma", en: "Language", pt: "Idioma", it: "Lingua", zh: "语言" },
  "scenarios.field.focusSei": {
    es: "Foco SEI",
    en: "SEI focus",
    pt: "Foco SEI",
    it: "Focus SEI",
    zh: "SEI 焦点",
  },
  "scenarios.field.difficulty": {
    es: "Dificultad",
    en: "Difficulty",
    pt: "Dificuldade",
    it: "Difficoltà",
    zh: "难度",
  },
  "scenarios.field.active": { es: "Activo", en: "Active", pt: "Ativo", it: "Attivo", zh: "启用" },
  "scenarios.field.rubric": {
    es: "Rúbrica (JSON)",
    en: "Rubric (JSON)",
    pt: "Rubrica (JSON)",
    it: "Rubrica (JSON)",
    zh: "评分量规 (JSON)",
  },
  "scenarios.focus.auto": {
    es: "Automático",
    en: "Automatic",
    pt: "Automático",
    it: "Automatico",
    zh: "自动",
  },
  "scenarios.ph.title": {
    es: "Conversación difícil con un cliente",
    en: "Difficult conversation with a customer",
    pt: "Conversa difícil com um cliente",
    it: "Conversazione difficile con un cliente",
    zh: "与客户的艰难对话",
  },
  "scenarios.ph.summary": {
    es: "Descripción corta para la lista",
    en: "Short description for the list",
    pt: "Descrição curta para a lista",
    it: "Breve descrizione per l'elenco",
    zh: "用于列表的简短描述",
  },
  "scenarios.ph.brief": {
    es: "Eres un cliente molesto porque su pedido llegó tarde. Eres firme pero razonable...",
    en: "You're a customer upset because your order arrived late. You're firm but reasonable...",
    pt: "Você é um cliente irritado porque seu pedido chegou atrasado. Você é firme, mas razoável...",
    it: "Sei un cliente arrabbiato perché il tuo ordine è arrivato in ritardo. Sei fermo ma ragionevole...",
    zh: "你是一位因订单迟到而不满的客户。你态度坚定但讲道理……",
  },
  "scenarios.search": {
    es: "Buscar escenarios…",
    en: "Search scenarios…",
    pt: "Buscar cenários…",
    it: "Cerca scenari…",
    zh: "搜索场景…",
  },
  "scenarios.empty": {
    es: "Aún no hay escenarios. Crea el primero arriba.",
    en: "No scenarios yet. Create the first one above.",
    pt: "Ainda não há cenários. Crie o primeiro acima.",
    it: "Nessuno scenario ancora. Crea il primo qui sopra.",
    zh: "还没有场景。在上方创建第一个。",
  },
  "scenarios.difficulty.short": { es: "Dif.", en: "Diff.", pt: "Dif.", it: "Diff.", zh: "难度" },
  "scenarios.inactive": {
    es: "inactivo",
    en: "inactive",
    pt: "inativo",
    it: "inattivo",
    zh: "已停用",
  },
  "scenarios.usage": { es: "Usos", en: "Uses", pt: "Usos", it: "Usi", zh: "使用次数" },
  "scenarios.edit": { es: "Editar", en: "Edit", pt: "Editar", it: "Modifica", zh: "编辑" },
  "scenarios.delete": { es: "Eliminar", en: "Delete", pt: "Excluir", it: "Elimina", zh: "删除" },
  "scenarios.cancel": { es: "Cancelar", en: "Cancel", pt: "Cancelar", it: "Annulla", zh: "取消" },
  "scenarios.create": {
    es: "Crear escenario",
    en: "Create scenario",
    pt: "Criar cenário",
    it: "Crea scenario",
    zh: "创建场景",
  },
  "scenarios.save": {
    es: "Guardar cambios",
    en: "Save changes",
    pt: "Salvar alterações",
    it: "Salva modifiche",
    zh: "保存更改",
  },
  "scenarios.confirmDelete.title": {
    es: "¿Eliminar escenario?",
    en: "Delete scenario?",
    pt: "Excluir cenário?",
    it: "Eliminare lo scenario?",
    zh: "删除场景？",
  },
  "scenarios.confirmDelete.message": {
    es: "Esta acción no se puede deshacer. Las sesiones ya realizadas se conservan.",
    en: "This action cannot be undone. Completed sessions are kept.",
    pt: "Esta ação não pode ser desfeita. As sessões já realizadas são mantidas.",
    it: "Questa azione non può essere annullata. Le sessioni già svolte vengono conservate.",
    zh: "此操作无法撤销。已完成的会话将被保留。",
  },
  // Errores del formulario (clave dinámica scenarios.error.<code>).
  "scenarios.error.title.required": {
    es: "El título es obligatorio.",
    en: "Title is required.",
    pt: "O título é obrigatório.",
    it: "Il titolo è obbligatorio.",
    zh: "标题为必填项。",
  },
  "scenarios.error.brief.required": {
    es: "El brief es obligatorio.",
    en: "The brief is required.",
    pt: "O brief é obrigatório.",
    it: "Il brief è obbligatorio.",
    zh: "脚本为必填项。",
  },
  "scenarios.error.rubric.invalidJson": {
    es: "La rúbrica no es un JSON válido.",
    en: "The rubric is not valid JSON.",
    pt: "A rubrica não é um JSON válido.",
    it: "La rubrica non è un JSON valido.",
    zh: "评分量规不是有效的 JSON。",
  },
};

const LOCALES: Array<keyof Five> = ["es", "en", "pt", "it", "zh"];
const dir = path.join(process.cwd(), "src/lib/i18n/locales");

let totalAdded = 0;
for (const loc of LOCALES) {
  const file = path.join(dir, `${loc}.json`);
  const json = JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, string>;
  let added = 0;
  for (const [key, val] of Object.entries(KEYS)) {
    if (!(key in json)) {
      json[key] = val[loc];
      added++;
    }
  }
  // Reescribir con claves ordenadas alfabéticamente (como el resto del archivo).
  const sorted: Record<string, string> = {};
  for (const k of Object.keys(json).sort()) sorted[k] = json[k];
  fs.writeFileSync(file, JSON.stringify(sorted, null, 2) + "\n", "utf8");
  console.log(`[add-practice-i18n] ${loc}: +${added}`);
  totalAdded += added;
}
console.log(`[add-practice-i18n] done · total inserts=${totalAdded}`);
