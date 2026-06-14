import hallMod from "@/lib/deliverables/hallazgos.ts";
import fs from "fs";
const buildHallazgos = (hallMod as any).buildHallazgos;
const owl = fs.readFileSync(process.cwd() + "/public/owl.png");

const data = {
  client: "Bancolombia",
  scope: {
    cards: [
      { number: "13", title: "Equipo Gerencia Desarrollo de Talento", desc: "personas · Recursos Humanos\nTVS de equipo + SEI individual\nMedición: octubre 2025" },
      { number: "6", title: "Equipo Soraya", desc: "líder ejecutiva senior + equipo\nSEI individual\nMedición: dic 2025 – ene 2026" },
      { number: "1", title: "Persona puente", desc: "aparece en ambos equipos\nmedida dos veces\ncandidata a champion interno" },
    ],
    note: "La diferencia de fechas sugiere expansión orgánica: el piloto de HR abrió la puerta y un equipo ejecutivo se contagió después.",
  },
  finding1: {
    surfaceTitle: "En la superficie · TVS del equipo (clima colectivo)",
    surface: [
      { label: "Confianza", value: "116.6" }, { label: "Motivación", value: "119.4" },
      { label: "Resultados", value: "121.3" }, { label: "Compromiso", value: "85%" },
      { label: "Cambio", value: "113.6", flag: true },
    ],
    deepTitle: "Debajo de la superficie · SEI individual (las mismas 13 personas)",
    deep: [
      { label: "IE promedio", value: "104.9" }, { label: "Navega Emoc.", value: "95.4", flag: true },
      { label: "Motiv. Intrínseca", value: "95.5", flag: true }, { label: "Bienestar", value: "99.3" },
      { label: "Equilibrio", value: "97.3" },
    ],
    reading: "El clima dice «equipo de alto desempeño». El dato individual muestra autorregulación, motivación interna y bienestar por debajo de la norma: fuerte hoy, frágil para sostenerlo.",
  },
  finding2: {
    correlations: [
      { label: "Toma de decisiones", value: 0.78 }, { label: "Calidad de vida", value: 0.75 },
      { label: "Efectividad", value: 0.73 }, { label: "Relaciones", value: 0.73 },
      { label: "Bienestar", value: 0.65 }, { label: "Satisfacción", value: 0.64 },
    ],
    crossTitle: "El cruce que cierra la conversación",
    crossBody: "Navega Emociones — la competencia más baja del equipo (95.4) — es justo la que más empuja: Equilibrio r = +0.64, Calidad de vida r = +0.63. Invertir ahí no es «soft»: es la palanca de sostenibilidad que el equipo ya tiene floja.",
    note: "Correlaciones de Pearson, n = 13. Muestra pequeña: lectura direccional, no prueba causal.",
  },
  finding3: {
    bars: [
      { label: "Visión", value: 108.6 }, { label: "Pens. crítico", value: 107.4 },
      { label: "Adaptabilidad", value: 102.0 }, { label: "Resiliencia", value: 100.0 },
      { label: "Proactividad", value: 94.8 }, { label: "Imaginación", value: 96.0 },
      { label: "Tol. al riesgo", value: 95.4 },
    ],
    mechanism: [
      { lead: "Ven y analizan bien el futuro", body: "Visión (108.6) y pensamiento crítico (107.4) altos." },
      { lead: "Pero no se arriesgan a explorar", body: "Tolerancia al riesgo (95.4) e imaginación (96.0) son lo más bajo." },
      { lead: "Y está repartido", body: "De ~89 a ~112 entre personas. Eso explica la dispersión enorme (DE 21.6) en Exploración del TVS." },
    ],
    note: "Norma global = 100.",
  },
  finding4: {
    leaderName: "Soraya",
    aboveTitle: "Donde la líder está MUY por encima de su equipo",
    above: [
      { label: "Metas Nobles", value: "+19.4" }, { label: "Navega Emociones", value: "+18.4" },
      { label: "Alfabetización Emocional", value: "+17.6" }, { label: "Empatía", value: "+14.7" },
      { label: "Motivación Intrínseca", value: "+12.7" },
    ],
    belowTitle: "Donde la líder va por debajo de su equipo",
    below: [
      { label: "Pensamiento de Consecuencias", sub: "89.3 — bajo la norma. Lidera desde el corazón; su rigor de decisión es el punto a fortalecer.", value: "-11.7" },
      { label: "Efectividad", sub: "Su equipo se percibe más efectivo operativamente que ella.", value: "-6.6" },
    ],
    careNote: "Señal a atender con cuidado: en un equipo de 6, una persona reporta «miedo» como estado de ánimo reciente. Es conversación de debrief, no diagnóstico.",
  },
  finding5: {
    intro: "La única persona presente en ambos equipos fue evaluada en octubre y de nuevo en enero (~3 meses). El movimiento es mixto — y ese es exactamente el punto.",
    strengthenedTitle: "Se fortaleció hacia adentro",
    strengthened: [
      { label: "Navega Emociones (81.5 -> 93.8)", value: "+12.3" }, { label: "Pensamiento de Consecuencias", value: "+9.6" },
      { label: "Efectividad", value: "+7.6" }, { label: "Bienestar", value: "+4.7" },
    ],
    cooledTitle: "Se debilitó hacia afuera",
    cooled: [
      { label: "Optimismo", value: "-23.8" }, { label: "Metas Nobles", value: "-12.3" },
      { label: "Empatía", value: "-11.5" }, { label: "IE total", value: "-5.1" },
    ],
    honestRead: "un puntaje alto en octubre no se sostuvo solo. La caída de optimismo merece una conversación humana, no una celebración de dato. Y sin re-medición, este giro habría sido invisible.",
    note: "Caso anonimizado · n = 1, dos tomas.",
  },
  meaning: {
    frontA: { title: "Frente HR · Gerencia Desarrollo de Talento", message: "Mensaje: sostenibilidad y desbloqueo del cambio", bullets: ["Equipo fuerte hoy, frágil para sostenerlo", "Re-medición TVS a 3-6 meses (recurrente)", "Talleres de exploración / experimentación", "Cuidado del motor individual: autorregulación y motivación"] },
    frontB: { title: "Frente ejecutivo · Equipo Soraya", message: "Mensaje: desarrollo de liderazgo", bullets: ["LVS (Leadership Vital Signs) para la líder", "Coaching 1:1: rigor de decisión y combustible propio", "Sesión de equipo que aborde la señal de ansiedad", "Alineación líder–equipo"] },
    bridgeNote: "La persona puente conecta ambos frentes: vivió el piloto, está en el equipo ejecutivo y conoce el lenguaje VS/SEI. Es la candidata natural a champion interno — y su propia data es el ejemplo vivo de por qué medir una vez no basta.",
  },
};

for (const lang of ["es", "en", "pt"]) {
  const buf = await buildHallazgos(data, lang, owl);
  fs.writeFileSync(`/tmp/hallazgos-${lang}.pptx`, buf);
  console.log("OK", lang, buf.length);
}
