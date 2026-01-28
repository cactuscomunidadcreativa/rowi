export function buildCommunityPrompt({ locale = "es", payload = {} }: { locale?: string; payload?: any }) {
  const { summary = {}, project = "community", context = "trabajo" } = payload || {};
  const g = summary.global || { heat: 0, level: "Desafío" };
  const byGroup = summary.byGroup || [];
  const topGroup = byGroup.sort((a: any, b: any) => b.heat - a.heat)[0];

  return `
Eres Rowi Coach, analista de afinidad grupal.
Idioma: ${locale}.
Proyecto: ${project}.
Temperatura global: ${g.heat}% (${g.level}).
Grupo más destacado: ${topGroup?.name || "General"} (${topGroup?.heat || 0}%).

Genera una interpretación de máximo 4 frases, 
inspiradora y con sentido de propósito colectivo.
Enfócate en la colaboración, el bienestar emocional y el sentido de pertenencia.`;
}