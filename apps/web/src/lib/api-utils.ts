import { NextResponse } from "next/server";
import { ZodError } from "zod";

interface RateLimitStore {
  [ip: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitCache: RateLimitStore = {};

/**
 * Simple in-memory rate limiter per IP address
 */
export function checkRateLimit(
  ip: string,
  limit: number = 60,
  windowMs: number = 60000
): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitCache[ip];

  if (!entry || now > entry.resetTime) {
    rateLimitCache[ip] = {
      count: 1,
      resetTime: now + windowMs,
    };
    return { success: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 };
  }

  entry.count += 1;
  return { success: true, remaining: limit - entry.count };
}

export function jsonSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(
  message: string,
  codeOrStatus: string | number = "BAD_REQUEST",
  statusOrFields?: number | unknown,
  fields?: Record<string, string[]>
) {
  let code = "BAD_REQUEST";
  let status = 400;
  let fieldErrors = fields;

  if (typeof codeOrStatus === "number") {
    status = codeOrStatus;
    code =
      status === 404
        ? "NOT_FOUND"
        : status === 403
        ? "FORBIDDEN"
        : status === 401
        ? "UNAUTHORIZED"
        : "ERROR";
    if (typeof statusOrFields === "object" && statusOrFields !== null) {
      fieldErrors = statusOrFields as Record<string, string[]>;
    }
  } else {
    code = codeOrStatus;
    if (typeof statusOrFields === "number") {
      status = statusOrFields;
    }
  }

  return NextResponse.json(
    {
      error: {
        code,
        message,
        fields: fieldErrors,
      },
    },
    { status }
  );
}

export function handleApiError(err: unknown) {
  if (err instanceof ZodError) {
    const fields: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const path = issue.path.join(".");
      if (!fields[path]) fields[path] = [];
      fields[path].push(issue.message);
    }
    return jsonError("Validation failed", "VALIDATION_ERROR", 400, fields);
  }

  if (err instanceof Error) {
    return jsonError(err.message, "OPERATION_ERROR", 400);
  }

  return jsonError("Internal server error", "INTERNAL_SERVER_ERROR", 500);
}
