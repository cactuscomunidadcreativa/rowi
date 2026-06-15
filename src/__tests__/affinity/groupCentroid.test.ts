/**
 * Tests de la brecha de GRUPO por centroide (src/domains/affinity/lib/groupCentroid).
 * Verifica: el centroide promedia perfiles; grupo homogéneo → alta sintonía;
 * un outlier queda más lejos del centro que los alineados.
 */
import { buildCentroid, personGapToCentroid, groupGapSummary, type AffinityProfile } from "@/domains/affinity/lib/groupCentroid";

function person(name: string, comp: number, brain: string | null = "Visionary"): AffinityProfile {
  return {
    name,
    comp: { EL: comp, RP: comp, ACT: comp, NE: comp, IM: comp, OP: comp, EMP: comp, NG: comp },
    tals: { vision: comp, imagination: comp },
    outs: [{ key: "influence", score: comp }, { key: "achievement", score: comp }],
    brain,
  };
}

describe("buildCentroid", () => {
  it("promedia las competencias de los perfiles", () => {
    const c = buildCentroid([person("A", 100), person("B", 120), person("C", 110)]);
    expect(c.comp.EL).toBe(110); // (100+120+110)/3
    expect(c.comp.NG).toBe(110);
  });

  it("usa la moda del brain style", () => {
    const c = buildCentroid([person("A", 100, "Sage"), person("B", 100, "Sage"), person("C", 100, "Visionary")]);
    expect(c.brain).toBe("Sage");
  });
});

describe("groupGapSummary", () => {
  it("devuelve null para menos de 2 personas", () => {
    expect(groupGapSummary([person("A", 100)])).toBeNull();
  });

  it("un grupo homogéneo tiene alta sintonía (heat alto)", () => {
    const homog = groupGapSummary([person("A", 110), person("B", 110), person("C", 110)], "relationship");
    expect(homog).not.toBeNull();
    expect(homog!.groupSize).toBe(3);
    expect(homog!.heat135).toBeGreaterThan(90);
  });

  it("el outlier queda más lejos del centro que los alineados", () => {
    const profiles = [person("A", 115), person("B", 115), person("C", 115), person("Outlier", 70)];
    const centroid = buildCentroid(profiles);
    const aligned = personGapToCentroid(profiles[0], centroid, "relationship");
    const outlier = personGapToCentroid(profiles[3], centroid, "relationship");
    expect(outlier).toBeLessThan(aligned);
  });

  it("incluye la brecha por persona", () => {
    const s = groupGapSummary([person("A", 100), person("B", 120)], "leadership");
    expect(s!.perPerson).toHaveLength(2);
    expect(s!.perPerson[0].name).toBe("A");
    expect(typeof s!.perPerson[0].heat135).toBe("number");
  });
});
