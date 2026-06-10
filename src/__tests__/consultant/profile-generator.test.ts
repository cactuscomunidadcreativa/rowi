/**
 * El generador del perfil integral ensambla el mapa de puntos ciegos sin IA
 * (withNarrative:false → determinista, no llama al LLM). La narrativa se prueba
 * aparte / en integración; aquí validamos el ensamblaje estructural.
 */
import { generateIntegralProfile } from "@/lib/consultant/profile-generator";

const comp = { EL: 108, RP: 109, ACT: 124, NE: 98, IM: 114, OP: 107, EMP: 105, NG: 118 };
const talents = {
  criticalthinking: 115, vision: 113, prioritizing: 113, imagination: 97,
  collaboration: 99, emotionalinsight: 103, connection: 103, resilience: 104,
  proactivity: 102, designing: 108,
};
const pulses = {
  EXECUTION_ACCOUNTABILITY: 4.5, TEAMWORK_JOY: 4.5, TEAMWORK_CONNECTION: 4.33,
  CHANGE_CELEBRATION: 3.0, MOTIVATION_MEANING: 3.75,
};

describe("profile-generator — perfil integral (sin IA)", () => {
  it("ensambla el mapa de puntos ciegos y el resumen, sin narrativa", async () => {
    const profile = await generateIntegralProfile(
      {
        subjectLabel: "Carolina Navarro",
        scope: "individual",
        vsInstrument: "LVS",
        competencies: comp,
        talents,
        pulses,
      },
      { withNarrative: false },
    );

    expect(profile.subjectLabel).toBe("Carolina Navarro");
    expect(profile.scope).toBe("individual");
    expect(profile.vsInstrument).toBe("LVS");
    expect(profile.blindspotMap.length).toBe(Object.keys(pulses).length);
    expect(profile.diagnosis).toBeNull(); // withNarrative:false
    // El resumen es coherente con el mapa.
    const states = new Set(profile.blindspotMap.map((r) => r.state));
    expect([...states].every((s) =>
      ["alineado", "punto_ciego", "oculto", "neutral"].includes(s),
    )).toBe(true);
  });

  it("detecta al menos un punto ciego en el perfil de Carolina", async () => {
    const profile = await generateIntegralProfile(
      {
        subjectLabel: "Carolina",
        scope: "individual",
        vsInstrument: "LVS",
        competencies: comp,
        talents,
        pulses,
      },
      { withNarrative: false },
    );
    // Alegría/Conexión: se cree alta pero capacidad promedio (validado en blindspot-map).
    expect(profile.summary.blindspots.length).toBeGreaterThan(0);
  });
});
