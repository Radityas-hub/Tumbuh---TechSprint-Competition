import { NextRequest } from "next/server";

import { handleRouteError, ok } from "../../../lib/api/response";
import { parseJsonBody, z } from "../../../lib/api/validation";
import { getOrCreateGuardianForRequest, updateGuardianProfile } from "../../../lib/auth/session";
import { prisma } from "../../../lib/prisma";

const patchMeSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "displayName cannot be empty")
    .max(100, "displayName must be 100 characters or less"),
});

async function buildMeResponse(guardianId: string) {
  const [guardian, childStats] = await Promise.all([
    prisma.guardian.findUniqueOrThrow({
      where: { id: guardianId },
      select: {
        id: true,
        authUserId: true,
        email: true,
        displayName: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.child.aggregate({
      where: {
        guardianId,
        deletedAt: null,
      },
      _count: {
        id: true,
        onboardingCompletedAt: true,
      },
    }),
  ]);

  return {
    guardian,
    onboarding: {
      childCount: childStats._count.id,
      completedChildCount: childStats._count.onboardingCompletedAt,
      hasChildren: childStats._count.id > 0,
      hasCompletedOnboarding: childStats._count.onboardingCompletedAt > 0,
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const guardian = await getOrCreateGuardianForRequest(request);
    return ok(await buildMeResponse(guardian.id));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const guardian = await getOrCreateGuardianForRequest(request);
    const body = await parseJsonBody(request, patchMeSchema);

    await updateGuardianProfile(guardian.id, {
      displayName: body.displayName,
    });

    return ok(await buildMeResponse(guardian.id));
  } catch (error) {
    return handleRouteError(error);
  }
}
