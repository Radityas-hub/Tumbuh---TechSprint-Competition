import { NextRequest } from "next/server";

import { Guardian, Prisma } from "../../generated/prisma/client";
import { prisma } from "../prisma";
import { AppError, internalServerError, unauthorized } from "../api/errors";

type AuthenticatedUser = {
  authUserId: string;
  email: string;
  displayName: string | null;
};

type SupabaseUserResponse = {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    display_name?: string;
  };
};

const devAuthHeaders = {
  userId: "x-dev-auth-user-id",
  email: "x-dev-auth-email",
  name: "x-dev-auth-name",
};

function getSupabaseUrl() {
  return process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
}

function getSupabaseAnonKey() {
  return process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

function getDevelopmentUser(request: NextRequest): AuthenticatedUser | null {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const authUserId = request.headers.get(devAuthHeaders.userId)?.trim();
  const email = request.headers.get(devAuthHeaders.email)?.trim();

  if (!authUserId || !email) {
    return null;
  }

  return {
    authUserId,
    email,
    displayName: request.headers.get(devAuthHeaders.name)?.trim() || null,
  };
}

async function getSupabaseUserFromAccessToken(accessToken: string): Promise<AuthenticatedUser | null> {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw internalServerError(
      "Supabase auth is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new AppError("AUTH_PROVIDER_ERROR", "Failed to validate Supabase session", 502, {
      details: { status: response.status },
    });
  }

  const user = (await response.json()) as SupabaseUserResponse;

  if (!user.id || !user.email) {
    throw new AppError("AUTH_PROVIDER_ERROR", "Supabase session payload is incomplete", 502);
  }

  return {
    authUserId: user.id,
    email: user.email,
    displayName: user.user_metadata?.display_name ?? user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
  };
}

export async function getAuthenticatedUser(request: NextRequest) {
  const developmentUser = getDevelopmentUser(request);
  if (developmentUser) {
    return developmentUser;
  }

  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return null;
  }

  return getSupabaseUserFromAccessToken(accessToken);
}

export async function getOrCreateGuardianForRequest(request: NextRequest): Promise<Guardian> {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    throw unauthorized();
  }

  return prisma.guardian.upsert({
    where: {
      authUserId: user.authUserId,
    },
    update: {
      email: user.email,
      ...(user.displayName ? { displayName: user.displayName } : {}),
      deletedAt: null,
    },
    create: {
      authUserId: user.authUserId,
      email: user.email,
      displayName: user.displayName,
    },
  });
}

export async function updateGuardianProfile(guardianId: string, data: Prisma.GuardianUpdateInput) {
  return prisma.guardian.update({
    where: {
      id: guardianId,
    },
    data,
  });
}
