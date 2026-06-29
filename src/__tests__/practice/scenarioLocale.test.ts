/**
 * Unit tests for multi-locale scenario resolution (Track B · escenarios traducibles).
 *
 * Un ScenarioBank es una fila con N idiomas. El motor debe servir la versión del
 * idioma del usuario, con una cadena de fallback robusta (idioma pedido → base →
 * primera disponible → campos de la fila). Lógica pura, sin DB ni IA.
 */

import {
  resolveScenarioView,
  parseTranslations,
  withBaseTranslation,
} from "@/lib/practice/scenarioLocale";

const multi = {
  baseLocale: "es",
  locale: "es",
  title: "Cliente molesto",
  summary: "es summary",
  brief: "es brief",
  translations: {
    es: { title: "Cliente molesto", summary: "es summary", brief: "es brief" },
    en: { title: "Upset customer", summary: "en summary", brief: "en brief" },
    zh: { title: "不满的客户", summary: "zh summary", brief: "zh brief" },
  },
};

describe("resolveScenarioView", () => {
  it("serves the requested language when present", () => {
    const v = resolveScenarioView(multi, "en");
    expect(v.resolvedLocale).toBe("en");
    expect(v.title).toBe("Upset customer");
    expect(v.brief).toBe("en brief");
  });

  it("serves Chinese for a zh user", () => {
    expect(resolveScenarioView(multi, "zh").title).toBe("不满的客户");
  });

  it("falls back to base language when the requested one is missing", () => {
    const v = resolveScenarioView(multi, "pt"); // pt not translated
    expect(v.resolvedLocale).toBe("es");
    expect(v.title).toBe("Cliente molesto");
  });

  it("falls back to row fields when translations are empty (legacy row)", () => {
    const legacy = {
      baseLocale: "es",
      locale: "es",
      title: "Solo base",
      summary: "s",
      brief: "b",
      translations: null,
    };
    const v = resolveScenarioView(legacy, "en");
    expect(v.title).toBe("Solo base");
    expect(v.brief).toBe("b");
  });

  it("falls back to first available translation if base is absent", () => {
    const noBase = {
      baseLocale: "es",
      locale: "es",
      title: "x",
      summary: null,
      brief: "x",
      translations: { en: { title: "only en", summary: null, brief: "en brief" } },
    };
    const v = resolveScenarioView(noBase, "pt");
    expect(v.resolvedLocale).toBe("en");
    expect(v.title).toBe("only en");
  });
});

describe("parseTranslations", () => {
  it("drops malformed entries and keeps valid ones", () => {
    const t = parseTranslations({
      es: { title: "ok", brief: "ok" },
      en: { title: "no brief" }, // invalid (missing brief)
      xx: { title: "ignored locale", brief: "x" }, // not a known locale
    });
    expect(Object.keys(t)).toEqual(["es"]);
  });

  it("returns empty object on garbage", () => {
    expect(parseTranslations(null)).toEqual({});
    expect(parseTranslations("nope")).toEqual({});
  });
});

describe("withBaseTranslation", () => {
  it("injects the base language into an existing map", () => {
    const out = withBaseTranslation(
      "en",
      { title: "T", summary: null, brief: "B" },
      { es: { title: "es", summary: null, brief: "es" } },
    );
    expect(Object.keys(out).sort()).toEqual(["en", "es"]);
    expect(out.en?.title).toBe("T");
  });
});
