import type { WorkspaceType } from "@prisma/client";

/**
 * 🏢 Workspace Templates
 * Pre-configuraciones para cada tipo de workspace profesional.
 * Soporta los 4 idiomas del sistema (es/en/pt/it).
 */

export type WorkspaceTemplate = {
  key: string;
  type: WorkspaceType;
  icon: string; // emoji
  gradient: string;
  name: Record<"es" | "en" | "pt" | "it", string>;
  description: Record<"es" | "en" | "pt" | "it", string>;
  // Modulos visibles en este workspace (subset de los 15 modulos TP)
  modules: string[];
  // Sugerencias rapidas para onboarding
  tips: Record<"es" | "en" | "pt" | "it", string[]>;
  defaultProjectStatus: string;
};

export const WORKSPACE_TEMPLATES: WorkspaceTemplate[] = [
  {
    key: "coaching",
    type: "COACHING",
    icon: "🎯",
    gradient: "from-violet-500 to-purple-600",
    name: {
      es: "Coaching 1:1",
      en: "1:1 Coaching",
      pt: "Coaching 1:1",
      it: "Coaching 1:1",
    },
    description: {
      es: "Acompanamiento individual con notas, planes de desarrollo y sesiones.",
      en: "Individual coaching with notes, development plans and sessions.",
      pt: "Acompanhamento individual com notas, planos de desenvolvimento e sessoes.",
      it: "Accompagnamento individuale con note, piani di sviluppo e sessioni.",
    },
    modules: ["dashboard", "members", "notes", "plans", "coach", "insights", "evolution"],
    tips: {
      es: [
        "Agrega uno o varios coachees como miembros",
        "Usa Notes para registrar sesiones privadas",
        "Deja que Rowi AI genere un plan de desarrollo",
      ],
      en: [
        "Add one or more coachees as members",
        "Use Notes to record private sessions",
        "Let Rowi AI generate a development plan",
      ],
      pt: [
        "Adicione um ou varios coachees como membros",
        "Use Notes para registrar sessoes privadas",
        "Deixe que Rowi AI gere um plano de desenvolvimento",
      ],
      it: [
        "Aggiungi uno o piu coachee come membri",
        "Usa Note per registrare sessioni private",
        "Lascia che Rowi AI generi un piano di sviluppo",
      ],
    },
    defaultProjectStatus: "active",
  },
  {
    key: "selection",
    type: "SELECTION",
    icon: "🎯",
    gradient: "from-blue-500 to-cyan-600",
    name: {
      es: "Seleccion de Personal",
      en: "Personnel Selection",
      pt: "Selecao de Pessoal",
      it: "Selezione del Personale",
    },
    description: {
      es: "Evalua candidatos contra un perfil ideal con ranking IA.",
      en: "Evaluate candidates against an ideal profile with AI ranking.",
      pt: "Avalie candidatos contra um perfil ideal com ranking IA.",
      it: "Valuta candidati contro un profilo ideale con ranking IA.",
    },
    modules: ["dashboard", "members", "selection", "people", "benchmark", "coach", "reports"],
    tips: {
      es: [
        "Define el rol objetivo (ej. Gerente Comercial)",
        "Sube CSV de candidatos o invitales a tomar SEI",
        "Revisa el ranking generado por IA",
      ],
      en: [
        "Define the target role (e.g. Sales Manager)",
        "Upload candidate CSV or invite them to take SEI",
        "Review the AI-generated ranking",
      ],
      pt: [
        "Defina o cargo-alvo (ex. Gerente Comercial)",
        "Faca upload de CSV de candidatos ou convide-os para o SEI",
        "Revise o ranking gerado por IA",
      ],
      it: [
        "Definisci il ruolo target (es. Responsabile Commerciale)",
        "Carica CSV di candidati o invitali a fare il SEI",
        "Rivedi la classifica generata dall'IA",
      ],
    },
    defaultProjectStatus: "active",
  },
  {
    key: "team",
    type: "TEAM_UNIT",
    icon: "👥",
    gradient: "from-emerald-500 to-green-600",
    name: {
      es: "Mi Equipo",
      en: "My Team",
      pt: "Minha Equipe",
      it: "La mia Squadra",
    },
    description: {
      es: "Dashboard de tu equipo directo con metricas EQ y alertas.",
      en: "Dashboard for your direct team with EQ metrics and alerts.",
      pt: "Dashboard da sua equipe direta com metricas EQ e alertas.",
      it: "Dashboard del tuo team diretto con metriche EQ e avvisi.",
    },
    modules: ["dashboard", "members", "teams", "people", "affinity", "alerts", "evolution", "insights"],
    tips: {
      es: [
        "Agrega a tus reportes directos como miembros",
        "Activa alertas inteligentes para detectar anomalias",
        "Usa Affinity para optimizar colaboracion",
      ],
      en: [
        "Add your direct reports as members",
        "Enable smart alerts to detect anomalies",
        "Use Affinity to optimize collaboration",
      ],
      pt: [
        "Adicione seus reportes diretos como membros",
        "Ative alertas inteligentes para detectar anomalias",
        "Use Affinity para otimizar colaboracao",
      ],
      it: [
        "Aggiungi i tuoi riporti diretti come membri",
        "Attiva avvisi intelligenti per rilevare anomalie",
        "Usa Affinity per ottimizzare la collaborazione",
      ],
    },
    defaultProjectStatus: "active",
  },
  {
    key: "hr",
    type: "HR_COHORT",
    icon: "🏢",
    gradient: "from-indigo-500 to-blue-600",
    name: {
      es: "Cohorte HR",
      en: "HR Cohort",
      pt: "Cohorte HR",
      it: "Coorte HR",
    },
    description: {
      es: "Gestion masiva de empleados con campaigns SEI periodicos.",
      en: "Bulk employee management with periodic SEI campaigns.",
      pt: "Gestao em massa de funcionarios com campanhas SEI periodicas.",
      it: "Gestione massiva dei dipendenti con campagne SEI periodiche.",
    },
    modules: ["dashboard", "members", "teams", "benchmark", "campaigns", "alerts", "world", "reports"],
    tips: {
      es: [
        "Sube CSV masivo de empleados",
        "Programa campaigns SEI trimestrales",
        "Exporta reports para leadership",
      ],
      en: [
        "Bulk upload employee CSV",
        "Schedule quarterly SEI campaigns",
        "Export reports for leadership",
      ],
      pt: [
        "Upload CSV em massa de funcionarios",
        "Agende campanhas SEI trimestrais",
        "Exporte reports para lideranca",
      ],
      it: [
        "Carica CSV massivo di dipendenti",
        "Programma campagne SEI trimestrali",
        "Esporta report per la leadership",
      ],
    },
    defaultProjectStatus: "active",
  },
  {
    key: "consulting",
    type: "CONSULTING",
    icon: "💼",
    gradient: "from-amber-500 to-orange-600",
    name: {
      es: "Consultoria",
      en: "Consulting",
      pt: "Consultoria",
      it: "Consulenza",
    },
    description: {
      es: "Proyecto corto plazo para cliente externo con reports compartibles.",
      en: "Short-term project for external client with shareable reports.",
      pt: "Projeto de curto prazo para cliente externo com relatorios compartilhaveis.",
      it: "Progetto a breve termine per cliente esterno con report condivisibili.",
    },
    modules: ["dashboard", "members", "benchmark", "teams", "reports", "client-portal", "insights"],
    tips: {
      es: [
        "Vincula el workspace a tu cliente (Organization)",
        "Sube CSV de participantes",
        "Genera client portal readonly para el cliente",
      ],
      en: [
        "Link the workspace to your client (Organization)",
        "Upload participant CSV",
        "Generate a readonly client portal for the client",
      ],
      pt: [
        "Vincule o workspace ao seu cliente (Organization)",
        "Faca upload de CSV de participantes",
        "Gere client portal readonly para o cliente",
      ],
      it: [
        "Collega il workspace al tuo cliente (Organization)",
        "Carica CSV dei partecipanti",
        "Genera client portal readonly per il cliente",
      ],
    },
    defaultProjectStatus: "active",
  },
  {
    key: "mentoring",
    type: "MENTORING",
    icon: "🧭",
    gradient: "from-pink-500 to-rose-600",
    name: {
      es: "Programa de Mentoria",
      en: "Mentoring Program",
      pt: "Programa de Mentoria",
      it: "Programma di Mentoring",
    },
    description: {
      es: "Matching mentor-mentee con tracking longitudinal.",
      en: "Mentor-mentee matching with longitudinal tracking.",
      pt: "Matching mentor-mentee com tracking longitudinal.",
      it: "Matching mentor-mentee con tracking longitudinale.",
    },
    modules: ["dashboard", "members", "affinity", "notes", "plans", "evolution", "campaigns"],
    tips: {
      es: [
        "Agrega mentors y mentees como miembros",
        "Usa Affinity para sugerir matches",
        "Trackea evolucion con campaigns cada 3 meses",
      ],
      en: [
        "Add mentors and mentees as members",
        "Use Affinity to suggest matches",
        "Track evolution with quarterly campaigns",
      ],
      pt: [
        "Adicione mentors e mentees como membros",
        "Use Affinity para sugerir matches",
        "Acompanhe a evolucao com campanhas trimestrais",
      ],
      it: [
        "Aggiungi mentor e mentee come membri",
        "Usa Affinity per suggerire match",
        "Traccia l'evoluzione con campagne trimestrali",
      ],
    },
    defaultProjectStatus: "active",
  },
];

export function getTemplate(key: string): WorkspaceTemplate | undefined {
  return WORKSPACE_TEMPLATES.find((t) => t.key === key);
}

export function getTemplateByType(type: WorkspaceType): WorkspaceTemplate | undefined {
  return WORKSPACE_TEMPLATES.find((t) => t.type === type);
}
