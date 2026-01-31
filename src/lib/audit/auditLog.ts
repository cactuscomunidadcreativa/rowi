/**
 * =========================================================
 * 📝 Audit Log Helper
 * =========================================================
 * Helper para registrar acciones de auditoría en el sistema.
 * Usa el modelo ActivityLog de Prisma.
 */

import { prisma } from "@/core/prisma";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

export type AuditAction =
  | "PLAN_CREATED"
  | "PLAN_UPDATED"
  | "PLAN_DELETED"
  | "PRICE_UPDATED"
  | "STRIPE_SYNC"
  | "CONFIG_UPDATED"
  | "USER_ROLE_CHANGED"
  | "SETTINGS_UPDATED"
  | "ADMIN_ACTION"
  // Security events
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "PASSWORD_CHANGED"
  | "PASSWORD_RESET_REQUESTED"
  | "PERMISSION_GRANTED"
  | "PERMISSION_REVOKED"
  | "RATE_LIMIT_EXCEEDED"
  | "CSRF_BLOCKED"
  | "UNAUTHORIZED_ACCESS"
  | "SUSPICIOUS_ACTIVITY"
  // Data events
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_DELETED"
  | "TENANT_CREATED"
  | "TENANT_UPDATED"
  | "TENANT_DELETED"
  | "HUB_CREATED"
  | "HUB_UPDATED"
  | "HUB_DELETED";

interface AuditLogParams {
  userId?: string | null;
  action: AuditAction | string;
  entity?: string;
  targetId?: string;
  details?: Record<string, any>;
  req?: NextRequest;
}

/**
 * Registra una acción de auditoría en la base de datos
 */
export async function logAuditAction({
  userId,
  action,
  entity,
  targetId,
  details,
  req,
}: AuditLogParams): Promise<void> {
  try {
    // Obtener información del request si está disponible
    const ipAddress = req
      ? req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        req.headers.get("x-real-ip") ||
        "unknown"
      : undefined;
    const userAgent = req?.headers.get("user-agent") || undefined;

    await prisma.activityLog.create({
      data: {
        userId: userId || null,
        action,
        entity: entity || null,
        targetId: targetId || null,
        details: details ? (details as Prisma.InputJsonValue) : Prisma.JsonNull,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });

    console.log(`📝 Audit: ${action} by ${userId || "system"} on ${entity}:${targetId}`);
  } catch (error) {
    // No lanzar error para no interrumpir la operación principal
    console.error("❌ Error registrando audit log:", error);
  }
}

/**
 * Helper para registrar cambios en planes de suscripción
 */
export async function logPlanChange(
  userId: string | null,
  planId: string,
  action: "PLAN_CREATED" | "PLAN_UPDATED" | "PLAN_DELETED",
  changes: Record<string, any>,
  req?: NextRequest
): Promise<void> {
  await logAuditAction({
    userId,
    action,
    entity: "SubscriptionPlan",
    targetId: planId,
    details: {
      ...changes,
      timestamp: new Date().toISOString(),
    },
    req,
  });
}

/**
 * Helper para registrar sincronización con Stripe
 */
export async function logStripeSync(
  userId: string | null,
  syncType: "products" | "prices" | "full",
  result: { created: number; updated: number; errors?: number },
  req?: NextRequest
): Promise<void> {
  await logAuditAction({
    userId,
    action: "STRIPE_SYNC",
    entity: "Stripe",
    details: {
      syncType,
      ...result,
      timestamp: new Date().toISOString(),
    },
    req,
  });
}

/**
 * Helper para registrar cambios en configuración del sistema
 */
export async function logConfigChange(
  userId: string | null,
  configKey: string,
  action: "created" | "updated" | "deleted",
  req?: NextRequest
): Promise<void> {
  await logAuditAction({
    userId,
    action: "CONFIG_UPDATED",
    entity: "SystemConfig",
    targetId: configKey,
    details: {
      action,
      timestamp: new Date().toISOString(),
    },
    req,
  });
}

// =========================================================
// Security Audit Helpers
// =========================================================

/**
 * Registra un evento de seguridad
 */
export async function logSecurityEvent(
  action: AuditAction,
  details: {
    userId?: string | null;
    email?: string;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
    path?: string;
    extra?: Record<string, unknown>;
  }
): Promise<void> {
  const severity = getSeverity(action);

  // Log a consola con nivel apropiado
  const logMessage = `🔐 [${severity}] ${action}: ${details.reason || "No reason"} - IP: ${details.ipAddress || "unknown"}`;
  if (severity === "HIGH") {
    console.error(logMessage);
  } else if (severity === "MEDIUM") {
    console.warn(logMessage);
  } else {
    console.log(logMessage);
  }

  await logAuditAction({
    userId: details.userId,
    action,
    entity: "Security",
    details: {
      email: details.email,
      reason: details.reason,
      path: details.path,
      severity,
      ...details.extra,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Determina la severidad de una acción de auditoría
 */
function getSeverity(action: AuditAction): "LOW" | "MEDIUM" | "HIGH" {
  const highSeverity: AuditAction[] = [
    "UNAUTHORIZED_ACCESS",
    "SUSPICIOUS_ACTIVITY",
    "CSRF_BLOCKED",
    "USER_DELETED",
    "TENANT_DELETED",
    "HUB_DELETED",
    "PERMISSION_REVOKED",
  ];

  const mediumSeverity: AuditAction[] = [
    "LOGIN_FAILED",
    "RATE_LIMIT_EXCEEDED",
    "PASSWORD_CHANGED",
    "PASSWORD_RESET_REQUESTED",
    "PERMISSION_GRANTED",
    "CONFIG_UPDATED",
    "USER_ROLE_CHANGED",
  ];

  if (highSeverity.includes(action)) return "HIGH";
  if (mediumSeverity.includes(action)) return "MEDIUM";
  return "LOW";
}

/**
 * Helper para registrar accesos no autorizados
 */
export async function logUnauthorizedAccess(
  path: string,
  reason: string,
  req?: NextRequest
): Promise<void> {
  const ipAddress = req
    ? req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "unknown"
    : "unknown";

  await logSecurityEvent("UNAUTHORIZED_ACCESS", {
    reason,
    path,
    ipAddress,
    userAgent: req?.headers.get("user-agent") || undefined,
  });
}

/**
 * Helper para registrar cambios de usuario
 */
export async function logUserChange(
  action: "USER_CREATED" | "USER_UPDATED" | "USER_DELETED",
  performedBy: string | null,
  targetUserId: string,
  changes?: Record<string, unknown>,
  req?: NextRequest
): Promise<void> {
  await logAuditAction({
    userId: performedBy,
    action,
    entity: "User",
    targetId: targetUserId,
    details: {
      changes,
      timestamp: new Date().toISOString(),
    },
    req,
  });
}
