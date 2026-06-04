/**
 * Tests for the deterministic mini-SEI → CommunicationProfile draft mapper.
 *
 * This is the under-the-hood bridge of the SIA chain: the Rowi Test must seed an
 * editable communication-profile draft (i18n keys, never a score) deterministically
 * and without AI. We pin: high competencies add "how I communicate" phrases, low
 * ones add "how I prefer to be addressed" phrases, mid adds nothing, the tone maps
 * from the archetype quadrant, and output is i18n keys (not literal text).
 */
import { commProfileFromPreSei } from "@/domains/profile/lib/commProfileFromPreSei";
import { scorePreSei, type PreSeiAnswers } from "@/lib/pre-sei/scoring";
import { SEI_ORDER } from "@/lib/pre-sei/questions";

function answersAll(value: number): PreSeiAnswers {
  return SEI_ORDER.reduce((acc, sei) => {
    acc[sei] = value;
    return acc;
  }, {} as PreSeiAnswers);
}

describe("commProfileFromPreSei", () => {
  it("todo-3 (norma) → ninguna señal high/low, pero sí tono y arquetipo", () => {
    const draft = commProfileFromPreSei(scorePreSei(answersAll(3)));
    expect(draft.commSelf).toEqual([]); // mid no añade ruido
    expect(draft.commPref).toEqual([]);
    expect(draft.tone).toMatch(/^profile\.comm\.tone\./);
    expect(draft.archetype).toBeTruthy();
  });

  it("competencias altas añaden frases de 'cómo me comunico'", () => {
    const a = answersAll(5); // todas high → 130
    const draft = commProfileFromPreSei(scorePreSei(a));
    expect(draft.commSelf.length).toBeGreaterThan(0);
    // Todas las claves son i18n keys, no texto literal.
    for (const k of [...draft.commSelf, ...draft.commPref]) {
      expect(k).toMatch(/^profile\.comm\.(self|pref)\./);
    }
  });

  it("competencias bajas añaden frases de 'cómo prefiero que me hablen'", () => {
    const a = answersAll(1); // todas low → 70
    const draft = commProfileFromPreSei(scorePreSei(a));
    expect(draft.commPref.length).toBeGreaterThan(0);
  });

  it("EMP alta aporta tanto self como pref (regla con ambos)", () => {
    const a = answersAll(3);
    a.EMP = 5;
    const draft = commProfileFromPreSei(scorePreSei(a));
    expect(draft.commSelf).toContain("profile.comm.self.EMP.high");
    expect(draft.commPref).toContain("profile.comm.pref.EMP.high");
  });

  it("es determinista: mismas respuestas → mismo borrador", () => {
    const a = answersAll(4);
    expect(commProfileFromPreSei(scorePreSei(a))).toEqual(
      commProfileFromPreSei(scorePreSei(a)),
    );
  });

  it("activates sale de los top pulse points (claves de código)", () => {
    const draft = commProfileFromPreSei(scorePreSei(answersAll(4)));
    expect(draft.activates.length).toBeGreaterThan(0);
    expect(draft.activates.length).toBeLessThanOrEqual(2);
  });
});
