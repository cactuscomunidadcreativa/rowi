-- CreateEnum
CREATE TYPE "TenantRole" AS ENUM ('SUPERADMIN', 'ADMIN', 'MANAGER', 'EDITOR', 'VIEWER', 'DEVELOPER', 'BILLING', 'FEDERATOR');

-- CreateEnum
CREATE TYPE "OrgRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "AgentType" AS ENUM ('AFFINITY', 'ECO', 'EQ', 'SALES', 'TRAINER', 'SUPER', 'CUSTOM');

-- CreateEnum
CREATE TYPE "UsageFeature" AS ENUM ('AFFINITY', 'ECO', 'EQ', 'SALES', 'TRAINER', 'SUPER', 'ROWI_COACH', 'ROWI_CHAT', 'TTS', 'STT', 'IMPORT', 'EXPORT', 'CUSTOM_FEATURE');

-- CreateEnum
CREATE TYPE "PayrollPeriod" AS ENUM ('MONTHLY', 'BIWEEKLY', 'WEEKLY');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER');

-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('SALE', 'PURCHASE');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SABBATICAL', 'TERMINATED');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('FULL_TIME', 'PART_TIME', 'FREELANCE', 'CONTRACTOR');

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('IN', 'OUT', 'ADJUST');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('ACTIVE', 'DISPOSED', 'MAINTENANCE', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "CommunityMemberStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'INVITED', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "AccountCategoryType" AS ENUM ('INCOME', 'EXPENSE', 'ASSET', 'LIABILITY');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RoleLevel" AS ENUM ('SYSTEM', 'SUPERHUB', 'HUB', 'TENANT', 'PLAN');

-- CreateEnum
CREATE TYPE "PermissionScope" AS ENUM ('rowiverse', 'superhub', 'hub', 'tenant', 'organization', 'community');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "bio" TEXT,
    "headline" TEXT,
    "planExpiresAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "allowAI" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "planId" TEXT,
    "primaryTenantId" TEXT,
    "organizationRole" TEXT DEFAULT 'VIEWER',
    "country" TEXT DEFAULT 'Unknown',
    "region" TEXT,
    "city" TEXT,
    "language" TEXT DEFAULT 'es',
    "timezone" TEXT DEFAULT 'America/Lima',
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "rowiverseId" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_email" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "label" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "primary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_email_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_permission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scopeType" "PermissionScope",
    "scopeId" TEXT,
    "role" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT,
    "scope" TEXT NOT NULL DEFAULT 'global',

    CONSTRAINT "user_permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Cactus Global System',
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT DEFAULT '/cactus-logo.png',
    "primaryColor" TEXT DEFAULT '#0F172A',
    "secondaryColor" TEXT DEFAULT '#F97316',
    "defaultLang" TEXT DEFAULT 'es',
    "timezone" TEXT DEFAULT 'America/Lima',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_setting" (
    "id" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "super_hub" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "vision" TEXT,
    "mission" TEXT,
    "colorTheme" TEXT,
    "logo" TEXT,
    "country" TEXT DEFAULT 'Global',
    "language" TEXT DEFAULT 'es',
    "region" TEXT DEFAULT 'LATAM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rowiVerseId" TEXT,
    "parentHubId" TEXT,
    "systemId" TEXT,

    CONSTRAINT "super_hub_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hub" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "superHubId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "themeColor" TEXT,
    "visibility" TEXT DEFAULT 'private',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hub_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hub_membership" (
    "id" TEXT NOT NULL,
    "hubId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT,
    "access" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hub_membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hub_role_dynamic" (
    "id" TEXT NOT NULL,
    "hubId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" JSONB,
    "color" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hub_role_dynamic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hub_post" (
    "id" TEXT NOT NULL,
    "hubId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "emotionTag" TEXT,
    "intent" TEXT,
    "visibility" TEXT DEFAULT 'hub',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hub_post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "billingEmail" TEXT,
    "visibilityScope" TEXT,
    "emotionalAccess" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rowiVerseId" TEXT,
    "superHubId" TEXT,
    "planId" TEXT,
    "systemId" TEXT,

    CONSTRAINT "tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rowiVerseId" TEXT,
    "superHubId" TEXT,
    "hubId" TEXT,

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_to_hub" (
    "hubId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "OrganizationToHub_pkey" PRIMARY KEY ("hubId","organizationId")
);

-- CreateTable
CREATE TABLE "organization_to_tenant" (
    "tenantId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "OrganizationToTenant_pkey" PRIMARY KEY ("tenantId","organizationId")
);

-- CreateTable
CREATE TABLE "org_membership" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "OrgRole" NOT NULL DEFAULT 'MEMBER',
    "tokenQuota" INTEGER DEFAULT 0,
    "tokenUsed" INTEGER DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planId" TEXT,
    "role" "TenantRole" NOT NULL DEFAULT 'VIEWER',
    "tokenQuota" INTEGER DEFAULT 0,
    "tokenUsed" INTEGER DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "durationDays" INTEGER NOT NULL DEFAULT 30,
    "aiEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_member" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT,
    "status" "CommunityMemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "tenantId" TEXT NOT NULL,
    "hubId" TEXT,
    "userId" TEXT,
    "ownerId" TEXT,
    "claimedById" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "brainStyle" TEXT,
    "closeness" TEXT,
    "connectionType" TEXT,
    "country" TEXT,
    "email" TEXT,
    "firstName" TEXT,
    "group" TEXT,
    "lastName" TEXT,
    "source" TEXT DEFAULT 'manual',
    "rowiverseUserId" TEXT,

    CONSTRAINT "community_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rowi_relation" (
    "id" TEXT NOT NULL,
    "initiatorId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "initiatorGlobalId" TEXT,
    "receiverGlobalId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'connection',
    "strength" DOUBLE PRECISION,
    "context" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rowi_relation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rowi_feed" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mood" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rowi_feed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eq_snapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "memberId" TEXT,
    "rowiverseUserId" TEXT,
    "dataset" TEXT NOT NULL,
    "project" TEXT,
    "owner" TEXT,
    "country" TEXT,
    "email" TEXT,
    "jobFunction" TEXT,
    "jobRole" TEXT,
    "sector" TEXT,
    "age" INTEGER,
    "gender" TEXT,
    "education" TEXT,
    "phone" TEXT,
    "context" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "K" INTEGER,
    "C" INTEGER,
    "G" INTEGER,
    "EL" INTEGER,
    "RP" INTEGER,
    "ACT" INTEGER,
    "NE" INTEGER,
    "IM" INTEGER,
    "OP" INTEGER,
    "EMP" INTEGER,
    "NG" INTEGER,
    "brainStyle" TEXT,
    "overall4" DOUBLE PRECISION,
    "recentMood" TEXT,
    "moodIntensity" TEXT,
    "reliabilityIndex" DOUBLE PRECISION,
    "positiveImpressionScore" DOUBLE PRECISION,
    "positiveImpressionRange" TEXT,
    "executionTimeRange" TEXT,
    "randomIndex" DOUBLE PRECISION,
    "densityIndex" DOUBLE PRECISION,
    "answerStyle" TEXT,
    "normFactorComplement" DOUBLE PRECISION,
    "consistencyOutput" DOUBLE PRECISION,

    CONSTRAINT "eq_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eq_competency_snapshot" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT,
    "score" DOUBLE PRECISION,

    CONSTRAINT "eq_competency_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eq_outcome_snapshot" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT,
    "score" DOUBLE PRECISION,

    CONSTRAINT "eq_outcome_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eq_subfactor_snapshot" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT,
    "score" DOUBLE PRECISION,

    CONSTRAINT "eq_subfactor_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eq_value_snapshot" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT,
    "score" DOUBLE PRECISION,

    CONSTRAINT "eq_value_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eq_success_factor_snapshot" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT,
    "score" DOUBLE PRECISION,

    CONSTRAINT "eq_success_factor_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "talent_snapshot" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT,
    "score" DOUBLE PRECISION,

    CONSTRAINT "talent_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eq_mood_snapshot" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "mood" TEXT NOT NULL,
    "intensity" DOUBLE PRECISION,
    "valence" DOUBLE PRECISION,

    CONSTRAINT "eq_mood_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eq_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "memberId" TEXT,
    "snapshotId" TEXT,
    "reflection" TEXT,
    "insight" TEXT,
    "actionPlan" TEXT,
    "metrics" JSONB,
    "contextType" TEXT,
    "contextId" TEXT,
    "mood" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eq_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rowi_chat" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "peerId" TEXT,
    "agentId" TEXT,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "intent" TEXT,
    "locale" TEXT,
    "sentiment" TEXT,
    "confidence" DOUBLE PRECISION,
    "contextType" TEXT,
    "contextId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rowi_chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emotional_event" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "memberId" TEXT,
    "rowiverseUserId" TEXT,
    "chatId" TEXT,
    "progressId" TEXT,
    "type" TEXT NOT NULL,
    "message" TEXT,
    "contextType" TEXT,
    "contextId" TEXT,
    "intensity" INTEGER,
    "valence" DOUBLE PRECISION,
    "aiModel" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emotional_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT,
    "type" TEXT NOT NULL,
    "context" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "result" JSONB,
    "meta" JSONB,
    "count" INTEGER DEFAULT 0,
    "description" TEXT,
    "name" TEXT NOT NULL,

    CONSTRAINT "batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_study" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "context" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_study_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_section" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "heading" TEXT NOT NULL,
    "content" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "case_section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_note" (
    "id" TEXT NOT NULL,
    "caseId" TEXT,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "visibility" TEXT DEFAULT 'private',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "peer_feedback" (
    "id" TEXT NOT NULL,
    "caseId" TEXT,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "comment" TEXT,
    "score" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "peer_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purpose" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_group_member" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_group_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_resource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "kind" TEXT DEFAULT 'general',
    "content" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "hubId" TEXT,
    "tenantId" TEXT,
    "superHubId" TEXT,
    "caseId" TEXT,

    CONSTRAINT "knowledge_resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_tag" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "resource_tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "difficulty" TEXT,
    "durationHours" DOUBLE PRECISION,
    "lang" TEXT DEFAULT 'es',
    "status" TEXT DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "content" JSONB,
    "durationMin" INTEGER,
    "isQuiz" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "progressPct" DOUBLE PRECISION DEFAULT 0,
    "status" TEXT DEFAULT 'active',
    "score" DOUBLE PRECISION,
    "certificateId" TEXT,

    CONSTRAINT "enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "questions" JSONB NOT NULL,
    "passingScore" DOUBLE PRECISION,
    "lessonId" TEXT NOT NULL,

    CONSTRAINT "quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_attempt" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "score" DOUBLE PRECISION,
    "passed" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate" (
    "id" TEXT NOT NULL,
    "courseId" TEXT,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "issuedById" TEXT,
    "credentialId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "emotionTag" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3),
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "digitalUrl" TEXT,
    "signatureUrl" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_config" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "avatar" TEXT,
    "type" TEXT NOT NULL DEFAULT 'CUSTOM',
    "model" TEXT,
    "prompt" TEXT,
    "tools" JSONB,
    "tone" TEXT,
    "accessLevel" TEXT,
    "visibility" TEXT,
    "autoLearn" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT,
    "superHubId" TEXT,
    "organizationId" TEXT,
    "hubId" TEXT,
    "systemId" TEXT,

    CONSTRAINT "agent_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_context" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "contextType" TEXT NOT NULL,
    "contextId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "autoLearn" BOOLEAN NOT NULL DEFAULT false,
    "learningData" JSONB,
    "feedbackScore" DOUBLE PRECISION,
    "customPrompt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_context_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_ai_control" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_ai_control_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_usage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT,
    "day" TIMESTAMP(3) NOT NULL,
    "feature" TEXT,
    "tokensInput" INTEGER NOT NULL DEFAULT 0,
    "tokensOutput" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "content" JSONB,
    "components" JSONB,
    "theme" JSONB,
    "layoutConfig" JSONB,
    "aiConfig" JSONB,
    "seo" JSONB,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT,
    "canonicalURL" TEXT,
    "lang" TEXT DEFAULT 'es',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "systemId" TEXT,
    "tenantId" TEXT,
    "superHubId" TEXT,
    "organizationId" TEXT,
    "authorId" TEXT,
    "visibility" TEXT DEFAULT 'global',
    "accessLevel" TEXT DEFAULT 'public',
    "rolesAllowed" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "scripts" JSONB,
    "dataSources" JSONB,
    "layoutId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_component" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "zone" TEXT,
    "position" INTEGER,
    "props" JSONB,
    "dataBinding" JSONB,
    "style" JSONB,
    "responsive" JSONB,
    "aiConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_component_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "layout" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "structure" JSONB,
    "theme" JSONB,
    "previewUrl" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "systemId" TEXT,
    "tenantId" TEXT,
    "superHubId" TEXT,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "layout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "component" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "category" TEXT,
    "description" TEXT,
    "icon" TEXT,
    "config" JSONB,
    "schema" JSONB,
    "style" JSONB,
    "theme" JSONB,
    "slots" JSONB,
    "aiEnabled" BOOLEAN NOT NULL DEFAULT false,
    "aiConfig" JSONB,
    "tenantId" TEXT,
    "superHubId" TEXT,
    "organizationId" TEXT,
    "systemId" TEXT,
    "visibility" TEXT DEFAULT 'global',
    "accessLevel" TEXT DEFAULT 'public',
    "version" TEXT DEFAULT '1.0.0',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "component_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "layout_component" (
    "id" TEXT NOT NULL,
    "layoutId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "zone" TEXT,
    "position" INTEGER,
    "props" JSONB,
    "dataBinding" JSONB,
    "style" JSONB,
    "responsive" JSONB,
    "aiConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "layout_component_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "translation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "pageId" TEXT,
    "ns" TEXT DEFAULT 'common',
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "lang" TEXT DEFAULT 'es',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "systemId" TEXT,

    CONSTRAINT "translation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_connection" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "connection" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "external_connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "targetUrl" TEXT NOT NULL,
    "secret" TEXT,
    "events" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "targetId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_category" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountCategoryType" NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "hubId" TEXT,
    "accountId" TEXT,
    "type" "TransactionType" NOT NULL,
    "description" TEXT,
    "amountUsd" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'recorded',
    "method" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT,

    CONSTRAINT "transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "hubId" TEXT,
    "number" TEXT,
    "type" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT,
    "description" TEXT,
    "totalUsd" DECIMAL(12,2) NOT NULL,
    "taxUsd" DECIMAL(12,2),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_item" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "productId" TEXT,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "totalUsd" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "invoice_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_center" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cost_center_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_center_link" (
    "id" TEXT NOT NULL,
    "costCenterId" TEXT NOT NULL,
    "hubId" TEXT,
    "weight" DOUBLE PRECISION DEFAULT 1,

    CONSTRAINT "cost_center_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_allocation" (
    "id" TEXT NOT NULL,
    "costCenterId" TEXT NOT NULL,
    "transactionId" TEXT,
    "amountUsd" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cost_allocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "unitCostUsd" DECIMAL(12,2) NOT NULL,
    "priceUsd" DECIMAL(12,2) NOT NULL,
    "stockQty" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_movement" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "InventoryMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCostUsd" DECIMAL(12,2) NOT NULL,
    "totalUsd" DECIMAL(12,2) NOT NULL,
    "reference" TEXT,
    "sourceType" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meta" JSONB,

    CONSTRAINT "inventory_movement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "supplierName" TEXT NOT NULL,
    "supplierEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "totalUsd" DECIMAL(12,2) NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDate" TIMESTAMP(3),
    "reference" TEXT,
    "notes" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_item" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "productId" TEXT,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitCostUsd" DECIMAL(12,2) NOT NULL,
    "totalUsd" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "purchase_order_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_order" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "totalUsd" DECIMAL(12,2) NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveryDate" TIMESTAMP(3),
    "reference" TEXT,
    "notes" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_order_item" (
    "id" TEXT NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "productId" TEXT,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "totalUsd" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "sales_order_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "acquisitionDate" TIMESTAMP(3),
    "valueUsd" DECIMAL(12,2) NOT NULL,
    "depreciationRate" DOUBLE PRECISION,
    "status" "AssetStatus" NOT NULL DEFAULT 'ACTIVE',
    "location" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT,

    CONSTRAINT "asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_run" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "period" "PayrollPeriod" NOT NULL DEFAULT 'MONTHLY',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_item" (
    "id" TEXT NOT NULL,
    "payrollRunId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "amountUsd" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT,
    "position" TEXT,
    "department" TEXT,
    "hireDate" TIMESTAMP(3),
    "salaryUsd" DECIMAL(10,2),
    "contractType" "ContractType",
    "status" "EmploymentStatus" NOT NULL DEFAULT 'ACTIVE',
    "skills" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT,

    CONSTRAINT "employee_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_review" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "agentId" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "score" DOUBLE PRECISION,
    "emotionalScore" DOUBLE PRECISION,
    "comments" TEXT,
    "goals" JSONB,
    "insightsAI" JSONB,
    "status" TEXT DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "performance_review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_entry" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "minutes" INTEGER,
    "activity" TEXT,
    "billable" BOOLEAN NOT NULL DEFAULT false,
    "rateUsdHour" DECIMAL(10,2),
    "emotionTag" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productivity_log" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "taskName" TEXT,
    "hoursSpent" DOUBLE PRECISION DEFAULT 0,
    "focusLevel" DOUBLE PRECISION,
    "emotionTag" TEXT,
    "productivityIndex" DOUBLE PRECISION,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "productivity_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_snapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "scope" TEXT NOT NULL,
    "metricKey" TEXT NOT NULL,
    "metricValue" DOUBLE PRECISION,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predictive_metric" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "projectId" TEXT,
    "hubId" TEXT,
    "superHubId" TEXT,
    "horizonDays" INTEGER NOT NULL DEFAULT 30,
    "scope" TEXT NOT NULL,
    "metricKey" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION,
    "generatedBy" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "predictive_metric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_request" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "tenantId" TEXT,
    "projectId" TEXT,
    "amountUsd" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "method" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_daily" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "feature" "UsageFeature" NOT NULL,
    "model" TEXT,
    "tokensInput" INTEGER NOT NULL DEFAULT 0,
    "tokensOutput" INTEGER NOT NULL DEFAULT 0,
    "calls" INTEGER NOT NULL DEFAULT 0,
    "costUsd" DECIMAL(10,4),

    CONSTRAINT "usage_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_module" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "visibility" TEXT,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "location" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "hubId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT DEFAULT 'active',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emotional_ai_engine" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "hubId" TEXT,
    "state" TEXT NOT NULL DEFAULT 'idle',
    "mode" TEXT NOT NULL DEFAULT 'coach',
    "description" TEXT DEFAULT 'Motor emocional activo',
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "contextSize" INTEGER NOT NULL DEFAULT 8192,
    "memorySpan" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emotional_ai_engine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affinity_snapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "userGlobalId" TEXT,
    "memberGlobalId" TEXT,
    "context" TEXT NOT NULL,
    "lastHeat135" INTEGER,
    "aiSummary" TEXT,
    "biasFactor" DOUBLE PRECISION,
    "closeness" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "affinity_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affinity_interaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "userGlobalId" TEXT,
    "memberGlobalId" TEXT,
    "context" TEXT,
    "emotionTag" TEXT,
    "effectiveness" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "affinity_interaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insight_record" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "generatedBy" TEXT,
    "sourceModel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hubId" TEXT,
    "tenantId" TEXT,
    "superHubId" TEXT,
    "meta" JSONB,

    CONSTRAINT "insight_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "csv_upload" (
    "id" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "dataset" TEXT,
    "rowCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "csv_upload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invite_token" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT,
    "email" TEXT NOT NULL,
    "role" TEXT DEFAULT 'USER',
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invite_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_log" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "targetId" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_dynamic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "level" "RoleLevel" NOT NULL DEFAULT 'HUB',
    "hubId" TEXT,
    "tenantId" TEXT,
    "superHubId" TEXT,
    "planId" TEXT,
    "permissions" JSONB,
    "color" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_dynamic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_batch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalRows" INTEGER NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "import_batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_row" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "surname" TEXT,
    "country" TEXT,
    "jobRole" TEXT,
    "sector" TEXT,
    "data" JSONB NOT NULL,
    "selected" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "message" TEXT,

    CONSTRAINT "import_row_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "background_task" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "description" TEXT,
    "payload" JSONB,
    "result" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "background_task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_model_version" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "modelName" TEXT NOT NULL,
    "description" TEXT,
    "metrics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_model_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_training_sample" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_training_sample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emotional_config" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "key" TEXT NOT NULL,
    "value" JSONB,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emotional_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rowi_verse" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "bannerUrl" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rowi_verse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rowiverse_user" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "image" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "country" TEXT DEFAULT 'NONE',
    "language" TEXT DEFAULT 'es',
    "status" TEXT DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "rowiVerseId" TEXT,

    CONSTRAINT "rowiverse_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rowi_community" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT DEFAULT 'general',
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "bannerUrl" TEXT,
    "coverUrl" TEXT,
    "category" TEXT,
    "rules" TEXT,
    "createdById" TEXT,
    "superId" TEXT,
    "rowiVerseId" TEXT,
    "superHubId" TEXT,
    "hubId" TEXT,
    "tenantId" TEXT,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "owner" TEXT,
    "language" TEXT,
    "executionTime" INTEGER,

    CONSTRAINT "rowi_community_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rowi_community_user" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "rowiverseUserId" TEXT,
    "communityId" TEXT NOT NULL,
    "role" TEXT DEFAULT 'member',
    "relationToMe" TEXT,
    "connectionType" TEXT,
    "affinityLevel" INTEGER,
    "trustLevel" INTEGER,
    "status" TEXT DEFAULT 'active',
    "invitedById" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3),

    CONSTRAINT "rowi_community_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rowi_community_post" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "tags" TEXT[],
    "emotionTag" TEXT,
    "visibility" TEXT DEFAULT 'community',
    "reactions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rowi_community_post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_batch" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" JSONB,

    CONSTRAINT "community_batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecosystem_link" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "metadata" JSONB,

    CONSTRAINT "ecosystem_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CaseStudyToStudyGroup" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CaseStudyToStudyGroup_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AgentKnowledge" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AgentKnowledge_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_rowiverseId_key" ON "user"("rowiverseId");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_userId_email_key" ON "user_email"("userId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "account_provider_providerAccountId_key" ON "account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "session_sessionToken_key" ON "session"("sessionToken");

-- CreateIndex
CREATE INDEX "user_permission_userId_tenantId_idx" ON "user_permission"("userId", "tenantId");

-- CreateIndex
CREATE INDEX "user_permission_userId_scopeType_scopeId_idx" ON "user_permission"("userId", "scopeType", "scopeId");

-- CreateIndex
CREATE UNIQUE INDEX "system_slug_key" ON "system"("slug");

-- CreateIndex
CREATE INDEX "system_setting_systemId_idx" ON "system_setting"("systemId");

-- CreateIndex
CREATE UNIQUE INDEX "system_setting_systemId_key_key" ON "system_setting"("systemId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "super_hub_slug_key" ON "super_hub"("slug");

-- CreateIndex
CREATE INDEX "super_hub_name_idx" ON "super_hub"("name");

-- CreateIndex
CREATE INDEX "super_hub_slug_idx" ON "super_hub"("slug");

-- CreateIndex
CREATE INDEX "super_hub_rowiVerseId_idx" ON "super_hub"("rowiVerseId");

-- CreateIndex
CREATE UNIQUE INDEX "hub_slug_key" ON "hub"("slug");

-- CreateIndex
CREATE INDEX "hub_tenantId_idx" ON "hub"("tenantId");

-- CreateIndex
CREATE INDEX "hub_slug_idx" ON "hub"("slug");

-- CreateIndex
CREATE INDEX "hub_superHubId_idx" ON "hub"("superHubId");

-- CreateIndex
CREATE UNIQUE INDEX "hub_tenantId_name_key" ON "hub"("tenantId", "name");

-- CreateIndex
CREATE INDEX "hub_membership_hubId_roleId_idx" ON "hub_membership"("hubId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "hub_membership_hubId_userId_key" ON "hub_membership"("hubId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "hub_role_dynamic_hubId_name_key" ON "hub_role_dynamic"("hubId", "name");

-- CreateIndex
CREATE INDEX "hub_post_hubId_createdAt_idx" ON "hub_post"("hubId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_slug_key" ON "tenant"("slug");

-- CreateIndex
CREATE INDEX "tenant_name_idx" ON "tenant"("name");

-- CreateIndex
CREATE INDEX "tenant_slug_idx" ON "tenant"("slug");

-- CreateIndex
CREATE INDEX "tenant_rowiVerseId_idx" ON "tenant"("rowiVerseId");

-- CreateIndex
CREATE INDEX "tenant_superHubId_idx" ON "tenant"("superHubId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_slug_key" ON "organization"("slug");

-- CreateIndex
CREATE INDEX "organization_rowiVerseId_idx" ON "organization"("rowiVerseId");

-- CreateIndex
CREATE INDEX "organization_superHubId_idx" ON "organization"("superHubId");

-- CreateIndex
CREATE INDEX "organization_hubId_idx" ON "organization"("hubId");

-- CreateIndex
CREATE INDEX "OrganizationToHub_org_idx" ON "organization_to_hub"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationToTenant_org_idx" ON "organization_to_tenant"("organizationId");

-- CreateIndex
CREATE INDEX "org_membership_organizationId_role_idx" ON "org_membership"("organizationId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "org_membership_organizationId_userId_key" ON "org_membership"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "membership_tenantId_role_idx" ON "membership"("tenantId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "membership_userId_tenantId_key" ON "membership"("userId", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "plan_name_key" ON "plan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "community_member_email_key" ON "community_member"("email");

-- CreateIndex
CREATE INDEX "community_member_tenantId_idx" ON "community_member"("tenantId");

-- CreateIndex
CREATE INDEX "community_member_hubId_idx" ON "community_member"("hubId");

-- CreateIndex
CREATE INDEX "community_member_userId_idx" ON "community_member"("userId");

-- CreateIndex
CREATE INDEX "community_member_email_idx" ON "community_member"("email");

-- CreateIndex
CREATE INDEX "community_member_firstName_idx" ON "community_member"("firstName");

-- CreateIndex
CREATE INDEX "community_member_lastName_idx" ON "community_member"("lastName");

-- CreateIndex
CREATE INDEX "community_member_rowiverseUserId_idx" ON "community_member"("rowiverseUserId");

-- CreateIndex
CREATE INDEX "rowi_relation_type_status_idx" ON "rowi_relation"("type", "status");

-- CreateIndex
CREATE INDEX "rowi_relation_initiatorGlobalId_receiverGlobalId_idx" ON "rowi_relation"("initiatorGlobalId", "receiverGlobalId");

-- CreateIndex
CREATE UNIQUE INDEX "rowi_relation_initiatorId_receiverId_key" ON "rowi_relation"("initiatorId", "receiverId");

-- CreateIndex
CREATE INDEX "rowi_feed_authorId_idx" ON "rowi_feed"("authorId");

-- CreateIndex
CREATE INDEX "eq_snapshot_userId_idx" ON "eq_snapshot"("userId");

-- CreateIndex
CREATE INDEX "eq_snapshot_memberId_idx" ON "eq_snapshot"("memberId");

-- CreateIndex
CREATE INDEX "eq_snapshot_dataset_idx" ON "eq_snapshot"("dataset");

-- CreateIndex
CREATE INDEX "eq_snapshot_email_idx" ON "eq_snapshot"("email");

-- CreateIndex
CREATE INDEX "eq_snapshot_rowiverseUserId_idx" ON "eq_snapshot"("rowiverseUserId");

-- CreateIndex
CREATE INDEX "eq_progress_userId_idx" ON "eq_progress"("userId");

-- CreateIndex
CREATE INDEX "eq_progress_memberId_idx" ON "eq_progress"("memberId");

-- CreateIndex
CREATE INDEX "eq_progress_contextType_contextId_idx" ON "eq_progress"("contextType", "contextId");

-- CreateIndex
CREATE INDEX "rowi_chat_userId_idx" ON "rowi_chat"("userId");

-- CreateIndex
CREATE INDEX "rowi_chat_contextType_contextId_idx" ON "rowi_chat"("contextType", "contextId");

-- CreateIndex
CREATE INDEX "emotional_event_userId_idx" ON "emotional_event"("userId");

-- CreateIndex
CREATE INDEX "emotional_event_memberId_idx" ON "emotional_event"("memberId");

-- CreateIndex
CREATE INDEX "emotional_event_type_idx" ON "emotional_event"("type");

-- CreateIndex
CREATE INDEX "emotional_event_contextType_contextId_idx" ON "emotional_event"("contextType", "contextId");

-- CreateIndex
CREATE INDEX "emotional_event_rowiverseUserId_idx" ON "emotional_event"("rowiverseUserId");

-- CreateIndex
CREATE INDEX "batch_ownerId_idx" ON "batch"("ownerId");

-- CreateIndex
CREATE INDEX "batch_type_idx" ON "batch"("type");

-- CreateIndex
CREATE INDEX "batch_context_idx" ON "batch"("context");

-- CreateIndex
CREATE UNIQUE INDEX "study_group_member_groupId_userId_key" ON "study_group_member"("groupId", "userId");

-- CreateIndex
CREATE INDEX "knowledge_resource_hubId_idx" ON "knowledge_resource"("hubId");

-- CreateIndex
CREATE INDEX "knowledge_resource_tenantId_idx" ON "knowledge_resource"("tenantId");

-- CreateIndex
CREATE INDEX "knowledge_resource_superHubId_idx" ON "knowledge_resource"("superHubId");

-- CreateIndex
CREATE INDEX "knowledge_resource_kind_idx" ON "knowledge_resource"("kind");

-- CreateIndex
CREATE UNIQUE INDEX "resource_tag_resourceId_tagId_key" ON "resource_tag"("resourceId", "tagId");

-- CreateIndex
CREATE UNIQUE INDEX "tag_name_key" ON "tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "enrollment_certificateId_key" ON "enrollment"("certificateId");

-- CreateIndex
CREATE UNIQUE INDEX "enrollment_userId_courseId_key" ON "enrollment"("userId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_lessonId_key" ON "quiz"("lessonId");

-- CreateIndex
CREATE INDEX "quiz_attempt_userId_idx" ON "quiz_attempt"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "certificate_credentialId_key" ON "certificate"("credentialId");

-- CreateIndex
CREATE INDEX "agent_config_slug_idx" ON "agent_config"("slug");

-- CreateIndex
CREATE INDEX "agent_config_tenantId_idx" ON "agent_config"("tenantId");

-- CreateIndex
CREATE INDEX "agent_config_superHubId_idx" ON "agent_config"("superHubId");

-- CreateIndex
CREATE INDEX "agent_config_organizationId_idx" ON "agent_config"("organizationId");

-- CreateIndex
CREATE INDEX "agent_config_hubId_idx" ON "agent_config"("hubId");

-- CreateIndex
CREATE INDEX "agent_config_slug_tenantId_idx" ON "agent_config"("slug", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "agent_config_slug_tenantId_superHubId_organizationId_hubId_key" ON "agent_config"("slug", "tenantId", "superHubId", "organizationId", "hubId");

-- CreateIndex
CREATE INDEX "agent_context_contextType_idx" ON "agent_context"("contextType");

-- CreateIndex
CREATE INDEX "agent_context_contextId_idx" ON "agent_context"("contextId");

-- CreateIndex
CREATE INDEX "agent_context_isActive_idx" ON "agent_context"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "agent_context_agentId_contextType_contextId_key" ON "agent_context"("agentId", "contextType", "contextId");

-- CreateIndex
CREATE INDEX "user_ai_control_userId_idx" ON "user_ai_control"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_ai_control_userId_feature_key" ON "user_ai_control"("userId", "feature");

-- CreateIndex
CREATE INDEX "user_usage_tenantId_idx" ON "user_usage"("tenantId");

-- CreateIndex
CREATE INDEX "user_usage_userId_idx" ON "user_usage"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_usage_userId_day_feature_key" ON "user_usage"("userId", "day", "feature");

-- CreateIndex
CREATE INDEX "page_slug_idx" ON "page"("slug");

-- CreateIndex
CREATE INDEX "page_tenantId_idx" ON "page"("tenantId");

-- CreateIndex
CREATE INDEX "page_superHubId_idx" ON "page"("superHubId");

-- CreateIndex
CREATE INDEX "page_organizationId_idx" ON "page"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "page_slug_lang_tenantId_superHubId_organizationId_key" ON "page"("slug", "lang", "tenantId", "superHubId", "organizationId");

-- CreateIndex
CREATE INDEX "page_component_pageId_idx" ON "page_component"("pageId");

-- CreateIndex
CREATE INDEX "page_component_componentId_idx" ON "page_component"("componentId");

-- CreateIndex
CREATE INDEX "layout_tenantId_idx" ON "layout"("tenantId");

-- CreateIndex
CREATE INDEX "layout_superHubId_idx" ON "layout"("superHubId");

-- CreateIndex
CREATE INDEX "layout_organizationId_idx" ON "layout"("organizationId");

-- CreateIndex
CREATE INDEX "component_tenantId_idx" ON "component"("tenantId");

-- CreateIndex
CREATE INDEX "component_superHubId_idx" ON "component"("superHubId");

-- CreateIndex
CREATE INDEX "component_organizationId_idx" ON "component"("organizationId");

-- CreateIndex
CREATE INDEX "layout_component_layoutId_idx" ON "layout_component"("layoutId");

-- CreateIndex
CREATE INDEX "layout_component_componentId_idx" ON "layout_component"("componentId");

-- CreateIndex
CREATE INDEX "translation_tenantId_pageId_idx" ON "translation"("tenantId", "pageId");

-- CreateIndex
CREATE UNIQUE INDEX "translation_tenantId_ns_key_lang_key" ON "translation"("tenantId", "ns", "key", "lang");

-- CreateIndex
CREATE UNIQUE INDEX "translation_systemId_ns_key_lang_key" ON "translation"("systemId", "ns", "key", "lang");

-- CreateIndex
CREATE INDEX "webhook_tenantId_idx" ON "webhook"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "account_category_code_key" ON "account_category"("code");

-- CreateIndex
CREATE INDEX "transaction_tenantId_hubId_date_idx" ON "transaction"("tenantId", "hubId", "date");

-- CreateIndex
CREATE INDEX "invoice_tenantId_hubId_issueDate_idx" ON "invoice"("tenantId", "hubId", "issueDate");

-- CreateIndex
CREATE INDEX "cost_center_tenantId_idx" ON "cost_center"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "cost_center_tenantId_code_key" ON "cost_center"("tenantId", "code");

-- CreateIndex
CREATE INDEX "cost_allocation_costCenterId_transactionId_idx" ON "cost_allocation"("costCenterId", "transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "product_sku_key" ON "product"("sku");

-- CreateIndex
CREATE INDEX "inventory_movement_productId_date_idx" ON "inventory_movement"("productId", "date");

-- CreateIndex
CREATE INDEX "purchase_order_tenantId_issueDate_idx" ON "purchase_order"("tenantId", "issueDate");

-- CreateIndex
CREATE INDEX "sales_order_tenantId_issueDate_idx" ON "sales_order"("tenantId", "issueDate");

-- CreateIndex
CREATE INDEX "asset_tenantId_idx" ON "asset"("tenantId");

-- CreateIndex
CREATE INDEX "payroll_run_tenantId_periodStart_periodEnd_idx" ON "payroll_run"("tenantId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "payroll_item_payrollRunId_employeeId_idx" ON "payroll_item"("payrollRunId", "employeeId");

-- CreateIndex
CREATE INDEX "performance_review_employeeId_reviewerId_agentId_idx" ON "performance_review"("employeeId", "reviewerId", "agentId");

-- CreateIndex
CREATE INDEX "time_entry_employeeId_startedAt_idx" ON "time_entry"("employeeId", "startedAt");

-- CreateIndex
CREATE INDEX "productivity_log_employeeId_date_idx" ON "productivity_log"("employeeId", "date");

-- CreateIndex
CREATE INDEX "analytics_snapshot_tenantId_date_scope_metricKey_idx" ON "analytics_snapshot"("tenantId", "date", "scope", "metricKey");

-- CreateIndex
CREATE INDEX "predictive_metric_tenantId_idx" ON "predictive_metric"("tenantId");

-- CreateIndex
CREATE INDEX "predictive_metric_projectId_idx" ON "predictive_metric"("projectId");

-- CreateIndex
CREATE INDEX "predictive_metric_hubId_idx" ON "predictive_metric"("hubId");

-- CreateIndex
CREATE INDEX "predictive_metric_superHubId_idx" ON "predictive_metric"("superHubId");

-- CreateIndex
CREATE INDEX "predictive_metric_scope_metricKey_idx" ON "predictive_metric"("scope", "metricKey");

-- CreateIndex
CREATE INDEX "leave_request_employeeId_idx" ON "leave_request"("employeeId");

-- CreateIndex
CREATE INDEX "leave_request_approvedBy_idx" ON "leave_request"("approvedBy");

-- CreateIndex
CREATE INDEX "usage_daily_tenantId_day_idx" ON "usage_daily"("tenantId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "usage_daily_tenantId_feature_day_model_key" ON "usage_daily"("tenantId", "feature", "day", "model");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_module_tenantId_key_key" ON "tenant_module"("tenantId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_tenantId_code_key" ON "warehouse"("tenantId", "code");

-- CreateIndex
CREATE INDEX "project_tenantId_idx" ON "project"("tenantId");

-- CreateIndex
CREATE INDEX "project_hubId_idx" ON "project"("hubId");

-- CreateIndex
CREATE INDEX "emotional_ai_engine_tenantId_idx" ON "emotional_ai_engine"("tenantId");

-- CreateIndex
CREATE INDEX "emotional_ai_engine_hubId_idx" ON "emotional_ai_engine"("hubId");

-- CreateIndex
CREATE UNIQUE INDEX "emotional_ai_engine_tenantId_hubId_key" ON "emotional_ai_engine"("tenantId", "hubId");

-- CreateIndex
CREATE INDEX "affinity_snapshot_userId_idx" ON "affinity_snapshot"("userId");

-- CreateIndex
CREATE INDEX "affinity_snapshot_memberId_idx" ON "affinity_snapshot"("memberId");

-- CreateIndex
CREATE INDEX "affinity_snapshot_userGlobalId_idx" ON "affinity_snapshot"("userGlobalId");

-- CreateIndex
CREATE INDEX "affinity_snapshot_memberGlobalId_idx" ON "affinity_snapshot"("memberGlobalId");

-- CreateIndex
CREATE UNIQUE INDEX "affinity_snapshot_userId_memberId_context_key" ON "affinity_snapshot"("userId", "memberId", "context");

-- CreateIndex
CREATE INDEX "affinity_interaction_userId_idx" ON "affinity_interaction"("userId");

-- CreateIndex
CREATE INDEX "affinity_interaction_memberId_idx" ON "affinity_interaction"("memberId");

-- CreateIndex
CREATE INDEX "affinity_interaction_userGlobalId_idx" ON "affinity_interaction"("userGlobalId");

-- CreateIndex
CREATE INDEX "affinity_interaction_memberGlobalId_idx" ON "affinity_interaction"("memberGlobalId");

-- CreateIndex
CREATE INDEX "insight_record_hubId_idx" ON "insight_record"("hubId");

-- CreateIndex
CREATE INDEX "insight_record_tenantId_idx" ON "insight_record"("tenantId");

-- CreateIndex
CREATE INDEX "insight_record_superHubId_idx" ON "insight_record"("superHubId");

-- CreateIndex
CREATE UNIQUE INDEX "invite_token_token_key" ON "invite_token"("token");

-- CreateIndex
CREATE INDEX "invite_token_userId_idx" ON "invite_token"("userId");

-- CreateIndex
CREATE INDEX "invite_token_tenantId_idx" ON "invite_token"("tenantId");

-- CreateIndex
CREATE INDEX "invite_token_email_idx" ON "invite_token"("email");

-- CreateIndex
CREATE INDEX "activity_log_userId_idx" ON "activity_log"("userId");

-- CreateIndex
CREATE INDEX "activity_log_action_idx" ON "activity_log"("action");

-- CreateIndex
CREATE INDEX "activity_log_entity_idx" ON "activity_log"("entity");

-- CreateIndex
CREATE INDEX "role_dynamic_hubId_idx" ON "role_dynamic"("hubId");

-- CreateIndex
CREATE INDEX "role_dynamic_tenantId_idx" ON "role_dynamic"("tenantId");

-- CreateIndex
CREATE INDEX "role_dynamic_superHubId_idx" ON "role_dynamic"("superHubId");

-- CreateIndex
CREATE INDEX "role_dynamic_planId_idx" ON "role_dynamic"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "role_dynamic_name_tenantId_key" ON "role_dynamic"("name", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "role_dynamic_name_superHubId_key" ON "role_dynamic"("name", "superHubId");

-- CreateIndex
CREATE INDEX "import_row_batchId_idx" ON "import_row"("batchId");

-- CreateIndex
CREATE INDEX "agent_model_version_modelName_idx" ON "agent_model_version"("modelName");

-- CreateIndex
CREATE UNIQUE INDEX "agent_model_version_agentId_version_key" ON "agent_model_version"("agentId", "version");

-- CreateIndex
CREATE INDEX "agent_training_sample_agentId_idx" ON "agent_training_sample"("agentId");

-- CreateIndex
CREATE INDEX "emotional_config_tenantId_idx" ON "emotional_config"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "emotional_config_tenantId_key_key" ON "emotional_config"("tenantId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "rowi_verse_slug_key" ON "rowi_verse"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "rowiverse_user_email_key" ON "rowiverse_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "rowiverse_user_userId_key" ON "rowiverse_user"("userId");

-- CreateIndex
CREATE INDEX "rowiverse_user_country_idx" ON "rowiverse_user"("country");

-- CreateIndex
CREATE INDEX "rowiverse_user_language_idx" ON "rowiverse_user"("language");

-- CreateIndex
CREATE INDEX "rowiverse_user_status_idx" ON "rowiverse_user"("status");

-- CreateIndex
CREATE UNIQUE INDEX "rowiverse_user_userId_rowiVerseId_key" ON "rowiverse_user"("userId", "rowiVerseId");

-- CreateIndex
CREATE UNIQUE INDEX "rowi_community_slug_key" ON "rowi_community"("slug");

-- CreateIndex
CREATE INDEX "rowi_community_rowiVerseId_idx" ON "rowi_community"("rowiVerseId");

-- CreateIndex
CREATE INDEX "rowi_community_superHubId_idx" ON "rowi_community"("superHubId");

-- CreateIndex
CREATE INDEX "rowi_community_hubId_idx" ON "rowi_community"("hubId");

-- CreateIndex
CREATE INDEX "rowi_community_tenantId_idx" ON "rowi_community"("tenantId");

-- CreateIndex
CREATE INDEX "rowi_community_organizationId_idx" ON "rowi_community"("organizationId");

-- CreateIndex
CREATE INDEX "rowi_community_user_communityId_idx" ON "rowi_community_user"("communityId");

-- CreateIndex
CREATE INDEX "rowi_community_user_userId_idx" ON "rowi_community_user"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "rowi_community_user_userId_communityId_key" ON "rowi_community_user"("userId", "communityId");

-- CreateIndex
CREATE INDEX "ecosystem_link_sourceType_sourceId_idx" ON "ecosystem_link"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "ecosystem_link_targetType_targetId_idx" ON "ecosystem_link"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "ecosystem_link_type_idx" ON "ecosystem_link"("type");

-- CreateIndex
CREATE INDEX "_CaseStudyToStudyGroup_B_index" ON "_CaseStudyToStudyGroup"("B");

-- CreateIndex
CREATE INDEX "_AgentKnowledge_B_index" ON "_AgentKnowledge"("B");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_primaryTenantId_fkey" FOREIGN KEY ("primaryTenantId") REFERENCES "tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_email" ADD CONSTRAINT "user_email_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permission" ADD CONSTRAINT "user_permission_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permission" ADD CONSTRAINT "user_permission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_setting" ADD CONSTRAINT "system_setting_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "system"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "super_hub" ADD CONSTRAINT "super_hub_rowiVerseId_fkey" FOREIGN KEY ("rowiVerseId") REFERENCES "rowi_verse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "super_hub" ADD CONSTRAINT "super_hub_parentHubId_fkey" FOREIGN KEY ("parentHubId") REFERENCES "super_hub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "super_hub" ADD CONSTRAINT "super_hub_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "system"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hub" ADD CONSTRAINT "hub_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hub" ADD CONSTRAINT "hub_superHubId_fkey" FOREIGN KEY ("superHubId") REFERENCES "super_hub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hub_membership" ADD CONSTRAINT "hub_membership_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "hub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hub_membership" ADD CONSTRAINT "hub_membership_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "hub_role_dynamic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hub_membership" ADD CONSTRAINT "hub_membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hub_role_dynamic" ADD CONSTRAINT "hub_role_dynamic_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "hub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hub_post" ADD CONSTRAINT "hub_post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hub_post" ADD CONSTRAINT "hub_post_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "hub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant" ADD CONSTRAINT "tenant_rowiVerseId_fkey" FOREIGN KEY ("rowiVerseId") REFERENCES "rowi_verse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant" ADD CONSTRAINT "tenant_superHubId_fkey" FOREIGN KEY ("superHubId") REFERENCES "super_hub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant" ADD CONSTRAINT "tenant_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "system"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant" ADD CONSTRAINT "tenant_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization" ADD CONSTRAINT "organization_rowiVerseId_fkey" FOREIGN KEY ("rowiVerseId") REFERENCES "rowi_verse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization" ADD CONSTRAINT "organization_superHubId_fkey" FOREIGN KEY ("superHubId") REFERENCES "super_hub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization" ADD CONSTRAINT "organization_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "hub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_to_hub" ADD CONSTRAINT "organization_to_hub_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "hub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_to_hub" ADD CONSTRAINT "organization_to_hub_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_to_tenant" ADD CONSTRAINT "organization_to_tenant_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_to_tenant" ADD CONSTRAINT "organization_to_tenant_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_membership" ADD CONSTRAINT "org_membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_membership" ADD CONSTRAINT "org_membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_member" ADD CONSTRAINT "community_member_rowiverseUserId_fkey" FOREIGN KEY ("rowiverseUserId") REFERENCES "rowiverse_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_member" ADD CONSTRAINT "community_member_claimedById_fkey" FOREIGN KEY ("claimedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_member" ADD CONSTRAINT "community_member_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "hub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_member" ADD CONSTRAINT "community_member_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_member" ADD CONSTRAINT "community_member_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_member" ADD CONSTRAINT "community_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rowi_relation" ADD CONSTRAINT "rowi_relation_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rowi_relation" ADD CONSTRAINT "rowi_relation_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rowi_relation" ADD CONSTRAINT "rowi_relation_initiatorGlobalId_fkey" FOREIGN KEY ("initiatorGlobalId") REFERENCES "rowiverse_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rowi_relation" ADD CONSTRAINT "rowi_relation_receiverGlobalId_fkey" FOREIGN KEY ("receiverGlobalId") REFERENCES "rowiverse_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rowi_feed" ADD CONSTRAINT "rowi_feed_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eq_snapshot" ADD CONSTRAINT "eq_snapshot_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "community_member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eq_snapshot" ADD CONSTRAINT "eq_snapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eq_snapshot" ADD CONSTRAINT "eq_snapshot_rowiverseUserId_fkey" FOREIGN KEY ("rowiverseUserId") REFERENCES "rowiverse_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eq_competency_snapshot" ADD CONSTRAINT "eq_competency_snapshot_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "eq_snapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eq_outcome_snapshot" ADD CONSTRAINT "eq_outcome_snapshot_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "eq_snapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eq_subfactor_snapshot" ADD CONSTRAINT "eq_subfactor_snapshot_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "eq_snapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eq_value_snapshot" ADD CONSTRAINT "eq_value_snapshot_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "eq_snapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eq_success_factor_snapshot" ADD CONSTRAINT "eq_success_factor_snapshot_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "eq_snapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "talent_snapshot" ADD CONSTRAINT "talent_snapshot_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "eq_snapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eq_mood_snapshot" ADD CONSTRAINT "eq_mood_snapshot_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "eq_snapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eq_progress" ADD CONSTRAINT "eq_progress_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "community_member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eq_progress" ADD CONSTRAINT "eq_progress_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "eq_snapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eq_progress" ADD CONSTRAINT "eq_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rowi_chat" ADD CONSTRAINT "rowi_chat_peerId_fkey" FOREIGN KEY ("peerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rowi_chat" ADD CONSTRAINT "rowi_chat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emotional_event" ADD CONSTRAINT "emotional_event_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "rowi_chat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emotional_event" ADD CONSTRAINT "emotional_event_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "community_member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emotional_event" ADD CONSTRAINT "emotional_event_progressId_fkey" FOREIGN KEY ("progressId") REFERENCES "eq_progress"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emotional_event" ADD CONSTRAINT "emotional_event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emotional_event" ADD CONSTRAINT "emotional_event_rowiverseUserId_fkey" FOREIGN KEY ("rowiverseUserId") REFERENCES "rowiverse_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch" ADD CONSTRAINT "batch_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_study" ADD CONSTRAINT "case_study_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_section" ADD CONSTRAINT "case_section_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "case_study"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_note" ADD CONSTRAINT "learning_note_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "case_study"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_note" ADD CONSTRAINT "learning_note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peer_feedback" ADD CONSTRAINT "peer_feedback_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "case_study"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peer_feedback" ADD CONSTRAINT "peer_feedback_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peer_feedback" ADD CONSTRAINT "peer_feedback_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_group_member" ADD CONSTRAINT "study_group_member_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "study_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_group_member" ADD CONSTRAINT "study_group_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_resource" ADD CONSTRAINT "knowledge_resource_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "case_study"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_resource" ADD CONSTRAINT "knowledge_resource_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "hub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_resource" ADD CONSTRAINT "knowledge_resource_superHubId_fkey" FOREIGN KEY ("superHubId") REFERENCES "super_hub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_resource" ADD CONSTRAINT "knowledge_resource_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_tag" ADD CONSTRAINT "resource_tag_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "knowledge_resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_tag" ADD CONSTRAINT "resource_tag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course" ADD CONSTRAINT "course_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson" ADD CONSTRAINT "lesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "certificate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz" ADD CONSTRAINT "quiz_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempt" ADD CONSTRAINT "quiz_attempt_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempt" ADD CONSTRAINT "quiz_attempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate" ADD CONSTRAINT "certificate_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate" ADD CONSTRAINT "certificate_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate" ADD CONSTRAINT "certificate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate" ADD CONSTRAINT "certificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_config" ADD CONSTRAINT "agent_config_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "hub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_config" ADD CONSTRAINT "agent_config_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_config" ADD CONSTRAINT "agent_config_superHubId_fkey" FOREIGN KEY ("superHubId") REFERENCES "super_hub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_config" ADD CONSTRAINT "agent_config_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "system"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_config" ADD CONSTRAINT "agent_config_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_context" ADD CONSTRAINT "agent_context_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agent_config"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_ai_control" ADD CONSTRAINT "user_ai_control_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_usage" ADD CONSTRAINT "user_usage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_usage" ADD CONSTRAINT "user_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page" ADD CONSTRAINT "page_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page" ADD CONSTRAINT "page_layoutId_fkey" FOREIGN KEY ("layoutId") REFERENCES "layout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page" ADD CONSTRAINT "page_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page" ADD CONSTRAINT "page_superHubId_fkey" FOREIGN KEY ("superHubId") REFERENCES "super_hub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page" ADD CONSTRAINT "page_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "system"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page" ADD CONSTRAINT "page_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_component" ADD CONSTRAINT "page_component_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "component"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_component" ADD CONSTRAINT "page_component_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "page"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "layout" ADD CONSTRAINT "layout_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "layout" ADD CONSTRAINT "layout_superHubId_fkey" FOREIGN KEY ("superHubId") REFERENCES "super_hub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "layout" ADD CONSTRAINT "layout_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "system"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "layout" ADD CONSTRAINT "layout_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component" ADD CONSTRAINT "component_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component" ADD CONSTRAINT "component_superHubId_fkey" FOREIGN KEY ("superHubId") REFERENCES "super_hub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component" ADD CONSTRAINT "component_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "system"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component" ADD CONSTRAINT "component_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "layout_component" ADD CONSTRAINT "layout_component_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "component"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "layout_component" ADD CONSTRAINT "layout_component_layoutId_fkey" FOREIGN KEY ("layoutId") REFERENCES "layout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "translation" ADD CONSTRAINT "translation_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "page"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "translation" ADD CONSTRAINT "translation_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "system"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "translation" ADD CONSTRAINT "translation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_connection" ADD CONSTRAINT "external_connection_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook" ADD CONSTRAINT "webhook_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_category" ADD CONSTRAINT "account_category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "account_category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_category" ADD CONSTRAINT "account_category_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "account_category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "hub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "hub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_item" ADD CONSTRAINT "invoice_item_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_item" ADD CONSTRAINT "invoice_item_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_center" ADD CONSTRAINT "cost_center_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_center_link" ADD CONSTRAINT "cost_center_link_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "cost_center"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_center_link" ADD CONSTRAINT "cost_center_link_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "hub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_allocation" ADD CONSTRAINT "cost_allocation_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "cost_center"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_allocation" ADD CONSTRAINT "cost_allocation_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movement" ADD CONSTRAINT "inventory_movement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_item" ADD CONSTRAINT "purchase_order_item_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_item" ADD CONSTRAINT "purchase_order_item_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order" ADD CONSTRAINT "sales_order_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_item" ADD CONSTRAINT "sales_order_item_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_item" ADD CONSTRAINT "sales_order_item_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "sales_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset" ADD CONSTRAINT "asset_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset" ADD CONSTRAINT "asset_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_run" ADD CONSTRAINT "payroll_run_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_item" ADD CONSTRAINT "payroll_item_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_item" ADD CONSTRAINT "payroll_item_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "payroll_run"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_profile" ADD CONSTRAINT "employee_profile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_profile" ADD CONSTRAINT "employee_profile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_profile" ADD CONSTRAINT "employee_profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_review" ADD CONSTRAINT "performance_review_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agent_config"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_review" ADD CONSTRAINT "performance_review_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_review" ADD CONSTRAINT "performance_review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entry" ADD CONSTRAINT "time_entry_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productivity_log" ADD CONSTRAINT "productivity_log_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_snapshot" ADD CONSTRAINT "analytics_snapshot_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictive_metric" ADD CONSTRAINT "predictive_metric_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "hub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictive_metric" ADD CONSTRAINT "predictive_metric_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictive_metric" ADD CONSTRAINT "predictive_metric_superHubId_fkey" FOREIGN KEY ("superHubId") REFERENCES "super_hub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictive_metric" ADD CONSTRAINT "predictive_metric_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_request" ADD CONSTRAINT "leave_request_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_request" ADD CONSTRAINT "leave_request_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout" ADD CONSTRAINT "payout_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout" ADD CONSTRAINT "payout_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout" ADD CONSTRAINT "payout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_daily" ADD CONSTRAINT "usage_daily_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_module" ADD CONSTRAINT "tenant_module_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse" ADD CONSTRAINT "warehouse_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "hub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emotional_ai_engine" ADD CONSTRAINT "emotional_ai_engine_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "hub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emotional_ai_engine" ADD CONSTRAINT "emotional_ai_engine_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affinity_snapshot" ADD CONSTRAINT "affinity_snapshot_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "community_member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affinity_snapshot" ADD CONSTRAINT "affinity_snapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affinity_snapshot" ADD CONSTRAINT "affinity_snapshot_userGlobalId_fkey" FOREIGN KEY ("userGlobalId") REFERENCES "rowiverse_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affinity_snapshot" ADD CONSTRAINT "affinity_snapshot_memberGlobalId_fkey" FOREIGN KEY ("memberGlobalId") REFERENCES "rowiverse_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affinity_interaction" ADD CONSTRAINT "affinity_interaction_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "community_member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affinity_interaction" ADD CONSTRAINT "affinity_interaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affinity_interaction" ADD CONSTRAINT "affinity_interaction_userGlobalId_fkey" FOREIGN KEY ("userGlobalId") REFERENCES "rowiverse_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affinity_interaction" ADD CONSTRAINT "affinity_interaction_memberGlobalId_fkey" FOREIGN KEY ("memberGlobalId") REFERENCES "rowiverse_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insight_record" ADD CONSTRAINT "insight_record_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "hub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insight_record" ADD CONSTRAINT "insight_record_superHubId_fkey" FOREIGN KEY ("superHubId") REFERENCES "super_hub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insight_record" ADD CONSTRAINT "insight_record_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "csv_upload" ADD CONSTRAINT "csv_upload_userEmail_fkey" FOREIGN KEY ("userEmail") REFERENCES "user"("email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_token" ADD CONSTRAINT "invite_token_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_token" ADD CONSTRAINT "invite_token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_dynamic" ADD CONSTRAINT "role_dynamic_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "hub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_dynamic" ADD CONSTRAINT "role_dynamic_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_dynamic" ADD CONSTRAINT "role_dynamic_superHubId_fkey" FOREIGN KEY ("superHubId") REFERENCES "super_hub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_dynamic" ADD CONSTRAINT "role_dynamic_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_row" ADD CONSTRAINT "import_row_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "import_batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_model_version" ADD CONSTRAINT "agent_model_version_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agent_config"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_training_sample" ADD CONSTRAINT "agent_training_sample_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agent_config"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emotional_config" ADD CONSTRAINT "emotional_config_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rowi_verse" ADD CONSTRAINT "rowi_verse_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rowiverse_user" ADD CONSTRAINT "rowiverse_user_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rowiverse_user" ADD CONSTRAINT "rowiverse_user_rowiVerseId_fkey" FOREIGN KEY ("rowiVerseId") REFERENCES "rowi_verse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rowi_community" ADD CONSTRAINT "fk_rowiCommunity_rowiVerseId" FOREIGN KEY ("rowiVerseId") REFERENCES "rowi_verse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rowi_community" ADD CONSTRAINT "fk_rowiCommunity_superHubId" FOREIGN KEY ("superHubId") REFERENCES "super_hub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rowi_community" ADD CONSTRAINT "fk_rowiCommunity_hubId" FOREIGN KEY ("hubId") REFERENCES "hub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rowi_community" ADD CONSTRAINT "fk_rowiCommunity_tenantId" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rowi_community" ADD CONSTRAINT "fk_rowiCommunity_organizationId" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rowi_community" ADD CONSTRAINT "rowi_community_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rowi_community" ADD CONSTRAINT "rowi_community_superId_fkey" FOREIGN KEY ("superId") REFERENCES "rowi_community"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rowi_community" ADD CONSTRAINT "rowi_community_rowiVerseId_fkey" FOREIGN KEY ("rowiVerseId") REFERENCES "rowi_verse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rowi_community_user" ADD CONSTRAINT "rowi_community_user_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rowi_community_user" ADD CONSTRAINT "rowi_community_user_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "rowi_community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rowi_community_user" ADD CONSTRAINT "rowi_community_user_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rowi_community_user" ADD CONSTRAINT "rowi_community_user_rowiverseUserId_fkey" FOREIGN KEY ("rowiverseUserId") REFERENCES "rowiverse_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rowi_community_post" ADD CONSTRAINT "rowi_community_post_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "rowi_community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rowi_community_post" ADD CONSTRAINT "rowi_community_post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_batch" ADD CONSTRAINT "community_batch_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "rowi_community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecosystem_link" ADD CONSTRAINT "ecosystem_link_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CaseStudyToStudyGroup" ADD CONSTRAINT "_CaseStudyToStudyGroup_A_fkey" FOREIGN KEY ("A") REFERENCES "case_study"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CaseStudyToStudyGroup" ADD CONSTRAINT "_CaseStudyToStudyGroup_B_fkey" FOREIGN KEY ("B") REFERENCES "study_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AgentKnowledge" ADD CONSTRAINT "_AgentKnowledge_A_fkey" FOREIGN KEY ("A") REFERENCES "agent_config"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AgentKnowledge" ADD CONSTRAINT "_AgentKnowledge_B_fkey" FOREIGN KEY ("B") REFERENCES "knowledge_resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
