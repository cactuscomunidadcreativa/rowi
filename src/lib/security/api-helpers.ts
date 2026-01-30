/**
 * API route helpers with Next.js dependencies
 * Use these in API routes for request/response handling
 */

import { z } from "zod";
import { NextResponse } from "next/server";

/**
 * Validate request body against a Zod schema
 * Returns parsed data or error response
 */
export async function validateBody<T extends z.ZodSchema>(
  request: Request,
  schema: T
): Promise<
  | { success: true; data: z.infer<T> }
  | { success: false; response: NextResponse }
> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return {
        success: false,
        response: NextResponse.json(
          {
            ok: false,
            error: "Validation error",
            details: result.error.flatten().fieldErrors,
          },
          { status: 400 }
        ),
      };
    }

    return { success: true, data: result.data };
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        { ok: false, error: "Invalid JSON body" },
        { status: 400 }
      ),
    };
  }
}

/**
 * Create a standardized validation error response
 */
export function validationErrorResponse(
  message: string,
  details?: Record<string, string[]>
): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      error: message,
      details,
    },
    { status: 400 }
  );
}

/**
 * Create a standardized rate limit error response
 */
export function rateLimitErrorResponse(retryAfter: number = 60): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      error: "Too many requests. Please try again later.",
    },
    {
      status: 429,
      headers: {
        "Retry-After": retryAfter.toString(),
      },
    }
  );
}

/**
 * Create a standardized unauthorized error response
 */
export function unauthorizedResponse(message: string = "Unauthorized"): NextResponse {
  return NextResponse.json(
    { ok: false, error: message },
    { status: 401 }
  );
}

/**
 * Create a standardized forbidden error response
 */
export function forbiddenResponse(message: string = "Forbidden"): NextResponse {
  return NextResponse.json(
    { ok: false, error: message },
    { status: 403 }
  );
}

/**
 * Create a standardized not found error response
 */
export function notFoundResponse(message: string = "Not found"): NextResponse {
  return NextResponse.json(
    { ok: false, error: message },
    { status: 404 }
  );
}

/**
 * Create a standardized internal error response
 */
export function internalErrorResponse(message: string = "Internal server error"): NextResponse {
  return NextResponse.json(
    { ok: false, error: message },
    { status: 500 }
  );
}
