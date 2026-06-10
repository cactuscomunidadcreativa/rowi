/**
 * Valida el modelo de capabilities de dos ejes (rol/scope + suscripción).
 */
import { resolveCapabilities } from "@/core/capabilities/resolve";

describe("resolveCapabilities — dos ejes (scope + plan)", () => {
  it("SuperAdmin (rowiverse) ve TODO, sin depender de suscripción", () => {
    const caps = resolveCapabilities("rowiverse", {}); // sin flags de plan
    expect(caps.has("platform.agents")).toBe(true);
    expect(caps.has("platform.knowledge")).toBe(true);
    expect(caps.has("consultant.profile")).toBe(true);
    expect(caps.has("tp.roi")).toBe(true);
    expect(caps.has("hr.employees")).toBe(true);
  });

  it("tenant SIN benchmarkAccess NO ve módulos de consultor ni TP de pago", () => {
    const caps = resolveCapabilities("tenant", { benchmarkAccess: false });
    expect(caps.has("consultant.profile")).toBe(false); // gated por benchmarkAccess
    expect(caps.has("tp.people")).toBe(false);
    expect(caps.has("tp.roi")).toBe(false);
    // Lo que NO requiere plan sí lo ve (rol tenant).
    expect(caps.has("hr.employees")).toBe(true);
    expect(caps.has("hr.reviews")).toBe(true);
  });

  it("tenant CON benchmarkAccess desbloquea consultor + TP", () => {
    const caps = resolveCapabilities("tenant", { benchmarkAccess: true });
    expect(caps.has("consultant.profile")).toBe(true);
    expect(caps.has("tp.people")).toBe(true);
    expect(caps.has("tp.roi")).toBe(true);
  });

  it("tenant NUNCA ve capabilities de plataforma (son solo rowiverse)", () => {
    const caps = resolveCapabilities("tenant", { benchmarkAccess: true });
    expect(caps.has("platform.agents")).toBe(false);
    expect(caps.has("platform.knowledge")).toBe(false);
    expect(caps.has("platform.tenants")).toBe(false);
  });

  it("hub (team-lead) ve TP de equipo pero NO roi (solo tenant/HR) ni hr.*", () => {
    const caps = resolveCapabilities("hub", { benchmarkAccess: true });
    expect(caps.has("tp.people")).toBe(true);
    expect(caps.has("tp.teams")).toBe(true);
    expect(caps.has("tp.roi")).toBe(false); // roi es scope tenant, no hub
    expect(caps.has("hr.employees")).toBe(false); // hr.* es scope tenant
  });

  it("tp.eco depende de rowiECOAccess, no de benchmarkAccess", () => {
    const onlyBenchmark = resolveCapabilities("tenant", { benchmarkAccess: true });
    expect(onlyBenchmark.has("tp.eco")).toBe(false); // falta rowiECOAccess
    const withEco = resolveCapabilities("tenant", { benchmarkAccess: true, rowiECOAccess: true });
    expect(withEco.has("tp.eco")).toBe(true);
  });
});
