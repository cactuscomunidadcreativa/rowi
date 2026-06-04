/**
 * Tests for the ECO bridge layer (the relational wrapper over compose).
 *
 * Pins the SIA semantics: the ECO level escalates with the dyad state
 * (general → profile → sei), the bridge instruction is derived from the
 * attunement gap (not a verdict), and the dyad lookup is scoped to the owner
 * (you can't compose over someone else's dyad). Prisma is mocked at the seam.
 */
import { ecoLevelForDyad, buildDyadBridge } from "@/domains/eco/lib/ecoBridge";
import { prisma } from "@/core/prisma";

jest.mock("@/core/prisma", () => ({
  prisma: {
    relationshipDyad: { findFirst: jest.fn() },
  },
}));

const mockFind = prisma.relationshipDyad.findFirst as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe("ecoLevelForDyad", () => {
  it("escala general → profile → sei según el estado", () => {
    expect(ecoLevelForDyad({ otherJoined: false, otherSeiDone: false })).toBe("general");
    expect(ecoLevelForDyad({ otherJoined: true, otherSeiDone: false })).toBe("profile");
    expect(ecoLevelForDyad({ otherJoined: true, otherSeiDone: true })).toBe("sei");
  });

  it("sei gana aunque otherJoined sea false (datos inconsistentes)", () => {
    expect(ecoLevelForDyad({ otherJoined: false, otherSeiDone: true })).toBe("sei");
  });
});

describe("buildDyadBridge", () => {
  it("devuelve null si la díada no es del usuario", async () => {
    mockFind.mockResolvedValue(null);
    expect(await buildDyadBridge("dyad-1", "user-1")).toBeNull();
    // El where exige ownerUserId → no se puede componer sobre díada ajena.
    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "dyad-1", ownerUserId: "user-1" } }),
    );
  });

  it("deriva la instrucción de puente desde la brecha de sintonía", async () => {
    mockFind.mockResolvedValue({
      id: "dyad-1",
      ownerUserId: "user-1",
      otherJoined: true,
      otherSeiDone: false,
      relationType: "partner",
      otherName: "Ana",
      lastGapSummary: { heat135: 20 }, // baja → searching
    });
    const bridge = await buildDyadBridge("dyad-1", "user-1");
    expect(bridge).not.toBeNull();
    expect(bridge!.level).toBe("profile");
    expect(bridge!.gap?.level).toBe("searching");
    expect(bridge!.bridgeInstruction).toMatch(/primer puente/i);
    expect(bridge!.relationType).toBe("partner");
  });

  it("sin lastGapSummary, da una instrucción de apertura neutra", async () => {
    mockFind.mockResolvedValue({
      id: "dyad-1",
      ownerUserId: "user-1",
      otherJoined: false,
      otherSeiDone: false,
      relationType: "friend",
      otherName: null,
      lastGapSummary: null,
    });
    const bridge = await buildDyadBridge("dyad-1", "user-1");
    expect(bridge!.level).toBe("general");
    expect(bridge!.gap).toBeNull();
    expect(bridge!.bridgeInstruction).toMatch(/abra la conversación|claro y cálido/i);
  });
});
