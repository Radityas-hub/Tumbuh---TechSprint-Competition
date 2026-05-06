import { NextResponse } from "next/server";

import { AppError, isAppError } from "./errors";

type SuccessBody<T> = {
  data: T;
};

type ErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<SuccessBody<T>>({ data }, init);
}

export function created<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<SuccessBody<T>>({ data }, { ...init, status: 201 });
}

export function errorResponse(error: AppError) {
  const body: ErrorBody = {
    error: {
      code: error.code,
      message: error.message,
      ...(error.details !== undefined ? { details: error.details } : {}),
    },
  };

  return NextResponse.json(body, { status: error.status });
}

export function handleRouteError(error: unknown) {
  if (isAppError(error)) {
    if (error.status >= 500) {
      console.error(`[api:${error.code}]`, error.message, error.cause ?? error.details ?? error);
    }

    return errorResponse(error);
  }

  console.error("[api:UNHANDLED_ERROR]", error);
  return errorResponse(new AppError("INTERNAL_SERVER_ERROR", "Internal server error", 500));
}
