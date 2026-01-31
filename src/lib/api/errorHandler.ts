/**
 * =========================================================
 * 🚨 Error Handler — Manejo centralizado de errores en APIs
 * =========================================================
 *
 * Este módulo proporciona funciones para manejar errores de forma
 * consistente en todas las APIs, evitando exposición de información
 * sensible en producción.
 *
 * USO:
 * ```ts
 * import { handleApiError, ApiError } from "@/lib/api/errorHandler";
 *
 * export async function GET(req: NextRequest) {
 *   try {
 *     // ... lógica
 *   } catch (error) {
 *     return handleApiError(error, "GET /api/endpoint");
 *   }
 * }
 * ```
 */

import { NextResponse } from "next/server";

// =========================================================
// Types
// =========================================================

export interface ApiErrorResponse {
  ok: false;
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface ApiSuccessResponse<T = unknown> {
  ok: true;
  data?: T;
  message?: string;
}

// =========================================================
// Custom API Error Class
// =========================================================

/**
 * Error personalizado para APIs con código de estado HTTP
 */
export class ApiError extends Error {
  statusCode: number;
  code?: string;
  details?: Record<string, unknown>;
  isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    options?: {
      code?: string;
      details?: Record<string, unknown>;
      isOperational?: boolean;
    }
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = options?.code;
    this.details = options?.details;
    this.isOperational = options?.isOperational ?? true;

    // Mantener el stack trace correcto
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: Record<string, unknown>): ApiError {
    return new ApiError(message, 400, { code: "BAD_REQUEST", details });
  }

  static unauthorized(message: string = "No autorizado"): ApiError {
    return new ApiError(message, 401, { code: "UNAUTHORIZED" });
  }

  static forbidden(message: string = "Acceso denegado"): ApiError {
    return new ApiError(message, 403, { code: "FORBIDDEN" });
  }

  static notFound(message: string = "Recurso no encontrado"): ApiError {
    return new ApiError(message, 404, { code: "NOT_FOUND" });
  }

  static conflict(message: string): ApiError {
    return new ApiError(message, 409, { code: "CONFLICT" });
  }

  static tooManyRequests(retryAfter?: number): ApiError {
    return new ApiError(
      "Demasiadas solicitudes. Intenta de nuevo más tarde.",
      429,
      {
        code: "RATE_LIMITED",
        details: retryAfter ? { retryAfter } : undefined,
      }
    );
  }

  static internal(message: string = "Error interno del servidor"): ApiError {
    return new ApiError(message, 500, { code: "INTERNAL_ERROR", isOperational: false });
  }
}

// =========================================================
// Error Messages (Safe for production)
// =========================================================

const SAFE_ERROR_MESSAGES: Record<string, string> = {
  // Prisma errors
  P2002: "Ya existe un registro con estos datos",
  P2003: "Error de referencia: el registro relacionado no existe",
  P2025: "Registro no encontrado",
  // Generic
  ECONNREFUSED: "No se pudo conectar al servidor",
  ETIMEDOUT: "La conexión tardó demasiado",
};

/**
 * Obtiene un mensaje de error seguro para producción
 */
function getSafeErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    // Verificar si es un error de Prisma conocido
    const prismaCode = (error as any).code;
    if (prismaCode && SAFE_ERROR_MESSAGES[prismaCode]) {
      return SAFE_ERROR_MESSAGES[prismaCode];
    }

    // En desarrollo, mostrar el mensaje real
    if (process.env.NODE_ENV === "development") {
      return error.message;
    }
  }

  // Mensaje genérico para producción
  return "Ha ocurrido un error. Intenta de nuevo más tarde.";
}

/**
 * Obtiene el código de estado HTTP apropiado
 */
function getStatusCode(error: unknown): number {
  if (error instanceof ApiError) {
    return error.statusCode;
  }

  // Errores de Prisma
  const prismaCode = (error as any)?.code;
  if (prismaCode === "P2002") return 409; // Conflicto (duplicado)
  if (prismaCode === "P2025") return 404; // No encontrado

  // Errores de validación
  if ((error as any)?.name === "ZodError") return 400;

  return 500;
}

// =========================================================
// Main Error Handler
// =========================================================

/**
 * Maneja errores de API de forma consistente
 *
 * @param error - El error capturado
 * @param context - Contexto para logging (ej: "GET /api/users")
 * @param options - Opciones adicionales
 * @returns NextResponse con el error formateado
 */
export function handleApiError(
  error: unknown,
  context?: string,
  options?: {
    logError?: boolean;
    includeDetails?: boolean;
  }
): NextResponse<ApiErrorResponse> {
  const { logError = true, includeDetails = false } = options || {};

  const statusCode = getStatusCode(error);
  const message = getSafeErrorMessage(error);

  // Logging (solo en servidor)
  if (logError) {
    const logPrefix = context ? `❌ Error en ${context}:` : "❌ API Error:";

    if (error instanceof ApiError && error.isOperational) {
      // Errores operacionales (esperados) - log simple
      console.warn(logPrefix, message);
    } else {
      // Errores inesperados - log completo
      console.error(logPrefix, error);
    }
  }

  // Construir respuesta
  const response: ApiErrorResponse = {
    ok: false,
    error: message,
  };

  // Agregar código de error si existe
  if (error instanceof ApiError && error.code) {
    response.code = error.code;
  }

  // Agregar detalles solo si se solicita y es seguro
  if (includeDetails && error instanceof ApiError && error.details) {
    response.details = error.details;
  }

  // En desarrollo, agregar stack trace
  if (process.env.NODE_ENV === "development" && error instanceof Error) {
    (response as any).stack = error.stack;
  }

  return NextResponse.json(response, { status: statusCode });
}

// =========================================================
// Success Response Helpers
// =========================================================

/**
 * Crea una respuesta exitosa estandarizada
 */
export function successResponse<T>(
  data?: T,
  options?: {
    message?: string;
    status?: number;
    headers?: Record<string, string>;
  }
): NextResponse<ApiSuccessResponse<T>> {
  const { message, status = 200, headers } = options || {};

  const response: ApiSuccessResponse<T> = {
    ok: true,
    ...(data !== undefined && { data }),
    ...(message && { message }),
  };

  return NextResponse.json(response, {
    status,
    headers: headers ? new Headers(headers) : undefined,
  });
}

/**
 * Crea una respuesta de creación exitosa (201)
 */
export function createdResponse<T>(
  data: T,
  message?: string
): NextResponse<ApiSuccessResponse<T>> {
  return successResponse(data, { message: message || "Creado exitosamente", status: 201 });
}

/**
 * Crea una respuesta de eliminación exitosa (204 o 200)
 */
export function deletedResponse(message?: string): NextResponse<ApiSuccessResponse> {
  return successResponse(undefined, { message: message || "Eliminado exitosamente" });
}

// =========================================================
// Validation Helpers
// =========================================================

/**
 * Valida que los campos requeridos estén presentes
 */
export function validateRequired(
  data: Record<string, unknown>,
  fields: string[]
): { valid: true } | { valid: false; error: NextResponse<ApiErrorResponse> } {
  const missing = fields.filter((field) => {
    const value = data[field];
    return value === undefined || value === null || value === "";
  });

  if (missing.length > 0) {
    return {
      valid: false,
      error: NextResponse.json(
        {
          ok: false,
          error: `Campos requeridos faltantes: ${missing.join(", ")}`,
          code: "VALIDATION_ERROR",
          details: { missingFields: missing },
        },
        { status: 400 }
      ),
    };
  }

  return { valid: true };
}

/**
 * Valida que un ID sea un string válido
 */
export function validateId(
  id: unknown,
  fieldName: string = "id"
): { valid: true; id: string } | { valid: false; error: NextResponse<ApiErrorResponse> } {
  if (!id || typeof id !== "string" || id.trim() === "") {
    return {
      valid: false,
      error: NextResponse.json(
        {
          ok: false,
          error: `${fieldName} inválido o faltante`,
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      ),
    };
  }

  return { valid: true, id: id.trim() };
}

/**
 * Valida un email
 */
export function validateEmail(
  email: unknown
): { valid: true; email: string } | { valid: false; error: NextResponse<ApiErrorResponse> } {
  if (!email || typeof email !== "string") {
    return {
      valid: false,
      error: NextResponse.json(
        { ok: false, error: "Email requerido", code: "VALIDATION_ERROR" },
        { status: 400 }
      ),
    };
  }

  const normalized = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(normalized)) {
    return {
      valid: false,
      error: NextResponse.json(
        { ok: false, error: "Email inválido", code: "VALIDATION_ERROR" },
        { status: 400 }
      ),
    };
  }

  return { valid: true, email: normalized };
}
