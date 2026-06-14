import guiaMod from "@/lib/deliverables/guia-confidencial.ts";
import engineMod from "@/lib/consultant/diagnosis-engine.ts";
import fs from "fs";
const buildGuiaConfidencial = (guiaMod as any).buildGuiaConfidencial;
const { readLayer, readIceberg, segment } = engineMod as any;
const owl = fs.readFileSync(process.cwd() + "/public/owl.png");

// Métricas tipo "Bancolombia": TVS de equipo (agregado) + SEI individual del líder.
const teamMetrics = [
  { key: "TEAMWORK_CONNECTION", label: "Conexión", mean: 103.2 },
  { key: "MOTIVATION_MEANING", label: "Significado", mean: 99.1 },
  { key: "EXECUTION_FOCUS", label: "Enfoque", mean: 105.4, sd: 16.2 },
  { key: "TRUST_CARE", label: "Cuidado", mean: 101.8 },
];
const seiMetrics = [
  { key: "EMP", label: "Empatía", mean: 114.7 },
  { key: "RP", label: "Reconocer patrones", mean: 113.5 },
  { key: "NE", label: "Navega emociones", mean: 81.5 },
  { key: "OP", label: "Optimismo", mean: 88.0 },
  { key: "NG", label: "Metas nobles", mean: 111.3 },
];
const insights = [
  ...readLayer(teamMetrics, "team"),
  ...readLayer(seiMetrics, "individual"),
  ...readIceberg(teamMetrics, seiMetrics),
];
const baskets = segment(insights);
console.log("partner insights:", baskets.partner.length);

const data = {
  subjectLabel: "Bancolombia",
  scopeLabel: "Vital Signs + SEI",
  teamMap: [
    { team: "Piloto · Gerencia Desarrollo de Talento (13)", measured: "TVS de equipo + SEI individual · oct 2025", bridgeRole: "Líder de este equipo" },
    { team: "Equipo de Soraya (6)", measured: "Solo SEI individual · dic 2025 – ene 2026", bridgeRole: "Miembro de este equipo" },
  ],
  mirror: {
    replicated: "empatía (+14.7), reconocer patrones (+13.5), optimismo (+12.8) y metas nobles (+11.3)",
    lowestCompLabel: "Navega Emociones",
    lowestCompValue: 81.5,
    pulsePointLed: "Navega Emociones",
  },
  movement: {
    fromTo: "octubre y enero",
    note: "La persona fue medida dos veces, con ~3 meses de diferencia. Respondió de forma honesta ambas veces (impresión positiva “Average”), así que los cambios son señal real — aunque es una sola persona, dos tomas, sin intervención formal conocida entre ambas.",
    rows: [
      { strengthened: "Navega Emociones +12.3", cooled: "Optimismo -23.8 (ahora bajo la norma)" },
      { strengthened: "Pensamiento de Consecuencias +9.6", cooled: "Empatía -11.5 · Metas Nobles -12.3" },
      { strengthened: "Adaptabilidad +14 · Efectividad +7.6", cooled: "Resiliencia -17 · IE total -5.1" },
    ],
  },
  otherSignal: "En el equipo de Soraya (6 personas), una persona reporta “miedo” como estado de ánimo reciente y queda al final en IE del grupo. En un equipo pequeño, eso pesa. Es conversación de debrief con la líder (Soraya), con tacto — no un dato para exponer en grupo.",
  partnerInsights: baskets.partner,
};

for (const lang of ["es", "en", "pt"]) {
  const buf = await buildGuiaConfidencial(data, lang, owl);
  fs.writeFileSync(`/tmp/guia-confidencial-${lang}.pdf`, buf);
  console.log("OK", lang, buf.length);
}
