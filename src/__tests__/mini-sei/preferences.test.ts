/**
 * Tests for the mini-SEI preferences layer (estilo declarado → lo que ECO/
 * Afinidad consumen). Cubre: resolución posicional 1-5, balanceado (=3) no
 * emite sesgo, polos izq/der mapean a las claves correctas, e intensidad.
 */

import {
  resolvePreferences,
  declaredCommStyle,
  PREF_AXES,
} from "@/lib/mini-sei/preferences";

describe("resolvePreferences", () => {
  it("mapea respuestas posicionales 1-5 a los ejes en orden", () => {
    const prefs = resolvePreferences({ "0": 1, "1": 5, "2": 3, "3": 4 });
    expect(prefs.processing).toBe(1);
    expect(prefs.change).toBe(5);
    expect(prefs.horizon).toBe(3);
    expect(prefs.channel).toBe(4);
  });

  it("ignora valores fuera de 1-5 y posiciones faltantes (quedan null)", () => {
    const prefs = resolvePreferences({ "0": 7, "2": 2 });
    expect(prefs.processing).toBeNull(); // 7 inválido
    expect(prefs.change).toBeNull(); // ausente
    expect(prefs.horizon).toBe(2);
  });

  it("hay exactamente 4 ejes y el orden es estable", () => {
    expect(PREF_AXES.map((a) => a.axis)).toEqual([
      "processing",
      "change",
      "horizon",
      "channel",
    ]);
  });
});

describe("declaredCommStyle", () => {
  it("balanceado (=3) NO emite sesgo (sin ruido)", () => {
    const style = declaredCommStyle({
      processing: 3,
      change: 3,
      horizon: 3,
      channel: 3,
    });
    expect(style.prefersKey).toBeNull();
    expect(style.toneKey).toBeNull();
    expect(style.dataStyleKey).toBeNull();
    expect(style.channels).toEqual([]);
    expect(style.intensity.processing).toBe(0);
  });

  it("polo izquierdo → analítico / abierto / corto / síncrono", () => {
    const style = declaredCommStyle({
      processing: 1,
      change: 1,
      horizon: 1,
      channel: 1,
    });
    expect(style.prefersKey).toBe("miniSei.pref.derived.prefers.analytic");
    expect(style.toneKey).toBe("miniSei.pref.derived.tone.open");
    expect(style.dataStyleKey).toBe("miniSei.pref.derived.data.short");
    expect(style.channels[0]).toBe("call"); // síncrono primero
    expect(style.intensity.processing).toBe(1); // extremo
  });

  it("polo derecho → emocional / cauto / largo / asíncrono", () => {
    const style = declaredCommStyle({
      processing: 5,
      change: 5,
      horizon: 5,
      channel: 5,
    });
    expect(style.prefersKey).toBe("miniSei.pref.derived.prefers.emotional");
    expect(style.toneKey).toBe("miniSei.pref.derived.tone.cautious");
    expect(style.dataStyleKey).toBe("miniSei.pref.derived.data.long");
    expect(style.channels[0]).toBe("email"); // asíncrono primero
  });

  it("intensidad refleja distancia al centro (|v-3|/2)", () => {
    const style = declaredCommStyle({
      processing: 4, // |4-3|/2 = 0.5
      change: 1, // extremo = 1
      horizon: null,
      channel: 3, // centro = 0
    });
    expect(style.intensity.processing).toBe(0.5);
    expect(style.intensity.change).toBe(1);
    expect(style.intensity.horizon).toBe(0);
    expect(style.intensity.channel).toBe(0);
  });
});
