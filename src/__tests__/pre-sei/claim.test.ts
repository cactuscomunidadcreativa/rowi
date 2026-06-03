/**
 * Unit tests for the Pre-SEI claim/materialization.
 *
 * The claim writes a Pre-SEI result into the existing normalized models —
 * EqSnapshot(dataset:"pre_sei") + 8 PulsePointSignal(source:"pre_sei") — instead
 * of a parallel table. Two guarantees are pinned: (1) a claim creates exactly one
 * snapshot (scores on the 70-130 scale) and 8 signals (raw 1-5), and (2) it is
 * idempotent — re-claiming the same session does not duplicate rows. Prisma is
 * mocked at the seam.
 */
import {
  materializePreSei,
  claimPreSeiSession,
  writePreSeiIntake,
} from "@/lib/pre-sei/claim";
import { prisma } from "@/core/prisma";
import { SEI_ORDER } from "@/lib/pre-sei/questions";
import type { PreSeiAnswers } from "@/lib/pre-sei/scoring";

jest.mock("@/core/prisma", () => ({
  prisma: {
    eqSnapshot: { findFirst: jest.fn(), create: jest.fn() },
    pulsePointSignal: { createMany: jest.fn() },
    preSeiSession: { findUnique: jest.fn(), update: jest.fn() },
  },
}));

const mockSnapFind = prisma.eqSnapshot.findFirst as jest.Mock;
const mockSnapCreate = prisma.eqSnapshot.create as jest.Mock;
const mockSignals = prisma.pulsePointSignal.createMany as jest.Mock;
const mockSessionFind = prisma.preSeiSession.findUnique as jest.Mock;
const mockSessionUpdate = prisma.preSeiSession.update as jest.Mock;

function answersAll(value: number): PreSeiAnswers {
  return SEI_ORDER.reduce((acc, sei) => {
    acc[sei] = value;
    return acc;
  }, {} as PreSeiAnswers);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSnapCreate.mockResolvedValue({ id: "snap-1" });
  mockSignals.mockResolvedValue({ count: 8 });
  mockSessionUpdate.mockResolvedValue({});
});

describe("materializePreSei", () => {
  it("crea un EqSnapshot(pre_sei) y 8 señales(pre_sei)", async () => {
    mockSnapFind.mockResolvedValue(null);
    const res = await materializePreSei("user-1", answersAll(4));

    expect(res).toEqual({ snapshotId: "snap-1", created: true });

    // Snapshot con dataset pre_sei y escala 70-130 (4 → 115).
    const snapArg = mockSnapCreate.mock.calls[0][0].data;
    expect(snapArg.dataset).toBe("pre_sei");
    expect(snapArg.userId).toBe("user-1");
    expect(snapArg.EL).toBe(115);
    expect(snapArg.K).toBe(115);

    // 8 señales, value crudo 1-5, source pre_sei.
    const signalArg = mockSignals.mock.calls[0][0].data;
    expect(signalArg).toHaveLength(8);
    for (const s of signalArg) {
      expect(s.source).toBe("pre_sei");
      expect(s.value).toBe(4);
      expect(s.userId).toBe("user-1");
    }
  });

  it("es idempotente: si ya existe snapshot pre_sei no recrea ni duplica señales", async () => {
    mockSnapFind.mockResolvedValue({ id: "snap-existing" });
    const res = await materializePreSei("user-1", answersAll(3), {
      preSeiSessionId: "sess-1",
    });

    expect(res).toEqual({ snapshotId: "snap-existing", created: false });
    expect(mockSnapCreate).not.toHaveBeenCalled();
    expect(mockSignals).not.toHaveBeenCalled();
  });
});

describe("claimPreSeiSession", () => {
  it("reclama una sesión anónima, materializa y marca claimedBy", async () => {
    mockSessionFind.mockResolvedValue({
      id: "sess-1",
      token: "tok-1",
      answers: answersAll(5),
      ageRange: "30-39",
      gender: "female",
      sector: "Education",
      country: "EC",
      claimedByUserId: null,
    });
    mockSnapFind.mockResolvedValue(null);

    const res = await claimPreSeiSession("tok-1", "user-1");
    expect(res.ok).toBe(true);
    expect(res.snapshotId).toBe("snap-1");

    // Demografía propagada al snapshot.
    const snapArg = mockSnapCreate.mock.calls[0][0].data;
    expect(snapArg.country).toBe("EC");
    expect(snapArg.sector).toBe("Education");
    expect(snapArg.context).toBe("sess-1");
    expect(snapArg.EL).toBe(130); // 5 → 130

    // Sesión marcada como reclamada.
    expect(mockSessionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "sess-1" },
        data: expect.objectContaining({ claimedByUserId: "user-1" }),
      }),
    );
  });

  it("token inexistente → ok:false", async () => {
    mockSessionFind.mockResolvedValue(null);
    const res = await claimPreSeiSession("nope", "user-1");
    expect(res.ok).toBe(false);
    expect(mockSnapCreate).not.toHaveBeenCalled();
  });

  it("sesión ya reclamada por otro usuario → ok:false (no roba)", async () => {
    mockSessionFind.mockResolvedValue({
      id: "sess-1",
      answers: answersAll(3),
      claimedByUserId: "other-user",
    });
    const res = await claimPreSeiSession("tok-1", "user-1");
    expect(res.ok).toBe(false);
    expect(mockSnapCreate).not.toHaveBeenCalled();
  });

  it("re-claim por el mismo usuario es idempotente (no duplica, no re-update)", async () => {
    mockSessionFind.mockResolvedValue({
      id: "sess-1",
      answers: answersAll(3),
      claimedByUserId: "user-1",
    });
    mockSnapFind.mockResolvedValue({ id: "snap-existing" }); // ya materializado
    const res = await claimPreSeiSession("tok-1", "user-1");
    expect(res.ok).toBe(true);
    expect(mockSnapCreate).not.toHaveBeenCalled();
    expect(mockSessionUpdate).not.toHaveBeenCalled(); // ya tenía claimedByUserId
  });
});

describe("writePreSeiIntake", () => {
  it("escribe directo para usuario logueado (sin sesión anónima)", async () => {
    mockSnapFind.mockResolvedValue(null);
    const res = await writePreSeiIntake("user-1", answersAll(2), { country: "MX" });
    expect(res.created).toBe(true);
    const snapArg = mockSnapCreate.mock.calls[0][0].data;
    expect(snapArg.country).toBe("MX");
    expect(snapArg.EL).toBe(85); // 2 → 85
    expect(snapArg.context).toBeNull();
  });
});
