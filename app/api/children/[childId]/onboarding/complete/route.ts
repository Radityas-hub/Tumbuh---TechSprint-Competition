import { NextRequest } from "next/server";
import { unstable_noStore as noStore } from "next/cache";

import { getOrCreateGuardianForRequest } from "../../../../../../lib/auth/session";
import { createAuditLog } from "../../../../../../lib/audit";
import { markChildOnboardingComplete } from "../../../../../../lib/children";
import { seedOnboardingConsents } from "../../../../../../lib/consents";
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

    await createAuditLog({
      guardianId: guardian.id,
      childId: child.id,
      action: "onboarding.completed",
      metadata: {
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
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
