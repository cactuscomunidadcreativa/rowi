// src/ai/prompts/modules/eq-dashboard.ts
type Payload = {
  locale?: "es" | "en" | "pt";
  currentAvg?: number;          // promedio actual (0–100 o escala usada)
  trend?: "up" | "flat" | "down";
  focusKeys?: string[];         // p.ej: ["EMP","RP"]
};

export function buildMessagesEQDashboard(p: Payload = {}) {
  const locale = p.locale ?? "es";
  const avg = p.currentAvg ?? 0;
  const trend = p.trend ?? "flat";
  const keys = p.focusKeys?.join(", ") || "—";

  const system =
    locale === "es"
      ? "Eres Rowi, un analista de dashboard EQ. Hablas claro, breve y con foco en acciones."
      : locale === "en"
      ? "You are Rowi, an EQ dashboard analyst. Be clear, brief, and action-focused."
      : "Você é Rowi, analista de painel de IE. Seja claro, breve e focado em ação.";

  const user =
    locale === "es"
      ? `Promedio actual: ${avg}. Tendencia: ${trend}. Claves de foco: ${keys}.
Devuelve:
- 1–2 insights (máx 2 líneas cada uno).
- 2 micro-acciones concretas (viñetas).`
      : locale === "en"
      ? `Current average: ${avg}. Trend: ${trend}. Focus keys: ${keys}.
Return:
- 1–2 insights (max 2 lines each).
- 2 concrete micro-actions (bullets).`
      : `Média atual: ${avg}. Tendência: ${trend}. Focos: ${keys}.
Entregue:
- 1–2 insights (máx 2 linhas cada).
- 2 micro-ações concretas (bullets).`;

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];
}