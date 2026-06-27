/**
 * Unit tests for the AI Practice Partner pure logic (Track B).
 *
 * Covers the pieces that have no DB/AI dependency: the PLUGGABLE model resolver
 * (the owner's "any AI" requirement — AgentConfig wins, then region/env, then a
 * safe Claude default), the rubric parser (tolerant to arbitrary DB JSON), and
 * the multi-turn prompt builders. The DB-touching route is exercised in the
 * browser E2E.
 */

// practiceEngine importa prisma en la cabecera; lo mockeamos al seam para que
// los builders puros sean testeables sin DB.
jest.mock("@/core/prisma", () => ({ prisma: {} }));

import {
  resolvePracticeModel,
  regionFromLocale,
} from "@/lib/practice/practiceModel";
import { parseRubric } from "@/lib/practice/practiceRubric";
import {
  buildPartnerSystemPrompt,
  buildTurnPrompt,
} from "@/lib/practice/practiceEngine";

describe("resolvePracticeModel — pluggable engine", () => {
  const ENV = process.env;
  beforeEach(() => {
    process.env = { ...ENV };
    delete process.env.PRACTICE_MODEL;
    delete process.env.PRACTICE_PROVIDER;
    delete process.env.PRACTICE_MODEL_CN;
    delete process.env.PRACTICE_PROVIDER_CN;
  });
  afterAll(() => {
    process.env = ENV;
  });

  it("defaults to Anthropic Claude when nothing is configured", () => {
    const c = resolvePracticeModel(null, "global");
    expect(c.provider).toBe("anthropic");
    expect(c.model).toContain("claude");
  });

  it("lets the AgentConfig win when it declares provider+model", () => {
    const c = resolvePracticeModel({ provider: "openai", model: "gpt-4o" }, "global");
    expect(c).toEqual({ provider: "openai", model: "gpt-4o" });
  });

  it("ignores a partial AgentConfig (provider without model)", () => {
    const c = resolvePracticeModel({ provider: "openai", model: null }, "global");
    expect(c.provider).toBe("anthropic"); // falls through to default
  });

  it("applies the China override only in the cn region", () => {
    process.env.PRACTICE_MODEL_CN = "qwen-max";
    process.env.PRACTICE_PROVIDER_CN = "openai";
    expect(resolvePracticeModel(null, "cn")).toEqual({
      provider: "openai",
      model: "qwen-max",
    });
    // global region must NOT pick up the cn override
    expect(resolvePracticeModel(null, "global").model).toContain("claude");
  });

  it("honors a global env override without code changes", () => {
    process.env.PRACTICE_MODEL = "some-future-model";
    const c = resolvePracticeModel(null, "global");
    expect(c.model).toBe("some-future-model");
    expect(c.provider).toBe("anthropic"); // default provider when unspecified
  });

  it("maps zh locale → cn region", () => {
    expect(regionFromLocale("zh")).toBe("cn");
    expect(regionFromLocale("es")).toBe("global");
    expect(regionFromLocale(null)).toBe("global");
  });
});

describe("parseRubric — tolerant to arbitrary DB JSON", () => {
  it("falls back to a default rubric when input is empty/garbage", () => {
    expect(parseRubric(null).criteria.length).toBeGreaterThan(0);
    expect(parseRubric({}).criteria.length).toBeGreaterThan(0);
    expect(parseRubric({ criteria: [] }).criteria.length).toBeGreaterThan(0);
    expect(parseRubric("not an object").criteria.length).toBeGreaterThan(0);
  });

  it("keeps valid criteria and defaults weight/label", () => {
    const r = parseRubric({ criteria: [{ key: "empathy" }, { key: "x", label: "X", weight: 3 }] });
    expect(r.criteria).toHaveLength(2);
    expect(r.criteria[0]).toEqual({ key: "empathy", label: "empathy", weight: 1 });
    expect(r.criteria[1]).toEqual({ key: "x", label: "X", weight: 3 });
  });
});

describe("prompt builders", () => {
  it("system prompt embeds scenario, locale instruction and SEI focus", () => {
    const sys = buildPartnerSystemPrompt(
      { title: "Cliente molesto", brief: "Eres un cliente...", locale: "zh", focusSei: "EMP" },
      "EMP",
    );
    expect(sys).toContain("Cliente molesto");
    expect(sys).toContain("Eres un cliente...");
    expect(sys).toContain("中文"); // responds in Chinese
    expect(sys).toContain("EMP");
  });

  it("prepends the culture prefix when provided", () => {
    const sys = buildPartnerSystemPrompt(
      { title: "T", brief: "B", locale: "es", focusSei: "EL" },
      "EL",
      "## Cultura de la organización\nMisión: X",
    );
    expect(sys.indexOf("Cultura de la organización")).toBeLessThan(sys.indexOf("# Escenario"));
  });

  it("serializes the multi-turn history into a dialogue prompt", () => {
    const prompt = buildTurnPrompt(
      [
        { role: "PARTNER", content: "Hola, llego tarde mi pedido." },
        { role: "USER", content: "Entiendo tu molestia." },
      ],
      "¿Cómo lo resolvemos?",
    );
    expect(prompt).toContain("Tú: Hola");
    expect(prompt).toContain("Persona: Entiendo tu molestia.");
    expect(prompt.trim().endsWith("Tú:")).toBe(true);
  });
});
