/**
 * Emotional Mirror — lógica compartida UI + cron de follow-up.
 * Superpoder = competencia más alta; punto ciego = la más baja.
 * Las frases viven en los locales (preSei.mirror.power/blind/action.{KEY}).
 */
export function mirrorPair(
  competencies: Record<string, number | null | undefined>,
): { power: string; blind: string } | null {
  const entries = Object.entries(competencies).filter(
    (e): e is [string, number] => typeof e[1] === "number",
  );
  if (entries.length < 2) return null;
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  return { power: sorted[0][0], blind: sorted[sorted.length - 1][0] };
}
