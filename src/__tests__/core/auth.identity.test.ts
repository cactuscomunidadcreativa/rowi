/**
 * Tests for getAuthIdentity — the lightweight, zero-DB auth helper.
 *
 * It must read ONLY from the session (which is hydrated from the JWT) and
 * never hit Prisma. These tests pin: null when unauthenticated, and a clean
 * mapping of the identity fields when a session is present.
 */

jest.mock("@/core/prisma", () => ({ prisma: {} }));
jest.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: {} }));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));

import { getAuthIdentity } from "@/core/auth";
import { getServerSession } from "next-auth";

const mSession = getServerSession as jest.Mock;

beforeEach(() => jest.clearAllMocks());

it("returns null when there is no session", async () => {
  mSession.mockResolvedValue(null);
  expect(await getAuthIdentity()).toBeNull();
});

it("returns null when the session has no user id", async () => {
  mSession.mockResolvedValue({ user: { email: "x@y.com" } });
  expect(await getAuthIdentity()).toBeNull();
});

it("maps the identity fields from the session", async () => {
  mSession.mockResolvedValue({
    user: {
      id: "u1",
      email: "eduardo@x.com",
      name: "Eduardo",
      isSuperAdmin: true,
      primaryTenantId: "t1",
      organizationRole: "SUPERADMIN",
    },
  });

  expect(await getAuthIdentity()).toEqual({
    id: "u1",
    email: "eduardo@x.com",
    name: "Eduardo",
    isSuperAdmin: true,
    primaryTenantId: "t1",
    organizationRole: "SUPERADMIN",
  });
});

it("defaults isSuperAdmin to false and nullable fields to null", async () => {
  mSession.mockResolvedValue({ user: { id: "u2" } });
  expect(await getAuthIdentity()).toEqual({
    id: "u2",
    email: null,
    name: null,
    isSuperAdmin: false,
    primaryTenantId: null,
    organizationRole: null,
  });
});
