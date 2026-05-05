import { NextRequest } from "next/server";
import { z, ZodError, type ZodType } from "zod";

import { AppError } from "./errors";

function formatZodIssues(error: ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));
}

function toValidationError(error: ZodError) {
  return new AppError("BAD_REQUEST", "Request validation failed", 400, {
    details: formatZodIssues(error),
  });
}

export async function parseJsonBody<T>(request: NextRequest, schema: ZodType<T>) {
  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    throw new AppError("BAD_REQUEST", "Request body must be valid JSON", 400, {
      cause: error,
    });
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    throw toValidationError(result.error);
  }

  return result.data;
}

export function parseParams<T>(value: unknown, schema: ZodType<T>) {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw toValidationError(result.error);
  }

  return result.data;
}

export function parseQuery<T>(request: NextRequest, schema: ZodType<T>) {
  const query = Object.fromEntries(request.nextUrl.searchParams.entries());
  const result = schema.safeParse(query);

  if (!result.success) {
    throw toValidationError(result.error);
  }

  return result.data;
}

export { z };
