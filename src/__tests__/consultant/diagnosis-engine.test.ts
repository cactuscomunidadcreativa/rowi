/**
 * Valida el motor de reglas con los números REALES del blueprint de Bancolombia:
 *   - TVS equipo: Cambio y Agilidad bajos; Exploración con DE 21.6 (dispersión alta)
 *   - SEI: Navega Emociones e IM bajo norma; Bienestar/Equilibrio bajos
 *   - Iceberg: clima alto + motor individual en reserva
 *   - Segmentación: equipo→cliente, individual→partner
 */
import {
  readLayer,
  readIceberg,
  segment,
  type Metric,
} from "@/lib/consultant/diagnosis-engine";

const teamTvs: Metric[] = [
  { key: "TRUST", label: "Confianza", mean: 104.2, sd: 8 },
  { key: "CHANGE", label: "Cambio", mean: 92.0, sd: 10 },
  { key: "EXECUTION", label: "Ejecución", mean: 101.0, sd: 9 },
  { key: "AGILITY", label: "Agilidad", mean: 94.0, sd: 11 },
  { key: "EXPLORATION", label: "Exploración", mean: 99.0, sd: 21.6 }, // DE alta
];

const indivSei: Metric[] = [
  { key: "EL", label: "Alfabetización Emocional", mean: 105, sd: 9, n: 13 },
  { key: "NE", label: "Navegar Emociones", mean: 88, sd: 10, n: 13 }, // bajo + bienestar
  { key: "IM", label: "Motivación Intrínseca", mean: 93, sd: 8, n: 13 }, // bajo
  { key: "balance", label: "Equilibrio", mean: 90, sd: 12, n: 13 }, // bienestar bajo
];

describe("diagnosis-engine — números reales de Bancolombia", () => {
  const teamInsights = readLayer(teamTvs, "team");
  const indivInsights = readLayer(indivSei, "individual");

  it("marca Cambio y Agilidad como brechas de equipo (cliente)", () => {
    const gaps = teamInsights.filter((i) => i.kind === "gap").map((i) => i.metricKey);
    expect(gaps).toContain("CHANGE");
    expect(gaps).toContain("AGILITY");
    expect(teamInsights.find((i) => i.metricKey === "CHANGE")?.audience).toBe("client");
  });

  it("detecta la dispersión alta de Exploración (DE 21.6)", () => {
    const disp = teamInsights.find((i) => i.kind === "dispersion" && i.metricKey === "EXPLORATION");
    expect(disp).toBeDefined();
    expect(disp?.flags.highDispersion).toBe(true);
  });

  it("Navega Emociones y Equilibrio se marcan como BIENESTAR (cuidado humano)", () => {
    const ne = indivInsights.find((i) => i.metricKey === "NE");
    expect(ne?.kind).toBe("wellbeing");
    expect(ne?.flags.isWellbeing).toBe(true);
    const bal = indivInsights.find((i) => i.metricKey === "balance");
    expect(bal?.kind).toBe("wellbeing");
  });

  it("marca n pequeño (n=13 < 30) en los insights individuales", () => {
    expect(indivInsights.every((i) => i.flags.smallN)).toBe(true);
  });

  it("insights individuales son audiencia PARTNER y tocan SEI", () => {
    expect(indivInsights.every((i) => i.audience === "partner" && i.touchesSei)).toBe(true);
  });

  it("ICEBERG: clima alto promedio + motor individual en reserva", () => {
    const highClimate: Metric[] = [
      { key: "TRUST", label: "Confianza", mean: 106 },
      { key: "EXECUTION", label: "Ejecución", mean: 104 },
    ];
    const ice = readIceberg(highClimate, indivSei);
    expect(ice.length).toBe(1);
    expect(ice[0].kind).toBe("iceberg");
    expect(ice[0].audience).toBe("partner");
  });

  it("segment() separa cliente (agregado) de partner (individual/SEI)", () => {
    const all = [...teamInsights, ...indivInsights];
    const { client, partner } = segment(all);
    expect(client.every((i) => i.audience === "client" && !i.touchesSei)).toBe(true);
    expect(partner.every((i) => i.touchesSei || i.audience === "partner")).toBe(true);
    // ningún insight individual se filtra a la canasta de cliente
    expect(client.some((i) => i.layer === "individual")).toBe(false);
  });
});
