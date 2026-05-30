/**
 * Unit tests for the Stripe subscription service — webhook business logic.
 *
 * This is the money path: a wrong branch here mis-grants seats, double-charges,
 * or leaves a paying tenant locked out. The tests pin the parts that carry real
 * billing consequences:
 *
 * - handleStripeWebhook dispatch: known types route to a handler; unknown
 *   types are a no-op success; a throwing handler is caught into
 *   { success: false } (so the route can still record the ledger).
 * - Seat sync on customer.subscription.updated: active/trialing grant
 *   `quantity` seats; any other status forces licenseCount to 0.
 * - checkout.session.completed guards on missing metadata (no user mutation).
 *
 * Stripe SDK, prisma, email, base-url, and logging are mocked at the seam.
 */

jest.mock("@/lib/stripe/client", () => ({
  getStripeClient: jest.fn(),
}));

jest.mock("@/core/prisma", () => ({
  prisma: {
    plan: { findUnique: jest.fn(), findFirst: jest.fn() },
    user: { update: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn() },
    payment: { create: jest.fn() },
    userAcquisition: { upsert: jest.fn() },
    coupon: { findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    couponRedemption: { findUnique: jest.fn(), create: jest.fn() },
    subscription: { upsert: jest.fn(), updateMany: jest.fn(), findFirst: jest.fn() },
    tenant: { update: jest.fn() },
  },
}));

jest.mock("@/lib/email/sendBillingNotification", () => ({
  sendBillingNotification: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/core/utils/base-url", () => ({
  getServerAppBaseUrl: jest.fn(() => "https://www.rowiia.com"),
}));

jest.mock("@/lib/logging", () => ({
  secureLog: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { handleStripeWebhook } from "@/lib/stripe/subscription-service";
import { prisma } from "@/core/prisma";

const planFindFirst = prisma.plan.findFirst as jest.Mock;
const planFindUnique = prisma.plan.findUnique as jest.Mock;
const userUpdate = prisma.user.update as jest.Mock;
const subUpsert = prisma.subscription.upsert as jest.Mock;
const tenantUpdate = prisma.tenant.update as jest.Mock;

/** Minimal Stripe.Subscription shape the handler reads. */
function makeSubscription(over: Record<string, any> = {}): any {
  return {
    id: "sub_1",
    status: "active",
    customer: "cus_1",
    cancel_at_period_end: false,
    canceled_at: null,
    trial_start: null,
    trial_end: null,
    metadata: { userId: "u1", ...(over.metadata ?? {}) },
    items: {
      data: [
        {
          quantity: 1,
          price: { id: "price_monthly" },
          current_period_start: 1_700_000_000,
          current_period_end: 1_702_000_000,
          ...(over.item ?? {}),
        },
      ],
    },
    ...over,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  planFindFirst.mockResolvedValue({ id: "plan_1" });
  planFindUnique.mockResolvedValue({ id: "plan_1", durationDays: 30 });
  userUpdate.mockResolvedValue({});
  subUpsert.mockResolvedValue({});
  tenantUpdate.mockResolvedValue({});
});

describe("handleStripeWebhook dispatch", () => {
  it("returns success for an unhandled event type without touching the DB", async () => {
    const res = await handleStripeWebhook({
      type: "radar.early_fraud_warning.created",
      data: { object: {} },
    } as any);
    expect(res.success).toBe(true);
    expect(res.message).toContain("radar.early_fraud_warning.created");
    expect(subUpsert).not.toHaveBeenCalled();
  });

  it("catches a handler exception and returns { success: false }", async () => {
    subUpsert.mockRejectedValueOnce(new Error("db exploded"));
    const res = await handleStripeWebhook({
      type: "customer.subscription.updated",
      data: { object: makeSubscription() },
    } as any);
    expect(res.success).toBe(false);
    expect(res.message).toBe("db exploded");
  });

  it("routes customer.subscription.created to the upsert handler", async () => {
    await handleStripeWebhook({
      type: "customer.subscription.created",
      data: { object: makeSubscription() },
    } as any);
    expect(subUpsert).toHaveBeenCalledTimes(1);
  });
});

describe("seat sync on customer.subscription.updated", () => {
  it("grants `quantity` seats to the tenant when active", async () => {
    await handleStripeWebhook({
      type: "customer.subscription.updated",
      data: {
        object: makeSubscription({
          status: "active",
          metadata: { userId: "u1", tenantId: "t1" },
          item: { quantity: 25, price: { id: "price_monthly" } },
        }),
      },
    } as any);

    expect(tenantUpdate).toHaveBeenCalledTimes(1);
    const arg = tenantUpdate.mock.calls[0][0];
    expect(arg.where).toEqual({ id: "t1" });
    expect(arg.data.licenseCount).toBe(25);
  });

  it("grants seats while trialing", async () => {
    await handleStripeWebhook({
      type: "customer.subscription.updated",
      data: {
        object: makeSubscription({
          status: "trialing",
          metadata: { userId: "u1", tenantId: "t1" },
          item: { quantity: 10, price: { id: "price_monthly" } },
        }),
      },
    } as any);
    expect(tenantUpdate.mock.calls[0][0].data.licenseCount).toBe(10);
  });

  it("forces licenseCount to 0 when the subscription is canceled", async () => {
    await handleStripeWebhook({
      type: "customer.subscription.updated",
      data: {
        object: makeSubscription({
          status: "canceled",
          metadata: { userId: "u1", tenantId: "t1" },
          item: { quantity: 25, price: { id: "price_monthly" } },
        }),
      },
    } as any);
    expect(tenantUpdate.mock.calls[0][0].data.licenseCount).toBe(0);
  });

  it("does not touch any tenant when the subscription has no tenantId (B2C)", async () => {
    await handleStripeWebhook({
      type: "customer.subscription.updated",
      data: { object: makeSubscription({ metadata: { userId: "u1" } }) },
    } as any);
    expect(tenantUpdate).not.toHaveBeenCalled();
  });

  it("is a no-op when the subscription metadata has no userId", async () => {
    await handleStripeWebhook({
      type: "customer.subscription.updated",
      data: { object: makeSubscription({ metadata: {} }) },
    } as any);
    expect(subUpsert).not.toHaveBeenCalled();
    expect(tenantUpdate).not.toHaveBeenCalled();
  });
});

describe("checkout.session.completed guards", () => {
  it("does nothing when userId/planId metadata is missing", async () => {
    const res = await handleStripeWebhook({
      type: "checkout.session.completed",
      data: { object: { metadata: {} } },
    } as any);
    expect(res.success).toBe(true);
    expect(userUpdate).not.toHaveBeenCalled();
  });
});
