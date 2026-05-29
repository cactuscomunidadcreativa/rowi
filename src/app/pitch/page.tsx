"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  Download,
  TrendingDown,
  DollarSign,
  Brain,
  Layers,
  Heart,
  Bot,
  Network,
  PiggyBank,
  Cpu,
  Sparkles,
  Users,
  Building2,
  Target,
  Zap,
  BarChart3,
  Shield,
  MessageSquare,
  Lightbulb,
} from "lucide-react";

/* =========================================================
   TRANSLATIONS
========================================================= */
const t = {
  en: {
    // Slide 1
    s1_tag: "State of the Heart Report — Six Seconds",
    s1_title1: "The World Is Facing an",
    s1_title2: "Emotional Recession",
    s1_empathy: "Empathy",
    s1_wellbeing: "Wellbeing",
    s1_stress: "Stress",
    s1_years: "Years of Data",
    s1_highlight: "This is not a survey. It's longitudinal data from **200+ countries** over **27 years**.",
    s1_badge: "SIX SECONDS — The World's Largest EQ Research Organization",

    // Slide 2
    s2_tag: "The Business Impact",
    s2_title1: "The",
    s2_title2: "Trillion-Dollar",
    s2_title3: "Emotional Deficit",
    s2_cost: "Annual cost of disengagement",
    s2_workers: "Workers disengaged globally",
    s2_eq: "Job performance predicted by EQ",
    s2_highlight: "AI optimizes processes. But processes run on people.",
    s2_badge: "Sources: Gallup 2024, TalentSmart Research",

    // Slide 3
    s3_tag: "Scientific Foundation",
    s3_title1: "27 Years of",
    s3_title2: "Validated",
    s3_title3: "Science",
    s3_know: "Know Yourself",
    s3_choose: "Choose Yourself",
    s3_give: "Give Yourself",
    s3_know_items: ["Enhance Emotional Literacy", "Recognize Patterns"],
    s3_choose_items: ["Apply Consequential Thinking", "Navigate Emotions", "Engage Intrinsic Motivation", "Exercise Optimism"],
    s3_give_items: ["Increase Empathy", "Pursue Noble Goals"],
    s3_competencies: "Validated Competencies",
    s3_brain_styles: "Brain Styles",
    s3_brain_talents: "Brain Talents",
    s3_vital_signs: "Vital Signs",
    s3_countries: "Countries",
    s3_badge: "Used by the UN, FedEx, US Navy, and Fortune 500s",

    // Slide 4
    s4_title: "The Gap",
    s4_subtitle: "Measurement Exists. Infrastructure Doesn't.",
    s4_today: "TODAY",
    s4_tomorrow: "TOMORROW",
    s4_today_yes: ["Validated assessments exist", "Normative data (27 years)", "Proven competency model"],
    s4_today_no: ["Static PDF reports", "Manual interpretation", "One-time snapshots"],
    s4_tomorrow_items: ["Real-time correlation engine", "Multi-variable simulation", "Predictive modeling", "Organizational intelligence", "Emotional budgeting", "AI-powered coaching at scale"],

    // Slide 5
    s5_tag: "The Origin",
    s5_title1: "Meet Rowi:",
    s5_title2: "Your AI Companion",
    s5_b2c_title: "B2C — Where It All Starts",
    s5_b2c_sub: "It starts with people",
    s5_b2c_p1: "Rowi was born from a simple truth: **we interact with people every day but rarely understand how they think, feel, or create**. Even with those closest to us.",
    s5_b2c_p2: "Rowi is an **AI companion** that helps you understand your emotional patterns, see differences in how others think, and grow through genuine self-development.",
    s5_b2c_items: ["Understand your brain style and emotional strengths", "See how you connect (or disconnect) with others", "Grow through AI coaching grounded in real science", "Build better relationships with people who matter"],
    s5_b2b_title: "B2B — Scaling the Impact",
    s5_b2b_sub: "From personal growth to organizations",
    s5_b2b_p1: "When individuals grow emotionally, **teams transform**. What starts as personal development becomes organizational intelligence.",
    s5_b2b_p2: "Rowi gives organizations tools to **measure, model, and invest** in their people's emotional capital.",
    s5_b2b_items: ["Team affinity mapping and trust analytics", "Emotional ROI tied to business outcomes", "Predictive modeling for retention and performance", "Enterprise-ready: multi-tenant, SSO, white-label"],
    s5_badge: "From personal growth to organizational intelligence",

    // Slide 6
    s6_tag: "In Production",
    s6_title1: "What We've Built.",
    s6_title2: "Not a Prototype.",
    s6_models: "Data Models",
    s6_apis: "API Endpoints",
    s6_agents: "AI Agents",
    s6_tiers: "Subscription Tiers",
    s6_items: [
      "Tracks **9 EQ competencies** + 8 brain styles + 18 talents continuously",
      "**Affinity system** — maps relationships 0-135 with brain style compatibility",
      "Calculates **Emotional ROI** per organization with scenario modeling",
      "**WeekFlow** — weekly team rituals with mood check-ins and gamification",
    ],
    s6_badge: "Built in collaboration with Six Seconds",

    // Slide 7
    s7_tag: "AI Agents",
    s7_title1: "6 Specialized Agents.",
    s7_title2: "Grounded in Science.",
    s7_agents: [
      { name: "Super Rowi", desc: "Master coordinator. Detects intent, routes to specialized agents." },
      { name: "EQ Coach", desc: "Personal coaching on Six Seconds KCG framework with org culture context." },
      { name: "Affinity Coach", desc: "Interpersonal tactics based on brain style compatibility and shared talents." },
      { name: "Sales Agent", desc: "Sales methodology coaching with EQ integration." },
      { name: "Trainer Agent", desc: "Capability development aligned to competency gaps." },
      { name: "ECO Agent", desc: "Organizational emotional ecosystem analysis." },
    ],
    s7_highlight: "Each agent is enriched with **organizational culture context**, adapts language (EN/ES/PT/IT), and tracks every token for **cost-per-feature analytics**. Not ChatGPT wrappers.",

    // Slide 8
    s8_tag: "Technical Architecture",
    s8_title1: "Multi-Variable",
    s8_title2: "Emotional Modeling",
    s8_individual: "Individual Layer",
    s8_team: "Team Layer",
    s8_org: "Org Outcomes",
    s8_ind_items: ["8 Brain Styles", "9 EQ Competencies", "18 Brain Talents", "Mood Patterns", "Decision Quality"],
    s8_team_items: ["Trust Driver", "Motivation Driver", "Change Driver", "Teamwork Driver", "Execution Driver"],
    s8_org_items: ["Retention Rates", "Productivity", "Leadership Effectiveness", "Revenue Impact", "Culture Sustainability"],
    s8_highlight: "**Example:** A team member with a dominant action brain style + low Navigate Emotions + low Trust driver = **3.2x higher attrition risk**. Rowi can model this. At scale, this requires GPU infrastructure.",

    // Slide 9
    s9_tag: "New Category",
    s9_title: "Emotional Budgeting",
    s9_budget_yes_title: "Companies budget for",
    s9_budget_yes: ["Financial capital", "Technology", "Headcount"],
    s9_budget_no_title: "But NOT for",
    s9_budget_no: ["Psychological safety", "Trust capacity", "Emotional regulation", "Belonging & Purpose"],
    s9_highlight: "**Emotional Budgeting** = Strategic allocation of emotional development investment based on measurable drivers and predicted outcomes. Rowi's ROI Calculator enables CHROs to plan emotional investment like CFOs plan capex.",

    // Slide 10
    s10_tag: "The Partnership",
    s10_title: "Why NVIDIA",
    s10_subtitle: "The Infrastructure We Need to Scale",
    s10_cards: [
      { title: "GPU-Accelerated Computation", desc: "Real-time multi-variable correlation across thousands of organizations simultaneously." },
      { title: "Custom Model Training", desc: "Train on 27 years of normative EQ data — a dataset that doesn't exist anywhere else." },
      { title: "Technical Mentorship", desc: "Architecture guidance: LLM agents + predictive models + scenario simulation." },
      { title: "Ecosystem Access", desc: "Inception Program, GPU credits, developer tools, non-dilutive support." },
    ],
    s10_bring_title: "What We Bring",
    s10_bring: ["27 years of validated science (Six Seconds)", "Production platform (140+ models, 80+ APIs)", "6 AI agents serving real users", "Enterprise market traction", "Clear technical roadmap"],
    s10_seek_title: "What We Seek",
    s10_seek: ["NVIDIA Inception Program", "GPU credits for development", "Technical architecture mentorship", "Ecosystem validation", "Non-dilutive support"],

    // Slide 11
    s11_title1: "Emotional Capital",
    s11_title2: "Infrastructure",
    s11_subtitle: "Powered by Science. Accelerated by AI.",
    s11_stats: [
      { num: "27", label: "Years of Science" },
      { num: "140+", label: "Data Models" },
      { num: "6", label: "AI Agents" },
      { num: "1", label: "Mission" },
    ],
    s11_closing: "From Emotional Recession → to Emotional Budgeting",
    s11_closing2: "Guided by AI. Without losing humanity.",
  },
  es: {
    s1_tag: "Reporte State of the Heart — Six Seconds",
    s1_title1: "El Mundo Enfrenta una",
    s1_title2: "Recesión Emocional",
    s1_empathy: "Empatía",
    s1_wellbeing: "Bienestar",
    s1_stress: "Estrés",
    s1_years: "Años de Data",
    s1_highlight: "No es una encuesta. Es data longitudinal de **200+ países** durante **27 años**.",
    s1_badge: "SIX SECONDS — La Organización de Investigación en EQ Más Grande del Mundo",

    s2_tag: "El Impacto en Negocios",
    s2_title1: "El",
    s2_title2: "Déficit Emocional",
    s2_title3: "de Trillones de Dólares",
    s2_cost: "Costo anual del desengagement",
    s2_workers: "Trabajadores desenganchados globalmente",
    s2_eq: "Desempeño predicho por EQ",
    s2_highlight: "La IA optimiza procesos. Pero los procesos corren sobre personas.",
    s2_badge: "Fuentes: Gallup 2024, TalentSmart Research",

    s3_tag: "Fundamento Científico",
    s3_title1: "27 Años de Ciencia",
    s3_title2: "Validada",
    s3_title3: "",
    s3_know: "Conócete",
    s3_choose: "Elígete",
    s3_give: "Entrégate",
    s3_know_items: ["Alfabetización Emocional", "Reconocer Patrones"],
    s3_choose_items: ["Pensamiento Consecuencial", "Navegar Emociones", "Motivación Intrínseca", "Ejercitar Optimismo"],
    s3_give_items: ["Incrementar Empatía", "Perseguir Metas Nobles"],
    s3_competencies: "Competencias Validadas",
    s3_brain_styles: "Estilos Cerebrales",
    s3_brain_talents: "Talentos Cerebrales",
    s3_vital_signs: "Vital Signs",
    s3_countries: "Países",
    s3_badge: "Usado por la ONU, FedEx, US Navy y Fortune 500s",

    s4_title: "La Brecha",
    s4_subtitle: "La Medición Existe. La Infraestructura No.",
    s4_today: "HOY",
    s4_tomorrow: "MAÑANA",
    s4_today_yes: ["Existen evaluaciones validadas", "Data normativa (27 años)", "Modelo de competencias probado"],
    s4_today_no: ["Reportes PDF estáticos", "Interpretación manual", "Snapshots únicos"],
    s4_tomorrow_items: ["Motor de correlación en tiempo real", "Simulación multivariable", "Modelado predictivo", "Inteligencia organizacional", "Presupuesto emocional", "Coaching AI a escala"],

    s5_tag: "El Origen",
    s5_title1: "Conoce a Rowi:",
    s5_title2: "Tu Compañero AI",
    s5_b2c_title: "B2C — Donde Todo Comienza",
    s5_b2c_sub: "Comienza con las personas",
    s5_b2c_p1: "Rowi nació de una verdad simple: **interactuamos con personas todos los días pero rara vez entendemos cómo piensan, sienten o crean**. Incluso con los más cercanos.",
    s5_b2c_p2: "Rowi es un **compañero AI** que te ayuda a entender tus patrones emocionales, ver las diferencias en cómo otros piensan, y crecer a través del desarrollo personal genuino.",
    s5_b2c_items: ["Entiende tu estilo cerebral y fortalezas emocionales", "Ve cómo conectas (o desconectas) con otros", "Crece con coaching AI basado en ciencia real", "Construye mejores relaciones con quienes importan"],
    s5_b2b_title: "B2B — Escalando el Impacto",
    s5_b2b_sub: "De crecimiento personal a organizaciones",
    s5_b2b_p1: "Cuando los individuos crecen emocionalmente, **los equipos se transforman**. Lo que empieza como desarrollo personal se convierte en inteligencia organizacional.",
    s5_b2b_p2: "Rowi da a las organizaciones herramientas para **medir, modelar e invertir** en el capital emocional de su gente.",
    s5_b2b_items: ["Mapeo de afinidad de equipos y analítica de confianza", "ROI Emocional ligado a resultados de negocio", "Modelado predictivo para retención y desempeño", "Enterprise-ready: multi-tenant, SSO, white-label"],
    s5_badge: "De crecimiento personal a inteligencia organizacional",

    s6_tag: "En Producción",
    s6_title1: "Lo Que Hemos Construido.",
    s6_title2: "No Es un Prototipo.",
    s6_models: "Modelos de Datos",
    s6_apis: "Endpoints API",
    s6_agents: "Agentes AI",
    s6_tiers: "Niveles de Suscripción",
    s6_items: [
      "Trackea **9 competencias EQ** + 8 estilos cerebrales + 18 talentos continuamente",
      "**Sistema de Afinidad** — mapea relaciones 0-135 con compatibilidad de estilos cerebrales",
      "Calcula **ROI Emocional** por organización con modelado de escenarios",
      "**WeekFlow** — rituales semanales de equipo con check-ins de ánimo y gamificación",
    ],
    s6_badge: "Construido en colaboración con Six Seconds",

    s7_tag: "Agentes AI",
    s7_title1: "6 Agentes Especializados.",
    s7_title2: "Basados en Ciencia.",
    s7_agents: [
      { name: "Super Rowi", desc: "Coordinador maestro. Detecta intención, rutea a agentes especializados." },
      { name: "EQ Coach", desc: "Coaching personal en framework KCG de Six Seconds con contexto cultural." },
      { name: "Affinity Coach", desc: "Tácticas interpersonales basadas en compatibilidad de estilos cerebrales." },
      { name: "Sales Agent", desc: "Coaching de ventas con integración de inteligencia emocional." },
      { name: "Trainer Agent", desc: "Desarrollo de capacidades alineado a brechas de competencia." },
      { name: "ECO Agent", desc: "Análisis del ecosistema emocional organizacional." },
    ],
    s7_highlight: "Cada agente se enriquece con **contexto cultural organizacional**, adapta idioma (EN/ES/PT/IT), y trackea cada token para **analítica de costo por feature**. No son wrappers de ChatGPT.",

    s8_tag: "Arquitectura Técnica",
    s8_title1: "Modelado Emocional",
    s8_title2: "Multivariable",
    s8_individual: "Capa Individual",
    s8_team: "Capa Equipo",
    s8_org: "Outcomes Org",
    s8_ind_items: ["8 Estilos Cerebrales", "9 Competencias EQ", "18 Talentos Cerebrales", "Patrones de Ánimo", "Calidad de Decisiones"],
    s8_team_items: ["Driver Confianza", "Driver Motivación", "Driver Cambio", "Driver Equipo", "Driver Ejecución"],
    s8_org_items: ["Tasas de Retención", "Productividad", "Efectividad de Liderazgo", "Impacto en Revenue", "Sostenibilidad Cultural"],
    s8_highlight: "**Ejemplo:** Un miembro con estilo cerebral de acción dominante + baja regulación emocional + baja confianza en equipo = **3.2x mayor riesgo de rotación**. Rowi puede modelar esto. A escala, requiere infraestructura GPU.",

    s9_tag: "Nueva Categoría",
    s9_title: "Presupuesto Emocional",
    s9_budget_yes_title: "Las empresas presupuestan",
    s9_budget_yes: ["Capital financiero", "Tecnología", "Headcount"],
    s9_budget_no_title: "Pero NO presupuestan",
    s9_budget_no: ["Seguridad psicológica", "Capacidad de confianza", "Regulación emocional", "Pertenencia y Propósito"],
    s9_highlight: "**Presupuesto Emocional** = Asignación estratégica de inversión en desarrollo emocional basada en drivers medibles y outcomes predichos. El Calculador de ROI de Rowi permite a los CHROs planificar inversión emocional como los CFOs planifican capex.",

    s10_tag: "La Alianza",
    s10_title: "Por Qué NVIDIA",
    s10_subtitle: "La Infraestructura que Necesitamos para Escalar",
    s10_cards: [
      { title: "Computación Acelerada por GPU", desc: "Correlación multivariable en tiempo real en miles de organizaciones simultáneamente." },
      { title: "Entrenamiento de Modelos Custom", desc: "Entrenar con 27 años de data normativa EQ — un dataset que no existe en otro lugar." },
      { title: "Mentorship Técnico", desc: "Guía de arquitectura: agentes LLM + modelos predictivos + simulación de escenarios." },
      { title: "Acceso al Ecosistema", desc: "Programa Inception, créditos GPU, herramientas de desarrollo, soporte no dilutivo." },
    ],
    s10_bring_title: "Lo Que Traemos",
    s10_bring: ["27 años de ciencia validada (Six Seconds)", "Plataforma en producción (140+ modelos, 80+ APIs)", "6 agentes AI sirviendo usuarios reales", "Tracción en mercado enterprise", "Roadmap técnico claro"],
    s10_seek_title: "Lo Que Buscamos",
    s10_seek: ["Programa NVIDIA Inception", "Créditos GPU para desarrollo", "Mentorship de arquitectura técnica", "Validación del ecosistema", "Soporte no dilutivo"],

    s11_title1: "Infraestructura de",
    s11_title2: "Capital Emocional",
    s11_subtitle: "Impulsada por Ciencia. Acelerada por IA.",
    s11_stats: [
      { num: "27", label: "Años de Ciencia" },
      { num: "140+", label: "Modelos de Datos" },
      { num: "6", label: "Agentes AI" },
      { num: "1", label: "Misión" },
    ],
    s11_closing: "De Recesión Emocional → a Presupuesto Emocional",
    s11_closing2: "Guiado por IA. Sin perder humanidad.",
  },
};

/* =========================================================
   HELPER: render bold markdown
========================================================= */
function Bold({ text }: { text: string }) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
      )}
    </>
  );
}

/* =========================================================
   AGENT ICONS
========================================================= */
const agentIcons = [Sparkles, Brain, Heart, Target, Zap, Network];
const agentColors = [
  "from-[#31a2e3] to-[#7a59c9]",
  "bg-blue-100 text-blue-600",
  "bg-pink-100 text-pink-500",
  "bg-green-100 text-green-600",
  "bg-purple-100 text-purple-600",
  "bg-emerald-100 text-emerald-600",
];

/* =========================================================
   MAIN COMPONENT
========================================================= */
export default function PitchPage() {
  const [slide, setSlide] = useState(0);
  const [lang, setLang] = useState<"en" | "es">("en");
  const total = 11;
  const l = t[lang];

  const next = useCallback(() => setSlide((s) => Math.min(s + 1, total - 1)), []);
  const prev = useCallback(() => setSlide((s) => Math.max(s - 1, 0)), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev]);

  /* ---- Shared animation variants ---- */
  const fadeUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  };

  const stagger = (i: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay: i * 0.1 },
  });

  const scaleIn = (i: number) => ({
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.5, delay: i * 0.1 },
  });

  /* ---- Slide wrapper ---- */
  const Slide = ({ children, bg = "bg-[#FAFBFC]" }: { children: React.ReactNode; bg?: string }) => (
    <div className={`w-screen h-screen flex flex-col justify-center px-12 md:px-20 py-14 relative overflow-hidden ${bg}`}>
      {children}
    </div>
  );

  /* ---- Tag component ---- */
  const Tag = ({ text, color = "bg-blue-50 text-blue-600" }: { text: string; color?: string }) => (
    <motion.span {...fadeUp} className={`inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-5 ${color}`}>
      {text}
    </motion.span>
  );

  /* ---- Stat card ---- */
  const StatCard = ({ value, label, color, i }: { value: string; label: string; color: string; i: number }) => (
    <motion.div {...scaleIn(i)} className="flex-1 bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
      <div className={`text-4xl md:text-5xl font-extrabold ${color}`}>{value}</div>
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-2">{label}</div>
    </motion.div>
  );

  /* ---- SS Badge ---- */
  const SSBadge = ({ text }: { text: string }) => (
    <div className="absolute bottom-16 left-12 md:left-20 flex items-center gap-2 text-xs text-gray-400">
      <span className="font-semibold text-[#1E88E5]">SIX SECONDS</span> — {text}
    </div>
  );

  /* ---- Rowi Badge ---- */
  const RowiBadge = ({ text }: { text: string }) => (
    <div className="absolute bottom-16 left-12 md:left-20 flex items-center gap-2.5 text-xs text-gray-400">
      <Image src="/rowi-logo.png" alt="Rowi" width={22} height={22} className="rounded-md" />
      <span><strong className="text-[#31a2e3]">ROWI</strong> — {text}</span>
    </div>
  );

  /* ---- Slide number ---- */
  const SlideNum = ({ n }: { n: number }) => (
    <span className="absolute top-6 right-8 text-xs text-gray-400 font-medium">
      {String(n).padStart(2, "0")} / {total}
    </span>
  );

  /* =========================================================
     SLIDES
  ========================================================= */
  const slides = [
    // ---- SLIDE 1: Emotional Recession ----
    <Slide key={0}>
      <SlideNum n={1} />
      <Tag text={l.s1_tag} />
      <motion.h1 {...fadeUp} className="font-[Varela_Round] text-4xl md:text-5xl leading-tight text-[#1B2A4A]">
        {l.s1_title1}<br /><span className="text-[#E53935]">{l.s1_title2}</span>
      </motion.h1>
      <div className="flex gap-4 md:gap-8 mt-8">
        <StatCard value="-18%" label={l.s1_empathy} color="text-[#E53935]" i={0} />
        <StatCard value="-14%" label={l.s1_wellbeing} color="text-[#E53935]" i={1} />
        <StatCard value="+22%" label={l.s1_stress} color="text-[#E53935]" i={2} />
        <StatCard value="27" label={l.s1_years} color="text-[#1E88E5]" i={3} />
      </div>
      <motion.div {...stagger(4)} className="bg-blue-50/60 border-l-4 border-[#1E88E5] rounded-xl p-5 mt-6 text-base leading-relaxed text-[#1B2A4A]">
        <Bold text={l.s1_highlight} />
      </motion.div>
      <SSBadge text={l.s1_badge} />
    </Slide>,

    // ---- SLIDE 2: Trillion Dollar Deficit ----
    <Slide key={1}>
      <SlideNum n={2} />
      <Tag text={l.s2_tag} />
      <motion.h1 {...fadeUp} className="font-[Varela_Round] text-4xl md:text-5xl leading-tight text-[#1B2A4A]">
        {l.s2_title1} <span className="text-[#E53935]">{l.s2_title2}</span><br />{l.s2_title3}
      </motion.h1>
      <div className="flex gap-4 md:gap-8 mt-8">
        <StatCard value="$8.8T" label={l.s2_cost} color="text-[#E53935]" i={0} />
        <StatCard value="77%" label={l.s2_workers} color="text-[#1B2A4A]" i={1} />
        <StatCard value="55%" label={l.s2_eq} color="text-[#1E88E5]" i={2} />
      </div>
      <motion.div {...stagger(3)} className="bg-blue-50/60 border-l-4 border-[#1E88E5] rounded-xl p-5 mt-6 text-base leading-relaxed text-[#1B2A4A]">
        <Bold text={l.s2_highlight} />
      </motion.div>
      <SSBadge text={l.s2_badge} />
    </Slide>,

    // ---- SLIDE 3: Science ----
    <Slide key={2}>
      <SlideNum n={3} />
      <Tag text={l.s3_tag} />
      <motion.h1 {...fadeUp} className="font-[Varela_Round] text-4xl md:text-5xl leading-tight text-[#1B2A4A]">
        {l.s3_title1} <span className="text-[#1E88E5]">{l.s3_title2}</span> {l.s3_title3}
      </motion.h1>
      <div className="flex gap-5 mt-7">
        {[
          { title: l.s3_know, items: l.s3_know_items, grad: "from-[#1E88E5] to-[#1565C0]" },
          { title: l.s3_choose, items: l.s3_choose_items, grad: "from-[#E53935] to-[#C62828]" },
          { title: l.s3_give, items: l.s3_give_items, grad: "from-[#43A047] to-[#2E7D32]" },
        ].map((card, i) => (
          <motion.div key={i} {...scaleIn(i)} className={`flex-1 bg-gradient-to-br ${card.grad} rounded-2xl p-6 text-white relative overflow-hidden`}>
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/10" />
            <h3 className="font-[Varela_Round] text-xl mb-1">{card.title}</h3>
            <ul className="text-sm opacity-90 mt-3 space-y-1">
              {card.items.map((item, j) => <li key={j}>+ {item}</li>)}
            </ul>
          </motion.div>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-4 mt-6">
        {[
          { n: "8", label: l.s3_competencies, bg: "bg-[#1E88E5]" },
          { n: "8", label: l.s3_brain_styles, bg: "bg-[#E53935]" },
          { n: "18", label: l.s3_brain_talents, bg: "bg-[#E53935]" },
          { n: "5", label: l.s3_vital_signs, bg: "bg-[#43A047]" },
          { n: "200+", label: l.s3_countries, bg: "bg-[#1B2A4A]" },
        ].map((item, i) => (
          <motion.div key={i} {...stagger(i + 3)} className="flex items-start gap-2.5">
            <div className={`w-7 h-7 rounded-lg ${item.bg} text-white flex items-center justify-center text-xs font-bold flex-shrink-0`}>{item.n}</div>
            <span className="text-sm text-[#1B2A4A] leading-snug"><strong>{item.label}</strong></span>
          </motion.div>
        ))}
      </div>
      <SSBadge text={l.s3_badge} />
    </Slide>,

    // ---- SLIDE 4: The Gap ----
    <Slide key={3} bg="bg-gradient-to-br from-[#FAFBFC] via-[#edf2f7] to-[#f7f9fb]">
      <SlideNum n={4} />
      <motion.h1 {...fadeUp} className="font-[Varela_Round] text-4xl md:text-5xl text-[#1B2A4A]">{l.s4_title}</motion.h1>
      <motion.h2 {...stagger(1)} className="font-[Varela_Round] text-xl text-gray-500 mt-2 mb-8">{l.s4_subtitle}</motion.h2>
      <div className="flex gap-8 items-stretch">
        <motion.div {...stagger(2)} className="flex-1 bg-white rounded-2xl p-7 border border-gray-200 shadow-sm">
          <h3 className="font-[Varela_Round] text-lg text-gray-400 mb-4">{l.s4_today}</h3>
          {l.s4_today_yes.map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 py-2.5 border-b border-gray-100 text-sm text-gray-700">
              <span className="text-[#43A047]">&#10003;</span> {item}
            </div>
          ))}
          {l.s4_today_no.map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 py-2.5 border-b border-gray-100 text-sm text-gray-400">
              <span className="text-[#E53935]">&#10007;</span> {item}
            </div>
          ))}
        </motion.div>
        <div className="flex items-center text-3xl text-gray-300">&#10132;</div>
        <motion.div {...stagger(3)} className="flex-1 bg-blue-50/50 rounded-2xl p-7 border border-blue-100">
          <h3 className="font-[Varela_Round] text-lg text-[#31a2e3] mb-4">{l.s4_tomorrow}</h3>
          {l.s4_tomorrow_items.map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 py-2.5 border-b border-blue-50 text-sm text-gray-700">
              <span className={i < 2 ? "text-[#31a2e3]" : i < 4 ? "text-[#f378a5]" : "text-[#7a59c9]"}>&#9679;</span> {item}
            </div>
          ))}
        </motion.div>
      </div>
    </Slide>,

    // ---- SLIDE 5: Meet Rowi ----
    <Slide key={4} bg="bg-[#f7f9fb]">
      <SlideNum n={5} />
      <Tag text={l.s5_tag} color="bg-blue-50 text-[#31a2e3]" />
      <motion.h1 {...fadeUp} className="font-[Varela_Round] text-4xl md:text-5xl leading-tight bg-gradient-to-r from-[#31a2e3] to-[#f378a5] bg-clip-text text-transparent">
        {l.s5_title1}<br />{l.s5_title2}
      </motion.h1>
      <div className="flex gap-6 mt-6">
        {/* B2C */}
        <motion.div {...stagger(1)} className="flex-1 bg-white rounded-2xl p-7 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Image src="/rowi-logo.png" alt="Rowi" width={40} height={40} className="rounded-xl" />
            <div>
              <h3 className="font-[Varela_Round] text-lg text-[#31a2e3]">{l.s5_b2c_title}</h3>
              <span className="text-xs text-gray-400">{l.s5_b2c_sub}</span>
            </div>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed mb-2"><Bold text={l.s5_b2c_p1} /></p>
          <p className="text-sm text-gray-700 leading-relaxed mb-3"><Bold text={l.s5_b2c_p2} /></p>
          <div className="space-y-1.5">
            {l.s5_b2c_items.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-gray-500">
                <span className="text-[#31a2e3] mt-0.5">&#9670;</span> {item}
              </div>
            ))}
          </div>
        </motion.div>
        {/* B2B */}
        <motion.div {...stagger(2)} className="flex-1 bg-white rounded-2xl p-7 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7a59c9] to-[#31a2e3] flex items-center justify-center text-white"><Building2 size={20} /></div>
            <div>
              <h3 className="font-[Varela_Round] text-lg text-[#7a59c9]">{l.s5_b2b_title}</h3>
              <span className="text-xs text-gray-400">{l.s5_b2b_sub}</span>
            </div>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed mb-2"><Bold text={l.s5_b2b_p1} /></p>
          <p className="text-sm text-gray-700 leading-relaxed mb-3"><Bold text={l.s5_b2b_p2} /></p>
          <div className="space-y-1.5">
            {l.s5_b2b_items.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-gray-500">
                <span className="text-[#7a59c9] mt-0.5">&#9670;</span> {item}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
      <RowiBadge text={l.s5_badge} />
    </Slide>,

    // ---- SLIDE 6: What We've Built ----
    <Slide key={5} bg="bg-[#f7f9fb]">
      <SlideNum n={6} />
      <Tag text={l.s6_tag} color="bg-blue-50 text-[#31a2e3]" />
      <motion.h1 {...fadeUp} className="font-[Varela_Round] text-4xl md:text-5xl leading-tight bg-gradient-to-r from-[#31a2e3] to-[#f378a5] bg-clip-text text-transparent">
        {l.s6_title1}<br />{l.s6_title2}
      </motion.h1>
      <div className="flex gap-4 md:gap-8 mt-8">
        <StatCard value="140+" label={l.s6_models} color="text-[#31a2e3]" i={0} />
        <StatCard value="80+" label={l.s6_apis} color="text-[#f378a5]" i={1} />
        <StatCard value="6" label={l.s6_agents} color="text-[#7a59c9]" i={2} />
        <StatCard value="5" label={l.s6_tiers} color="text-gray-800" i={3} />
      </div>
      <div className="grid grid-cols-2 gap-3 mt-6">
        {l.s6_items.map((item, i) => (
          <motion.div key={i} {...stagger(i + 4)} className="flex items-start gap-2.5 text-sm text-gray-700">
            <span className={i % 2 === 0 ? "text-[#31a2e3]" : "text-[#f378a5]"}>&#9670;</span>
            <Bold text={item} />
          </motion.div>
        ))}
      </div>
      <RowiBadge text={l.s6_badge} />
    </Slide>,

    // ---- SLIDE 7: AI Agents ----
    <Slide key={6} bg="bg-[#f7f9fb]">
      <SlideNum n={7} />
      <Tag text={l.s7_tag} color="bg-blue-50 text-[#31a2e3]" />
      <motion.h1 {...fadeUp} className="font-[Varela_Round] text-4xl md:text-5xl leading-tight bg-gradient-to-r from-[#31a2e3] to-[#f378a5] bg-clip-text text-transparent">
        {l.s7_title1}<br />{l.s7_title2}
      </motion.h1>
      <div className="grid grid-cols-3 gap-4 mt-6">
        {l.s7_agents.map((agent, i) => {
          const Icon = agentIcons[i];
          return (
            <motion.div key={i} {...scaleIn(i)} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${i === 0 ? `bg-gradient-to-br ${agentColors[0]} text-white` : agentColors[i]}`}>
                <Icon size={20} />
              </div>
              <h4 className="font-semibold text-gray-800 text-sm">{agent.name}</h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{agent.desc}</p>
            </motion.div>
          );
        })}
      </div>
      <motion.div {...stagger(6)} className="bg-blue-50/50 border-l-4 border-[#31a2e3] rounded-xl p-4 mt-5 text-sm leading-relaxed text-gray-700">
        <Bold text={l.s7_highlight} />
      </motion.div>
      <RowiBadge text="AI Engine" />
    </Slide>,

    // ---- SLIDE 8: Multi-Variable Modeling ----
    <Slide key={7} bg="bg-[#f7f9fb]">
      <SlideNum n={8} />
      <Tag text={l.s8_tag} color="bg-blue-50 text-[#31a2e3]" />
      <motion.h1 {...fadeUp} className="font-[Varela_Round] text-4xl md:text-5xl leading-tight bg-gradient-to-r from-[#31a2e3] to-[#f378a5] bg-clip-text text-transparent">
        {l.s8_title1}<br />{l.s8_title2}
      </motion.h1>
      <div className="flex gap-4 items-stretch mt-7">
        {[
          { title: l.s8_individual, items: l.s8_ind_items, border: "border-blue-200", bg: "bg-blue-50/50", color: "text-[#1E88E5]" },
          { title: l.s8_team, items: l.s8_team_items, border: "border-pink-200", bg: "bg-pink-50/50", color: "text-[#f378a5]" },
          { title: l.s8_org, items: l.s8_org_items, border: "border-purple-200", bg: "bg-purple-50/50", color: "text-[#7a59c9]" },
        ].map((layer, i) => (
          <motion.div key={i} {...scaleIn(i)} className="flex items-stretch flex-1 gap-4">
            <div className={`flex-1 ${layer.bg} rounded-2xl p-5 border ${layer.border}`}>
              <h4 className={`text-xs uppercase tracking-wider font-semibold ${layer.color} mb-3`}>{layer.title}</h4>
              <ul className="space-y-1.5 text-sm text-gray-700">
                {layer.items.map((item, j) => <li key={j}>&#9670; {item}</li>)}
              </ul>
            </div>
            {i < 2 && <div className="flex items-center text-xl text-gray-300">&#10132;</div>}
          </motion.div>
        ))}
      </div>
      <motion.div {...stagger(3)} className="bg-blue-50/50 border-l-4 border-[#31a2e3] rounded-xl p-4 mt-5 text-sm leading-relaxed text-gray-700">
        <Bold text={l.s8_highlight} />
      </motion.div>
      <RowiBadge text="Multi-Variable Engine" />
    </Slide>,

    // ---- SLIDE 9: Emotional Budgeting ----
    <Slide key={8} bg="bg-[#f7f9fb]">
      <SlideNum n={9} />
      <Tag text={l.s9_tag} color="bg-purple-50 text-[#7a59c9]" />
      <motion.h1 {...fadeUp} className="font-[Varela_Round] text-4xl md:text-5xl leading-tight bg-gradient-to-r from-[#31a2e3] to-[#f378a5] bg-clip-text text-transparent">
        {l.s9_title}
      </motion.h1>
      <div className="flex gap-8 mt-8">
        <motion.div {...stagger(1)} className="flex-1 bg-white rounded-2xl p-7 border border-gray-100 shadow-sm">
          <h3 className="font-[Varela_Round] text-lg text-gray-400 mb-4">{l.s9_budget_yes_title}</h3>
          {l.s9_budget_yes.map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 py-2.5 text-sm text-gray-700">
              <span className="text-[#43A047]">&#10003;</span> {item}
            </div>
          ))}
        </motion.div>
        <motion.div {...stagger(2)} className="flex-1 bg-red-50/40 rounded-2xl p-7 border border-red-100">
          <h3 className="font-[Varela_Round] text-lg text-[#E53935] mb-4">{l.s9_budget_no_title}</h3>
          {l.s9_budget_no.map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 py-2.5 text-sm text-gray-700">
              <span className="text-[#E53935]">&#10007;</span> {item}
            </div>
          ))}
        </motion.div>
      </div>
      <motion.div {...stagger(3)} className="bg-purple-50/50 border-l-4 border-[#7a59c9] rounded-xl p-4 mt-5 text-sm leading-relaxed text-gray-700">
        <Bold text={l.s9_highlight} />
      </motion.div>
      <RowiBadge text="Emotional Capital Infrastructure" />
    </Slide>,

    // ---- SLIDE 10: Why NVIDIA ----
    <Slide key={9} bg="bg-[#f7f9fb]">
      <SlideNum n={10} />
      <Tag text={l.s10_tag} color="bg-green-50 text-[#76b900]" />
      <motion.h1 {...fadeUp} className="font-[Varela_Round] text-4xl md:text-5xl leading-tight bg-gradient-to-r from-[#76b900] to-[#31a2e3] bg-clip-text text-transparent">
        {l.s10_title}
      </motion.h1>
      <motion.h2 {...stagger(1)} className="text-lg text-gray-500 mt-1 mb-5">{l.s10_subtitle}</motion.h2>
      <div className="grid grid-cols-2 gap-3">
        {l.s10_cards.map((card, i) => (
          <motion.div key={i} {...scaleIn(i)} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <h4 className="text-sm font-semibold text-[#76b900] mb-1">{card.title}</h4>
            <p className="text-xs text-gray-500 leading-relaxed">{card.desc}</p>
          </motion.div>
        ))}
      </div>
      <div className="flex gap-5 mt-4">
        <motion.div {...stagger(4)} className="flex-1 bg-white rounded-xl p-5 border border-gray-100">
          <h3 className="text-sm font-semibold text-[#31a2e3] mb-2 font-[Varela_Round]">{l.s10_bring_title}</h3>
          <div className="text-xs text-gray-600 leading-loose">
            {l.s10_bring.map((item, i) => <div key={i}>&#9670; {item}</div>)}
          </div>
        </motion.div>
        <motion.div {...stagger(5)} className="flex-1 bg-green-50/50 rounded-xl p-5 border border-green-100">
          <h3 className="text-sm font-semibold text-[#76b900] mb-2 font-[Varela_Round]">{l.s10_seek_title}</h3>
          <div className="text-xs text-gray-600 leading-loose">
            {l.s10_seek.map((item, i) => <div key={i}>&#9670; {item}</div>)}
          </div>
        </motion.div>
      </div>
      <RowiBadge text="ROWI + NVIDIA" />
    </Slide>,

    // ---- SLIDE 11: Closing ----
    <Slide key={10} bg="bg-[#f7f9fb]">
      <div className="flex flex-col items-center justify-center h-full text-center">
        <motion.div {...fadeUp}>
          <Image src="/rowi-logo.png" alt="Rowi" width={100} height={100} className="rounded-3xl mb-8 mx-auto" />
        </motion.div>
        <motion.h1 {...stagger(1)} className="font-[Varela_Round] text-4xl md:text-5xl leading-tight bg-gradient-to-r from-[#31a2e3] to-[#f378a5] bg-clip-text text-transparent">
          {l.s11_title1}<br />{l.s11_title2}
        </motion.h1>
        <motion.p {...stagger(2)} className="text-xl text-gray-500 mt-4 max-w-lg">{l.s11_subtitle}</motion.p>
        <motion.div {...stagger(3)} className="flex gap-10 mt-10">
          {l.s11_stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl font-extrabold bg-gradient-to-r from-[#31a2e3] to-[#f378a5] bg-clip-text text-transparent">{stat.num}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
        <motion.div {...stagger(4)} className="mt-10 text-lg text-gray-700 max-w-md leading-relaxed">
          {l.s11_closing}<br />
          <span className="text-gray-400">{l.s11_closing2}</span>
        </motion.div>
        <motion.div {...stagger(5)} className="mt-6 text-gray-400 text-sm">rowi.ai</motion.div>
      </div>
    </Slide>,
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }}
        >
          {slides[slide]}
        </motion.div>
      </AnimatePresence>

      {/* ---- NAV BAR ---- */}
      <div className="fixed bottom-0 left-0 right-0 h-14 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md border-t border-gray-200 z-50">
        <button onClick={prev} disabled={slide === 0} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 disabled:opacity-30 transition-colors">
          <ArrowLeft size={16} /> Prev
        </button>

        <div className="flex items-center gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i === slide
                  ? i < 3 ? "bg-[#1E88E5] scale-125" : i === 9 ? "bg-[#76b900] scale-125" : "bg-[#31a2e3] scale-125"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">{slide + 1} / {total}</span>

          {/* Language toggle */}
          <button
            onClick={() => setLang(lang !== "es" ? "es" : "en")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-600 transition-colors"
          >
            <Globe size={13} />
            {lang !== "es" ? "ES" : "EN"}
          </button>

          {/* PDF */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#31a2e3] to-[#f378a5] text-white text-xs font-medium hover:opacity-90 transition-opacity"
          >
            <Download size={13} />
            PDF
          </button>

          <button onClick={next} disabled={slide === total - 1} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 disabled:opacity-30 transition-colors">
            Next <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
