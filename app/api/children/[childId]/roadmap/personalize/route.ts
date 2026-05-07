import { unstable_noStore as noStore } from "next/cache";
import { NextRequest } from "next/server";

import { getOrCreateGuardianForRequest } from "../../../../../../lib/auth/session";
import { getOwnedChildForGuardian } from "../../../../../../lib/children";
import { handleRouteError, ok } from "../../../../../../lib/api/response";
import { parseParams, z } from "../../../../../../lib/api/validation";
import { personalizeRoadmapForChild } from "../../../../../../lib/roadmap-personalization";

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
    await getOwnedChildForGuardian(guardian.id, params.childId);

    const result = await personalizeRoadmapForChild({
      childId: params.childId,
      guardianId: guardian.id,
      trigger: "manual",
    });

    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
