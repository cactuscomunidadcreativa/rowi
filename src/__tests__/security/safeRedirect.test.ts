/**
 * Tests de seguridad para safeInternalUrl (anti open-redirect).
 *
 * El checkout de Stripe honra successUrl/cancelUrl que envía el cliente, pero
 * SOLO si apuntan a rutas internas permitidas. Estos tests verifican que un
 * atacante no pueda desviar el flujo post-pago a un host externo.
 */
import { safeInternalUrl } from "@/lib/security/safeRedirect";

const BASE = "https://www.rowiia.com";
const ALLOW = ["/register/success", "/onboarding/success", "/settings/subscription"];

describe("safeInternalUrl", () => {
  it("acepta una ruta interna permitida (path relativo)", () => {
    expect(safeInternalUrl("/register/success", ALLOW, BASE, "/pricing")).toBe(
      `${BASE}/register/success`
    );
  });

  it("acepta una URL absoluta con host propio y toma solo el path", () => {
    expect(
      safeInternalUrl(`${BASE}/register/success`, ALLOW, BASE, "/pricing")
    ).toBe(`${BASE}/register/success`);
  });

  it("descarta el host externo de una URL absoluta y conserva solo el path permitido", () => {
    // Aunque el host es malicioso, el resultado siempre cuelga de BASE.
    expect(
      safeInternalUrl("https://evil.com/register/success", ALLOW, BASE, "/pricing")
    ).toBe(`${BASE}/register/success`);
  });

  it("rechaza una ruta NO permitida y cae al fallback", () => {
    expect(safeInternalUrl("/admin/secrets", ALLOW, BASE, "/pricing")).toBe(
      `${BASE}/pricing`
    );
  });

  it("rechaza un open-redirect a host externo (ruta no permitida)", () => {
    expect(
      safeInternalUrl("https://evil.com/phish", ALLOW, BASE, "/pricing")
    ).toBe(`${BASE}/pricing`);
  });

  it("acepta subrutas de una ruta permitida", () => {
    expect(
      safeInternalUrl("/settings/subscription/upgrade", ALLOW, BASE, "/pricing")
    ).toBe(`${BASE}/settings/subscription/upgrade`);
  });

  it("NO acepta una ruta que solo comparte prefijo de string (boundary)", () => {
    // "/registration" no debe colar por empezar con "/register"
    expect(
      safeInternalUrl("/register-evil", ["/register"], BASE, "/pricing")
    ).toBe(`${BASE}/pricing`);
  });

  it("ignora query string y hash al validar el path", () => {
    expect(
      safeInternalUrl("/register/success?foo=bar#x", ALLOW, BASE, "/pricing")
    ).toBe(`${BASE}/register/success`);
  });

  it("cae al fallback con input vacío, null o no-string", () => {
    expect(safeInternalUrl("", ALLOW, BASE, "/pricing")).toBe(`${BASE}/pricing`);
    expect(safeInternalUrl(null, ALLOW, BASE, "/pricing")).toBe(`${BASE}/pricing`);
    expect(safeInternalUrl(undefined, ALLOW, BASE, "/pricing")).toBe(`${BASE}/pricing`);
    expect(safeInternalUrl(123, ALLOW, BASE, "/pricing")).toBe(`${BASE}/pricing`);
  });

  it("cae al fallback con una URL malformada", () => {
    expect(safeInternalUrl("ht!tp://[bad", ALLOW, BASE, "/pricing")).toBe(
      `${BASE}/pricing`
    );
  });

  it("normaliza baseUrl con barra final", () => {
    expect(
      safeInternalUrl("/register/success", ALLOW, `${BASE}/`, "/pricing")
    ).toBe(`${BASE}/register/success`);
  });
});
