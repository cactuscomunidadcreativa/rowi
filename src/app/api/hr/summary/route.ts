import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/core/prisma";
import { requireAuth } from "@/core/auth/requireAdmin";
import {
  ACTIVE_CONTEXT_COOKIE,
  resolveContextTenantId,
} from "@/lib/account/contexts";

export const preferredRegion = "iad1";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const userId = auth.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { primaryTenantId: true },
    });
    let tenantId = user?.primaryTenantId;

    // Active-context cookie can narrow to a different tenant if the
    // user picked one in the NavBar switcher. Falls back to primary
    // tenant if the cookie doesn't resolve or isn't set.
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get(ACTIVE_CONTEXT_COOKIE)?.value;
    let activeContextFilter: { tenantId: string } | null = null;
    if (cookieValue) {
      const resolved = await resolveContextTenantId(cookieValue);
      if (resolved) {
        tenantId = resolved;
        activeContextFilter = { tenantId: resolved };
      }
    }

    const tenantFilter = tenantId ? { tenantId } : {};
    const employeeTenantFilter = tenantId
      ? { employee: { tenantId } }
      : {};

    const fourteenDaysAhead = new Date();
    fourteenDaysAhead.setDate(fourteenDaysAhead.getDate() + 14);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      employeesTotal,
      employeesActive,
      pendingLeaves,
      reviewsOpen,
      reviewsDueSoon,
      timeEntriesWeek,
      productivityWeek,
      hrWorkspaces,
    ] = await Promise.all([
      prisma.employeeProfile.count({ where: tenantFilter }),
      prisma.employeeProfile.count({
        where: { ...tenantFilter, status: "ACTIVE" },
      }),
      prisma.leaveRequest.count({
        where: { status: "PENDING", ...employeeTenantFilter },
      }),
      prisma.performanceReview.count({
        where: {
          status: "open",
          ...employeeTenantFilter,
        },
      }),
      prisma.performanceReview.count({
        where: {
          status: "open",
          periodEnd: { lte: fourteenDaysAhead },
          ...employeeTenantFilter,
        },
      }),
      prisma.timeEntry.aggregate({
        _sum: { minutes: true },
        where: {
          startedAt: { gte: sevenDaysAgo },
          ...employeeTenantFilter,
        },
      }),
      prisma.productivityLog.aggregate({
        _avg: { productivityIndex: true, focusLevel: true },
        where: {
          date: { gte: sevenDaysAgo },
          ...employeeTenantFilter,
        },
      }),
      prisma.rowiCommunity.findMany({
        where: { workspaceType: "HR_COHORT", ...tenantFilter },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          _count: { select: { communityMembers: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 6,
      }),
    ]);

    const hoursThisWeek =
      Math.round(((timeEntriesWeek._sum.minutes || 0) / 60) * 10) / 10;

    return NextResponse.json({
      ok: true,
      activeContextFilter,
      summary: {
        employees: { total: employeesTotal, active: employeesActive },
        leaves: { pending: pendingLeaves },
        reviews: { open: reviewsOpen, dueSoon: reviewsDueSoon },
        time: { hoursThisWeek },
        productivity: {
          avgIndex: productivityWeek._avg.productivityIndex
            ? Number(productivityWeek._avg.productivityIndex.toFixed(2))
            : null,
          avgFocus: productivityWeek._avg.focusLevel
            ? Number(productivityWeek._avg.focusLevel.toFixed(2))
            : null,
        },
        hrWorkspaces,
      },
    });
  } catch (e) {
    console.error("[api/hr/summary] error:", e);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 },
    );
  }
}
