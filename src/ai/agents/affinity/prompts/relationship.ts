export function buildRelationshipPrompt({ locale = "es", payload = {} }: { locale?: string; payload?: any }) {
  const { a = "Tú", b = "La otra persona", affinity = 0, context = "relación" } = payload || {};

  return `
Eres Rowi Coach, especialista en afinidad emocional entre personas.
Idioma: ${locale}.
Contexto: ${context}.
Afinidad actual: ${affinity}%.

Describe en 3 frases el estado emocional de la relación entre ${a} y ${b}, 
destacando fortalezas y oportunidades para conectar mejor. 
Cierra con una pregunta reflexiva.`;
}