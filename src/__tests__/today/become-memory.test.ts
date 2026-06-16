/**
 * Tests del cierre Today → Becoming → Today (src/lib/today/become).
 * Verifica que la MEMORIA reciente del loop influye en el foco propuesto:
 *  - práctica NO hecha de un foco reciente → el sistema PERSISTE en ese foco
 *  - práctica hecha → suelta el foco y deja decidir al perfil EQ
 *  - sin historia o señales inválidas → cae al foco base (determinista)
 */
import {
  pickFocusSei,
  pickFocusWithMemory,
  proposeBecomingFromProfileAndMemory,
  type RecentLoopSignal,
} from "@/lib/today/become";

describe("pickFocusWithMemory", () => {
  it("sin historia: devuelve el foco base intacto", () => {
    expect(pickFocusWithMemory("EL", [])).toBe("EL");
    expect(pickFocusWithMemory("EL", null)).toBe("EL");
  });

  it("práctica NO hecha de un foco reciente: persiste en ese foco", () => {
    const recent: RecentLoopSignal[] = [
      { becomeSei: "NE", practiceDone: false },
      { becomeSei: "EL", practiceDone: true },
    ];
    // El día más reciente (NE) no se completó → la oportunidad sigue abierta.
    expect(pickFocusWithMemory("OP", recent)).toBe("NE");
  });

  it("práctica hecha en el día más reciente: suelta el foco (vuelve al base)", () => {
    const recent: RecentLoopSignal[] = [
      { becomeSei: "NE", practiceDone: true },
      { becomeSei: "RP", practiceDone: false },
    ];
    // Ya trabajó NE (práctica hecha) → no insiste; deja al perfil decidir.
    expect(pickFocusWithMemory("OP", recent)).toBe("OP");
  });

  it("ignora señales con SEI inválida o nula y sigue buscando", () => {
    const recent: RecentLoopSignal[] = [
      { becomeSei: null, practiceDone: false },
      { becomeSei: "ZZ", practiceDone: false },
      { becomeSei: "ACT", practiceDone: false },
    ];
    expect(pickFocusWithMemory("EL", recent)).toBe("ACT");
  });
});

describe("proposeBecomingFromProfileAndMemory", () => {
  const lang = "es" as const;
  // Perfil con ACT como la competencia más baja (foco base = ACT).
  const profile = { EL: 110, RP: 100, ACT: 80, NE: 120, IM: 105, OP: 115, EMP: 108, NG: 112 };

  it("sin memoria: propone el foco base del perfil (score más bajo)", () => {
    const base = pickFocusSei(profile);
    const out = proposeBecomingFromProfileAndMemory(profile, [], lang);
    expect(out.sei).toBe(base);
    expect(out.identity.length).toBeGreaterThan(0);
    expect(out.practice.length).toBeGreaterThan(0);
  });

  it("memoria con práctica abierta domina sobre el perfil", () => {
    const recent: RecentLoopSignal[] = [{ becomeSei: "EMP", practiceDone: false }];
    const out = proposeBecomingFromProfileAndMemory(profile, recent, lang);
    expect(out.sei).toBe("EMP");
  });
});
