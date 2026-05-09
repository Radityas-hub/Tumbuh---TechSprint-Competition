import { NextRequest } from "next/server";
import { unstable_noStore as noStore } from "next/cache";

import { getOrCreateGuardianForRequest } from "../../../../../../lib/auth/session";
import { createAuditLog } from "../../../../../../lib/audit";
import { markChildOnboardingComplete } from "../../../../../../lib/children";
import { seedOnboardingConsents } from "../../../../../../lib/consents";
import { scheduleInsightRefreshForChild } from "../../../../../../lib/insights";
import { ensureInitialRoadmapForChild } from "../../../../../../lib/roadmap";
import { handleRouteError, ok } from "../../../../../../lib/api/response";
import { parseParams, z } from "../../../../../../lib/api/validation";

const childParamsSchema = z.object({
  childId: z.string().trim().min(1, "childId is required"),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ childId: string }> },
) {
  try {
    noStore();
    const guardian = await getOrCreateGuardianForRequest(request);
    const params = parseParams(await context.params, childParamsSchema);

    const child = await markChildOnboardingComplete(guardian.id, params.childId);
    const consents = await seedOnboardingConsents(child.id);
    const roadmapItems = await ensureInitialRoadmapForChild({
      childId: child.id,
      focusAreas: child.focusAreas,
      condition: child.condition,
      birthDate: child.birthDate,
      routine: child.routine,
      supportNeed: child.supportNeed,
    });
    await scheduleInsightRefreshForChild(child.id);

    await createAuditLog({
      guardianId: guardian.id,
      childId: child.id,
      action: "onboarding.completed",
      metadata: {
        roadmapItemCount: roadmapItems.length,
        consentScopes: consents.map((consent) => ({
          scope: consent.scope,
          granted: consent.granted,
        })),
      },
      request,
    });

    return ok({
      child,
      consents,
      roadmapItems,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
