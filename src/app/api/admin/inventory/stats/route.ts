import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";
import { resolveScopeTenantIds } from "@/core/admin/scopedList";

export const preferredRegion = "iad1";

type DomainCount = {
  key: string;
  count: number;
  href: string;
};

type Domain = {
  key: string;
  entities: DomainCount[];
};

export async function GET() {
  const auth = await requireAdminWithScope();
  if (auth.error) return auth.error;

  try {
    const isGlobal = auth.scope.type === "rowiverse";

    // Resolve which tenants this caller can see.
    const tenantIds = isGlobal ? null : await resolveScopeTenantIds(auth.scope);
    if (!isGlobal && (!tenantIds || tenantIds.length === 0)) {
      return NextResponse.json({
        ok: true,
        scope: { type: auth.scope.type, id: auth.scope.id },
        totalRecords: 0,
        domains: [],
      });
    }

    // Build reusable where fragments.
    const tw = isGlobal ? undefined : { tenantId: { in: tenantIds! } };
    const memberTW = isGlobal ? undefined : { member: { tenantId: { in: tenantIds! } } };
    const communityTW = isGlobal ? undefined : { community: { tenantId: { in: tenantIds! } } };
    const employeeTW = isGlobal ? undefined : { employee: { tenantId: { in: tenantIds! } } };
    const userPrimaryTW = isGlobal ? undefined : { user: { primaryTenantId: { in: tenantIds! } } };

    const cnt = (
      model: { count: (args?: object) => Promise<number> },
      where?: unknown,
    ): Promise<number> =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (model as any).count(where ? { where } : undefined);

    const [
      users,
      tenants,
      hubs,
      superhubs,
      organizations,
      plans,
      invites,
      permissions,
      communities,
      communityMembers,
      communityPosts,
      communityBatches,
      messageThreads,
      messages,
      relations,
      feeds,
      feedComments,
      feedReactions,
      nobleGoals,
      eqSnapshots,
      eqProgress,
      eqMood,
      seiRequests,
      sixSecondsImports,
      seiLinks,
      benchmarks,
      benchmarkDataPoints,
      benchmarkUploadJobs,
      agentConfigs,
      rowiChats,
      agentContexts,
      rowiChatFeedback,
      weekflowSessions,
      weekflowContributions,
      weekflowMood,
      weekflowComments,
      rowiTasks,
      taskReflections,
      courses,
      lessons,
      enrollments,
      quizzes,
      quizAttempts,
      certificates,
      microLearning,
      userMicroLearning,
      studyGroups,
      knowledgeResources,
      caseStudies,
      learningNotes,
      achievements,
      userAchievements,
      userStreaks,
      userLevels,
      userPoints,
      rewards,
      userRewards,
      coachNotes,
      developmentPlans,
      assessmentCampaigns,
      workspaceAlerts,
      clientAccesses,
      subscriptions,
      payments,
      coupons,
      couponRedemptions,
      salesMetrics,
      invoices,
      transactions,
      purchaseOrders,
      salesOrders,
      payouts,
      payrollRuns,
      products,
      employees,
      reviews,
      leaves,
      timeEntries,
      productivityLogs,
      emotionalEvents,
      emotionalROIs,
      rowiVerses,
      rowiVerseUsers,
      rowiVerseContributions,
      pages,
      layouts,
      components,
      translations,
      landingSections,
      cmsContent,
      notificationQueue,
      notificationLogs,
      pushSubscriptions,
      integrationConnections,
      externalConnections,
      webhooks,
      affinityProfiles,
      affinitySnapshots,
      affinityInteractions,
      tokenUsage,
    ] = await Promise.all([
      // Structure
      cnt(prisma.user, isGlobal ? undefined : { primaryTenantId: { in: tenantIds! } }),
      cnt(prisma.tenant, isGlobal ? undefined : { id: { in: tenantIds! } }),
      cnt(prisma.hub, tw),
      cnt(prisma.superHub, isGlobal ? undefined : { tenants: { some: { id: { in: tenantIds! } } } }),
      cnt(prisma.organization, isGlobal ? undefined : { tenantLinks: { some: { tenantId: { in: tenantIds! } } } }),
      cnt(prisma.plan, undefined),
      cnt(prisma.inviteToken, tw),
      cnt(prisma.userPermission, isGlobal ? undefined : { scopeType: "tenant", scopeId: { in: tenantIds! } }),

      // Community
      cnt(prisma.rowiCommunity, tw),
      cnt(prisma.communityMember, tw),
      cnt(prisma.rowiCommunityPost, communityTW),
      cnt(prisma.communityBatch, communityTW),

      // Social
      cnt(prisma.messageThread, undefined),
      cnt(prisma.message, undefined),
      cnt(prisma.rowiRelation, undefined),
      cnt(prisma.rowiFeed, isGlobal ? undefined : { tenantId: { in: tenantIds! } }),
      cnt(prisma.feedComment, undefined),
      cnt(prisma.feedReaction, undefined),
      cnt(prisma.nobleGoal, undefined),

      // EQ
      cnt(prisma.eqSnapshot, memberTW),
      cnt(prisma.eqProgress, memberTW),
      cnt(prisma.eqMoodSnapshot, memberTW),
      cnt(prisma.seiRequest, undefined),
      cnt(prisma.sixSecondsImport, undefined),
      cnt(prisma.seiLink, undefined),

      // Benchmarks
      cnt(prisma.benchmark, tw),
      cnt(prisma.benchmarkDataPoint, tw),
      cnt(prisma.benchmarkUploadJob, undefined),

      // AI
      cnt(prisma.agentConfig, tw),
      cnt(prisma.rowiChat, isGlobal ? undefined : userPrimaryTW),
      cnt(prisma.agentContext, undefined),
      cnt(prisma.rowiChatFeedback, undefined),

      // WeekFlow
      cnt(prisma.weekFlowSession, undefined),
      cnt(prisma.weekFlowContribution, undefined),
      cnt(prisma.weekFlowMoodCheckin, undefined),
      cnt(prisma.weekFlowComment, undefined),
      cnt(prisma.rowiTask, undefined),
      cnt(prisma.taskReflection, undefined),

      // Education
      cnt(prisma.course, undefined),
      cnt(prisma.lesson, undefined),
      cnt(prisma.enrollment, isGlobal ? undefined : userPrimaryTW),
      cnt(prisma.quiz, undefined),
      cnt(prisma.quizAttempt, isGlobal ? undefined : userPrimaryTW),
      cnt(prisma.certificate, isGlobal ? undefined : userPrimaryTW),
      cnt(prisma.microLearning, undefined),
      cnt(prisma.userMicroLearning, isGlobal ? undefined : userPrimaryTW),
      cnt(prisma.studyGroup, undefined),

      // Knowledge
      cnt(prisma.knowledgeResource, undefined),
      cnt(prisma.caseStudy, undefined),
      cnt(prisma.learningNote, undefined),

      // Gamification
      cnt(prisma.achievement, undefined),
      cnt(prisma.userAchievement, isGlobal ? undefined : userPrimaryTW),
      cnt(prisma.userStreak, isGlobal ? undefined : userPrimaryTW),
      cnt(prisma.userLevel, isGlobal ? undefined : userPrimaryTW),
      cnt(prisma.userPoints, isGlobal ? undefined : userPrimaryTW),
      cnt(prisma.reward, undefined),
      cnt(prisma.userReward, isGlobal ? undefined : userPrimaryTW),

      // Workspace
      cnt(prisma.coachNote, communityTW),
      cnt(prisma.developmentPlan, communityTW),
      cnt(prisma.assessmentCampaign, communityTW),
      cnt(prisma.workspaceAlert, communityTW),
      cnt(prisma.clientAccess, communityTW),

      // Sales
      cnt(prisma.subscription, undefined),
      cnt(prisma.payment, undefined),
      cnt(prisma.coupon, undefined),
      cnt(prisma.couponRedemption, undefined),
      cnt(prisma.salesMetric, undefined),

      // Accounting
      cnt(prisma.invoice, tw),
      cnt(prisma.transaction, tw),
      cnt(prisma.purchaseOrder, tw),
      cnt(prisma.salesOrder, tw),
      cnt(prisma.payout, tw),
      cnt(prisma.payrollRun, tw),
      cnt(prisma.product, tw),

      // HR
      cnt(prisma.employeeProfile, tw),
      cnt(prisma.performanceReview, employeeTW),
      cnt(prisma.leaveRequest, employeeTW),
      cnt(prisma.timeEntry, employeeTW),
      cnt(prisma.productivityLog, employeeTW),

      // ECO
      cnt(prisma.emotionalEvent, isGlobal ? undefined : userPrimaryTW),
      cnt(prisma.emotionalROI, tw),

      // Rowiverse — global by design
      cnt(prisma.rowiVerse, undefined),
      cnt(prisma.rowiVerseUser, undefined),
      cnt(prisma.rowiVerseContribution, undefined),

      // CMS — global content
      cnt(prisma.page, undefined),
      cnt(prisma.layout, undefined),
      cnt(prisma.component, undefined),
      cnt(prisma.translation, undefined),
      cnt(prisma.landingSection, undefined),
      cnt(prisma.cmsContent, undefined),

      // Notifications
      cnt(prisma.notificationQueue, undefined),
      cnt(prisma.notificationLog, undefined),
      cnt(prisma.pushSubscription, undefined),

      // Integrations
      cnt(prisma.integrationConnection, tw),
      cnt(prisma.externalConnection, undefined),
      cnt(prisma.webhook, undefined),

      // Affinity
      cnt(prisma.affinityProfile, isGlobal ? undefined : userPrimaryTW),
      cnt(prisma.affinitySnapshot, isGlobal ? undefined : userPrimaryTW),
      cnt(prisma.affinityInteraction, isGlobal ? undefined : userPrimaryTW),

      // Tokens
      prisma.usageDaily.aggregate({
        _sum: { tokensInput: true, tokensOutput: true },
        where: isGlobal ? undefined : { tenantId: { in: tenantIds! } },
      }),
    ]);

    const tokensTotal =
      (tokenUsage._sum.tokensInput || 0) + (tokenUsage._sum.tokensOutput || 0);

    const domains: Domain[] = [
      {
        key: "structure",
        entities: [
          { key: "users", count: users, href: "/hub/admin/users" },
          { key: "tenants", count: tenants, href: "/hub/admin/tenants" },
          { key: "hubs", count: hubs, href: "/hub/admin/hubs" },
          { key: "superhubs", count: superhubs, href: "/hub/admin/superhubs" },
          { key: "organizations", count: organizations, href: "/hub/admin/organizations" },
          { key: "plans", count: plans, href: "/hub/admin/plans" },
          { key: "invites", count: invites, href: "/hub/admin/invites" },
          { key: "permissions", count: permissions, href: "/hub/admin/permissions" },
        ],
      },
      {
        key: "community",
        entities: [
          { key: "communities", count: communities, href: "/hub/admin/communities" },
          { key: "communityMembers", count: communityMembers, href: "/hub/admin/communities/members" },
          { key: "communityPosts", count: communityPosts, href: "/hub/admin/communities" },
          { key: "communityBatches", count: communityBatches, href: "/hub/admin/communities/import" },
        ],
      },
      {
        key: "social",
        entities: [
          { key: "messageThreads", count: messageThreads, href: "/hub/admin/social/messages" },
          { key: "messages", count: messages, href: "/hub/admin/social/messages" },
          { key: "relations", count: relations, href: "/hub/admin/social/connections" },
          { key: "feeds", count: feeds, href: "/hub/admin/social/feed" },
          { key: "feedComments", count: feedComments, href: "/hub/admin/social/feed" },
          { key: "feedReactions", count: feedReactions, href: "/hub/admin/social/feed" },
          { key: "nobleGoals", count: nobleGoals, href: "/hub/admin/social/goals" },
        ],
      },
      {
        key: "eq",
        entities: [
          { key: "eqSnapshots", count: eqSnapshots, href: "/hub/admin/eq/snapshots" },
          { key: "eqProgress", count: eqProgress, href: "/hub/admin/eq/progress" },
          { key: "eqMood", count: eqMood, href: "/hub/admin/eq/insights" },
          { key: "seiRequests", count: seiRequests, href: "/hub/admin/sei-links" },
          { key: "sixSecondsImports", count: sixSecondsImports, href: "/hub/admin/eq-upload" },
          { key: "seiLinks", count: seiLinks, href: "/hub/admin/sei-links" },
        ],
      },
      {
        key: "benchmarks",
        entities: [
          { key: "benchmarks", count: benchmarks, href: "/hub/admin/benchmarks" },
          { key: "benchmarkDataPoints", count: benchmarkDataPoints, href: "/hub/admin/benchmarks" },
          { key: "benchmarkUploadJobs", count: benchmarkUploadJobs, href: "/hub/admin/benchmarks/upload" },
        ],
      },
      {
        key: "ai",
        entities: [
          { key: "agents", count: agentConfigs, href: "/hub/admin/agents" },
          { key: "rowiChats", count: rowiChats, href: "/hub/admin/ai/conversations" },
          { key: "agentContexts", count: agentContexts, href: "/hub/admin/agents" },
          { key: "chatFeedback", count: rowiChatFeedback, href: "/hub/admin/ai/conversations" },
          { key: "tokens", count: tokensTotal, href: "/hub/admin/tokens" },
        ],
      },
      {
        key: "weekflow",
        entities: [
          { key: "weekflowSessions", count: weekflowSessions, href: "/hub/admin/weekflow" },
          { key: "weekflowContributions", count: weekflowContributions, href: "/hub/admin/weekflow" },
          { key: "weekflowMood", count: weekflowMood, href: "/hub/admin/weekflow" },
          { key: "weekflowComments", count: weekflowComments, href: "/hub/admin/weekflow" },
          { key: "tasks", count: rowiTasks, href: "/hub/admin/tasks" },
          { key: "taskReflections", count: taskReflections, href: "/hub/admin/tasks" },
        ],
      },
      {
        key: "education",
        entities: [
          { key: "courses", count: courses, href: "/hub/admin/elearning/courses" },
          { key: "lessons", count: lessons, href: "/hub/admin/elearning/courses" },
          { key: "enrollments", count: enrollments, href: "/hub/admin/education/enrollments" },
          { key: "quizzes", count: quizzes, href: "/hub/admin/elearning/quizzes" },
          { key: "quizAttempts", count: quizAttempts, href: "/hub/admin/elearning/quizzes" },
          { key: "certificates", count: certificates, href: "/hub/admin/elearning/certificates" },
          { key: "microLearning", count: microLearning, href: "/hub/admin/elearning/microlearning" },
          { key: "userMicroLearning", count: userMicroLearning, href: "/hub/admin/elearning/microlearning" },
          { key: "studyGroups", count: studyGroups, href: "/hub/admin/education/study-groups" },
        ],
      },
      {
        key: "knowledge",
        entities: [
          { key: "knowledgeResources", count: knowledgeResources, href: "/hub/admin/knowledge" },
          { key: "caseStudies", count: caseStudies, href: "/hub/admin/knowledge" },
          { key: "learningNotes", count: learningNotes, href: "/hub/admin/knowledge" },
        ],
      },
      {
        key: "gamification",
        entities: [
          { key: "achievements", count: achievements, href: "/hub/admin/gamification/achievements" },
          { key: "userAchievements", count: userAchievements, href: "/hub/admin/gamification/achievements" },
          { key: "userStreaks", count: userStreaks, href: "/hub/admin/gamification/streaks" },
          { key: "userLevels", count: userLevels, href: "/hub/admin/gamification/levels" },
          { key: "userPoints", count: userPoints, href: "/hub/admin/gamification/leaderboards" },
          { key: "rewards", count: rewards, href: "/hub/admin/gamification/rewards" },
          { key: "userRewards", count: userRewards, href: "/hub/admin/gamification/rewards" },
        ],
      },
      {
        key: "workspace",
        entities: [
          { key: "coachNotes", count: coachNotes, href: "/hub/admin/coaching" },
          { key: "developmentPlans", count: developmentPlans, href: "/hub/admin/coaching/plans" },
          { key: "assessmentCampaigns", count: assessmentCampaigns, href: "/hub/admin/coaching/campaigns" },
          { key: "workspaceAlerts", count: workspaceAlerts, href: "/hub/admin/coaching/alerts" },
          { key: "clientAccesses", count: clientAccesses, href: "/hub/admin/coaching/clients" },
        ],
      },
      {
        key: "affinity",
        entities: [
          { key: "affinityProfiles", count: affinityProfiles, href: "/hub/admin/affinity" },
          { key: "affinitySnapshots", count: affinitySnapshots, href: "/hub/admin/affinity" },
          { key: "affinityInteractions", count: affinityInteractions, href: "/hub/admin/affinity" },
        ],
      },
      {
        key: "eco",
        entities: [
          { key: "emotionalEvents", count: emotionalEvents, href: "/hub/admin/eco" },
          { key: "emotionalROIs", count: emotionalROIs, href: "/hub/admin/eco" },
        ],
      },
      {
        key: "sales",
        entities: [
          { key: "subscriptions", count: subscriptions, href: "/hub/admin/sales/subscriptions" },
          { key: "payments", count: payments, href: "/hub/admin/sales/dashboard" },
          { key: "coupons", count: coupons, href: "/hub/admin/sales/coupons" },
          { key: "couponRedemptions", count: couponRedemptions, href: "/hub/admin/sales/coupons" },
          { key: "salesMetrics", count: salesMetrics, href: "/hub/admin/sales/reports" },
        ],
      },
      {
        key: "accounting",
        entities: [
          { key: "invoices", count: invoices, href: "/hub/admin/accounting/invoices" },
          { key: "transactions", count: transactions, href: "/hub/admin/accounting/transactions" },
          { key: "purchaseOrders", count: purchaseOrders, href: "/hub/admin/accounting/purchase-orders" },
          { key: "salesOrders", count: salesOrders, href: "/hub/admin/accounting/sales-orders" },
          { key: "payouts", count: payouts, href: "/hub/admin/accounting/payouts" },
          { key: "payrollRuns", count: payrollRuns, href: "/hub/admin/accounting/payroll" },
          { key: "products", count: products, href: "/hub/admin/accounting/products" },
        ],
      },
      {
        key: "hr",
        entities: [
          { key: "employees", count: employees, href: "/hub/admin/hr/employees" },
          { key: "reviews", count: reviews, href: "/hub/admin/hr/reviews" },
          { key: "leaves", count: leaves, href: "/hub/admin/hr/leaves" },
          { key: "timeEntries", count: timeEntries, href: "/hub/admin/hr/time" },
          { key: "productivityLogs", count: productivityLogs, href: "/hub/admin/hr/productivity" },
        ],
      },
      {
        key: "rowiverse",
        entities: [
          { key: "rowiVerses", count: rowiVerses, href: "/hub/admin/rowiverse" },
          { key: "rowiVerseUsers", count: rowiVerseUsers, href: "/hub/admin/rowiverse" },
          { key: "rowiVerseContributions", count: rowiVerseContributions, href: "/hub/admin/rowiverse/contributions" },
        ],
      },
      {
        key: "cms",
        entities: [
          { key: "pages", count: pages, href: "/hub/admin/public-pages" },
          { key: "layouts", count: layouts, href: "/hub/admin/layouts" },
          { key: "components", count: components, href: "/hub/admin/components" },
          { key: "translations", count: translations, href: "/hub/admin/translations" },
          { key: "landingSections", count: landingSections, href: "/hub/admin/landing-builder" },
          { key: "cmsContent", count: cmsContent, href: "/hub/admin/cms" },
        ],
      },
      {
        key: "notifications",
        entities: [
          { key: "notificationQueue", count: notificationQueue, href: "/hub/admin/notifications" },
          { key: "notificationLogs", count: notificationLogs, href: "/hub/admin/notifications" },
          { key: "pushSubscriptions", count: pushSubscriptions, href: "/hub/admin/notifications" },
        ],
      },
      {
        key: "integrations",
        entities: [
          { key: "integrationConnections", count: integrationConnections, href: "/hub/admin/integrations" },
          { key: "externalConnections", count: externalConnections, href: "/hub/admin/integrations" },
          { key: "webhooks", count: webhooks, href: "/hub/admin/integrations" },
        ],
      },
    ];

    const totalRecords = domains.reduce(
      (sum, d) => sum + d.entities.reduce((s, e) => s + e.count, 0),
      0,
    );

    return NextResponse.json({
      ok: true,
      scope: { type: auth.scope.type, id: auth.scope.id },
      isGlobal,
      totalRecords,
      domains,
    });
  } catch (e) {
    console.error("[admin/inventory/stats] Error:", e);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 },
    );
  }
}
