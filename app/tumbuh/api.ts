import type { ApiErrorResponse } from "./types";
import {
  getSupabaseAccessToken,
  isSupabaseAuthConfigured,
} from "../../lib/supabase-browser";

function getDevelopmentAuthHeaders() {
  if (process.env.NODE_ENV === "production") {
    return {};
  }

  if (isSupabaseAuthConfigured()) {
    return {};
  }

  const authUserId =
    process.env.NEXT_PUBLIC_DEV_AUTH_USER_ID?.trim() || "dev-user-1";
  const email =
    process.env.NEXT_PUBLIC_DEV_AUTH_EMAIL?.trim() || "dev@example.com";
  const displayName =
    process.env.NEXT_PUBLIC_DEV_AUTH_NAME?.trim() || "Guardian Dev";

  return {
    "x-dev-auth-user-id": authUserId,
    "x-dev-auth-email": email,
    "x-dev-auth-name": displayName,
  };
}

export function appendDevelopmentAuthQuery(url: string | null | undefined) {
  if (!url || process.env.NODE_ENV === "production") {
    return url ?? null;
  }

  const authUserId =
    process.env.NEXT_PUBLIC_DEV_AUTH_USER_ID?.trim() || "dev-user-1";
  const email =
    process.env.NEXT_PUBLIC_DEV_AUTH_EMAIL?.trim() || "dev@example.com";
  const displayName =
    process.env.NEXT_PUBLIC_DEV_AUTH_NAME?.trim() || "Guardian Dev";

  const isAbsolute = /^https?:\/\//i.test(url);
  const normalizedBase = isAbsolute
    ? url
    : typeof window !== "undefined"
      ? new URL(url, window.location.origin).toString()
      : `http://localhost${url}`;

  const nextUrl = new URL(normalizedBase);
  nextUrl.searchParams.set("devAuthUserId", authUserId);
  nextUrl.searchParams.set("devAuthEmail", email);
  nextUrl.searchParams.set("devAuthName", displayName);

  if (isAbsolute) {
    return nextUrl.toString();
  }

  return `${nextUrl.pathname}${nextUrl.search}`;
}

export async function apiRequest<T>(input: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");

  if (isSupabaseAuthConfigured()) {
    const token = await getSupabaseAccessToken();
    if (token && !headers.has("authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  Object.entries(getDevelopmentAuthHeaders()).forEach(([key, value]) => {
    if (!headers.has(key) && value) {
      headers.set(key, value);
    }
  });

  const response = await fetch(input, {
    ...init,
    headers,
    cache: "no-store",
  });

  const payload = (await response.json()) as { data?: T } & ApiErrorResponse;

  if (!response.ok) {
    const message = payload.error?.message || "Request failed";
    const error = new Error(message) as Error & {
      code?: string;
      status?: number;
      details?: unknown;
    };
    error.code = payload.error?.code;
    error.status = response.status;
    error.details = payload.error?.details;
    throw error;
  }

  return payload.data as T;
}

export async function uploadBinary(
  uploadUrl: string,
  file: File,
  uploadMethod: "PUT",
  uploadHeaders: Record<string, string>,
) {
  const response = await fetch(uploadUrl, {
    method: uploadMethod,
    headers: uploadHeaders,
    body: file,
    cache: "no-store",
  });

  const payload = (await response.json()) as { error?: ApiErrorResponse["error"] };

  if (!response.ok) {
    const error = new Error(payload.error?.message || "Upload failed") as Error & {
      code?: string;
      status?: number;
    };
    error.code = payload.error?.code;
    error.status = response.status;
    throw error;
  }
}
