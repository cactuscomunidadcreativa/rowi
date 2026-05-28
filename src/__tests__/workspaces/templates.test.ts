import {
  isValidTemplate,
  WORKSPACE_TEMPLATE_KEYS,
  WORKSPACE_TEMPLATES,
} from "@/lib/workspace/templates";

describe("workspace templates — isValidTemplate", () => {
  it("returns true for every key in WORKSPACE_TEMPLATES", () => {
    expect(WORKSPACE_TEMPLATE_KEYS.length).toBeGreaterThan(0);
    for (const tpl of WORKSPACE_TEMPLATES) {
      expect(isValidTemplate(tpl.key)).toBe(true);
    }
  });

  it("returns false for arbitrary invalid strings", () => {
    expect(isValidTemplate("invalid")).toBe(false);
    expect(isValidTemplate("personal")).toBe(false); // not in canonical list
    expect(isValidTemplate("")).toBe(false);
    expect(isValidTemplate("COACHING")).toBe(false); // case-sensitive
  });

  it("returns false for null/undefined/non-string values", () => {
    expect(isValidTemplate(null)).toBe(false);
    expect(isValidTemplate(undefined)).toBe(false);
    expect(isValidTemplate(123)).toBe(false);
    expect(isValidTemplate({})).toBe(false);
    expect(isValidTemplate([])).toBe(false);
  });

  it("keeps WORKSPACE_TEMPLATE_KEYS in sync with WORKSPACE_TEMPLATES", () => {
    expect(WORKSPACE_TEMPLATE_KEYS).toEqual(WORKSPACE_TEMPLATES.map((t) => t.key));
  });
});
