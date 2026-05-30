/**
 * Unit tests for the OVS / TVS CSV parser.
 *
 * Six Seconds exports a wide CSV (one row per respondent) with pre-computed
 * driver + outcome composites and raw/standardized item scores. The parser
 * validates required columns, coerces numbers, skips empty rows, and the
 * aggregate computes mean/SD with strength + cohesion bands. CSV parsers are
 * regression magnets, so this pins those behaviours. Pure functions, no mocks.
 */

import {
  parseOvsTvsCsv,
  aggregateOvsTvs,
  type OvsRespondent,
} from "@/lib/vital-signs/parsers/ovs";

const REQUIRED = [
  "QUESTION_1",
  "Motivation", "Teamwork", "Execution", "Change", "Trust",
  "Satisfaction", "Results", "Agility", "Sustainability", "Engagement",
];

describe("parseOvsTvsCsv", () => {
  it("reports every missing required column and returns no respondents", () => {
    const res = parseOvsTvsCsv("Foo,Bar\n1,2", "OVS");
    expect(res.respondents).toEqual([]);
    expect(res.sampleSize).toBe(0);
    for (const col of REQUIRED) {
      expect(res.errors).toContain(`Missing required column: ${col}`);
    }
  });

  it("parses a complete respondent row into the typed shape", () => {
    const header = [
      "Date", "Project Name", "Coach Name (Owner)",
      "QUESTION_1", "Item_ST_1", "OUTCOME_37", "Gender",
      ...REQUIRED.filter((c) => c !== "QUESTION_1"),
    ].join(",");
    const row = [
      "2026-01-01", "Acme", "Coach A",
      "5", "110", "90", "2",
      "100", "100", "100", "100", "100", // drivers (Motivation..Trust)
      "95", "95", "95", "95", "95",      // outcomes (Satisfaction..Engagement)
    ].join(",");

    const res = parseOvsTvsCsv(`${header}\n${row}`, "OVS");
    expect(res.errors).toEqual([]);
    expect(res.scope).toBe("OVS");
    expect(res.sampleSize).toBe(1);
    expect(res.projectName).toBe("Acme");
    expect(res.coachOwner).toBe("Coach A");

    const r = res.respondents[0];
    expect(r.date).toBe("2026-01-01");
    expect(r.drivers).toEqual({
      trust: 100, motivation: 100, teamwork: 100, execution: 100, change: 100,
    });
    expect(r.outcomes.satisfaction).toBe(95);
    expect(r.rawItems.q1).toBe(5);
    expect(r.itemScoresST.q1).toBe(110);
    expect(r.outcomesRaw.o37).toBe(90);
    expect(r.demographics.gender).toBe(2);
    // Columns absent from the header coerce to null, never NaN.
    expect(r.rawItems.q2).toBeNull();
    expect(r.demographics.ageGroup).toBeNull();
  });

  it("skips rows with no driver values and no first item", () => {
    const header = REQUIRED.join(",");
    const valid = "5,100,100,100,100,100,90,90,90,90,90";
    const blank = ",,,,,,,,,,"; // 11 empty fields
    const res = parseOvsTvsCsv([header, valid, blank].join("\n"), "TVS");
    expect(res.sampleSize).toBe(1);
    expect(res.scope).toBe("TVS");
  });
});

describe("aggregateOvsTvs", () => {
  function makeResp(
    drivers: Partial<OvsRespondent["drivers"]>,
    outcomes: Partial<OvsRespondent["outcomes"]> = {},
  ): OvsRespondent {
    return {
      rowIndex: 0,
      date: null,
      projectName: null,
      coachOwner: null,
      rawItems: {},
      itemScoresST: {},
      outcomesRaw: {},
      drivers: { trust: null, motivation: null, teamwork: null, execution: null, change: null, ...drivers },
      outcomes: { satisfaction: null, results: null, agility: null, sustainability: null, engagement: null, ...outcomes },
      demographics: { ageGroup: null, gender: null, positionType: null, businessUnit: null, jobFunction: null },
    };
  }

  it("returns five drivers and five outcomes with uppercase codes", () => {
    const agg = aggregateOvsTvs([makeResp({ trust: 100 })]);
    expect(agg.drivers.map((d) => d.code)).toEqual([
      "TRUST", "MOTIVATION", "TEAMWORK", "EXECUTION", "CHANGE",
    ]);
    expect(agg.outcomes.map((o) => o.code)).toEqual([
      "SATISFACTION", "RESULTS", "AGILITY", "SUSTAINABILITY", "ENGAGEMENT",
    ]);
  });

  it("computes mean, SD, n and the strength + cohesion bands", () => {
    const agg = aggregateOvsTvs([
      makeResp({ trust: 80 }),
      makeResp({ trust: 100 }),
    ]);
    const trust = agg.drivers.find((d) => d.code === "TRUST")!;
    expect(trust.mean).toBe(90);        // (80 + 100) / 2
    expect(trust.n).toBe(2);
    expect(trust.sd).toBeCloseTo(10);   // sqrt(((−10)²+10²)/2)
    expect(trust.strengthBand).toBe("mid");   // 90 is not < 90
    expect(trust.cohesionBand).toBe("high");  // sd 10 < 12
  });

  it("bands a low mean as bottom_quartile and a high mean as top_quartile", () => {
    const agg = aggregateOvsTvs([
      makeResp({ trust: 80, motivation: 120 }),
    ]);
    expect(agg.drivers.find((d) => d.code === "TRUST")!.strengthBand).toBe("bottom_quartile");
    expect(agg.drivers.find((d) => d.code === "MOTIVATION")!.strengthBand).toBe("top_quartile");
  });

  it("yields n=0 for an empty respondent set", () => {
    const agg = aggregateOvsTvs([]);
    for (const d of agg.drivers) {
      expect(d.n).toBe(0);
      expect(d.mean).toBe(0);
    }
  });
});
