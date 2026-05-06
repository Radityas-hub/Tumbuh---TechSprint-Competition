export type AppErrorOptions = {
  cause?: unknown;
  details?: unknown;
};

export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;
  override readonly cause?: unknown;

  constructor(code: string, message: string, status: number, options: AppErrorOptions = {}) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = options.details;
    this.cause = options.cause;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export const unauthorized = (message = "Authentication required") =>
  new AppError("UNAUTHORIZED", message, 401);

export const notFound = (message = "Resource not found") =>
  new AppError("NOT_FOUND", message, 404);

export const internalServerError = (message = "Internal server error", cause?: unknown) =>
  new AppError("INTERNAL_SERVER_ERROR", message, 500, { cause });
