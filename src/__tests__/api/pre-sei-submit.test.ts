/**
 * Tests for POST /api/public/pre-sei/submit.
 *
 * The submit endpoint is the public, unauthenticated entry point for the EQ Day
 * hook, so input validation is the security boundary: it must reject malformed
 * answers (not 8 keys, values outside 1-5), reject honeypot-filled bots, and on
 * a valid payload persist exactly one PreSeiSession and return the insight +
 * token. Prisma and the benchmark fetcher are mocked at the seam.
 */
// next/server depende de los globals Web Request/Response que jsdom/node no
// expone; lo stubeamos para que NextResponse.json sea testeable.
jest.mock("next/server", () => ({
  NextRequest: class {},
  NextResponse: {
    json: (body: any, init?: { status?: number }) => {
      const cookies: Record<string, unknown> = {};
      return {
        status: init?.status ?? 200,
        json: async () => body,
        cookies: { set: (k: string, v: unknown) => { cookies[k] = v; } },
      };
    },
  },
}));

import { prisma } from "@/core/prisma";
import { POST } from "@/app/api/public/pre-sei/submit/route";
import { SEI_ORDER } from "@/lib/pre-sei/questions";

jest.mock("@/core/prisma", () => ({
  prisma: { preSeiSession: { create: jest.fn() } },
}));

// Sin benchmark cargado → normativa degrada a bandas internas (no DB en el test).
jest.mock("@/lib/pre-sei/benchmark-source", () => ({
  buildPreSeiStatFetcher: jest.fn().mockResolvedValue({
    fetcher: () => ({ data: null, sampleSize: 0 }),
    hasBenchmark: false,
  }),
}));

const mockCreate = prisma.preSeiSession.create as jest.Mock;

/** Construye un NextRequest-like mínimo para el handler. */
function makeReq(body: unknown) {
  return {
    json: async () => body,
    headers: { get: (k: string) => (k === "x-forwarded-for" ? "203.0.113.7" : null) },
  } as any;
}

function answersAll(value: number) {
  return SEI_ORDER.reduce((acc, sei) => {
    acc[sei] = value;
    return acc;
  }, {} as Record<string, number>);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockCreate.mockResolvedValue({ id: "sess-1" });
});

describe("POST /api/public/pre-sei/submit", () => {
  it("rechaza body no-objeto con 400", async () => {
    const res = await POST(makeReq(null));
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rechaza honeypot lleno (bot) con 400", async () => {
    const res = await POST(makeReq({ answers: answersAll(3), website: "spam" }));
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rechaza respuestas con valores fuera de 1-5", async () => {
    const bad = { ...answersAll(3), [SEI_ORDER[0]]: 9 };
    const res = await POST(makeReq({ answers: bad }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rechaza falta de una competencia", async () => {
    const missing = answersAll(3);
    delete missing[SEI_ORDER[0]];
    const res = await POST(makeReq({ answers: missing }));
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("submit válido persiste sesión y devuelve insight + token", async () => {
    const res = await POST(makeReq({ answers: answersAll(4), lang: "en", country: "EC" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(typeof json.token).toBe("string");
    expect(json.insight.competencies.EL).toBe(115); // 4 → 115
    expect(json.insight.vsViews).toHaveLength(3);
    expect(json.insight.hasBenchmark).toBe(false);
    expect(json.insight.normative).toHaveLength(8);

    // Persistió una PreSeiSession con ipHash (no IP cruda) y source public.
    const data = mockCreate.mock.calls[0][0].data;
    expect(data.source).toBe("public");
    expect(data.locale).toBe("en");
    expect(data.country).toBe("EC");
    expect(data.ipHash).toBeTruthy();
    expect(data.ipHash).not.toContain("203.0.113.7"); // hasheada
  });
});
