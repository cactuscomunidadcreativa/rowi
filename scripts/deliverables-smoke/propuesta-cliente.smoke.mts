import propMod from "@/lib/deliverables/propuesta-cliente.ts";
import fs from "fs";
const buildPropuestaCliente = (propMod as any).buildPropuestaCliente;
const owl = fs.readFileSync(process.cwd() + "/public/owl.png");

const data = {
  client: "Bancolombia",
  whatWeHeard: {
    lead: "El equipo es fuerte. El clima medido con Team Vital Signs está sobre la media mundial en todos los indicadores, con 85% de engagement. No es un equipo en problemas.",
    question: "La pregunta no es “cómo arreglarlo” sino “cómo sostenerlo y desbloquear su siguiente nivel”. Para responderla, miramos dos capas juntas: el clima del equipo (TVS) y las capacidades de IE de sus miembros (SEI, agregado).",
    onTable: [
      { title: "Team Vital Signs (TVS)", desc: "Clima y efectividad del equipo · 5 drivers y 4 outcomes." },
      { title: "SEI — perfiles de IE (agregado)", desc: "Capacidades emocionales individuales, leídas como patrón de equipo." },
    ],
  },
  lens1: {
    climateTitle: "Clima de equipo (TVS)",
    climate: [
      { label: "Confianza", value: "116.6" },
      { label: "Motivación", value: "119.4" },
      { label: "Resultados", value: "121.3" },
      { label: "Engagement", value: "85%" },
    ],
    capsTitle: "Capacidades de IE (SEI, agregado)",
    caps: [
      { label: "EQ promedio", value: "104.9" },
      { label: "Navegar emociones", value: "95.4" },
      { label: "Motivación intrínseca", value: "95.5" },
      { label: "Bienestar / Balance", value: "99 / 97" },
    ],
    note: "La cadena está validada en su propia data: mayor IE va con mejores decisiones, efectividad y relaciones (correlaciones de +0.7, n=13, lectura direccional).",
  },
  lens2: {
    strengths: ["Alta confianza y coherencia", "Orientación a ejecución y resultados", "Conexión y pertenencia", "85% comprometidos, 0% desconectados"],
    opportunities: ["Cambio y agilidad: lo más bajo del modelo", "Exploración con dispersión muy alta (no todos alineados)", "Autorregulación colectiva con espacio para crecer", "Bienestar y balance a cuidar"],
    note: "Para un banco en transformación digital, el músculo a desarrollar es precisamente adaptar y experimentar — sin perder la confianza que ya tienen.",
  },
};

for (const lang of ["es", "en", "pt"]) {
  const buf = await buildPropuestaCliente(data, lang, owl);
  fs.writeFileSync(`/tmp/propuesta-${lang}.pptx`, buf);
  console.log("OK", lang, buf.length);
}
