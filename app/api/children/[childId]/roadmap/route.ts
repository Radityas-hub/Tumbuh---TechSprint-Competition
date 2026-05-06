import { unstable_noStore as noStore } from "next/cache";
import { NextRequest } from "next/server";

import { getOwnedChildForGuardian, mapFocusAreasToLabel } from "../../../../../lib/children";
import { getOrCreateGuardianForRequest } from "../../../../../lib/auth/session";
import { handleRouteError, ok } from "../../../../../lib/api/response";
import { parseParams, z } from "../../../../../lib/api/validation";
import { ensureInitialRoadmapForChild, listRoadmapItemsForChild } from "../../../../../lib/roadmap";

const childParamsSchema = z.object({
  childId: z.string().trim().min(1, "childId is required"),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ childId: string }> },
) {
  try {
    noStore();
    const guardian = await getOrCreateGuardianForRequest(request);
    const params = parseParams(await context.params, childParamsSchema);
    const child = await getOwnedChildForGuardian(guardian.id, params.childId);

    const items =
      child.onboardingCompletedAt === null
        ? []
        : await ensureInitialRoadmapForChild({
            childId: child.id,
            focusAreas: mapFocusAreasToLabel(child.focusAreas),
          });

    return ok({ items });
  } catch (error) {
    return handleRouteError(error);
  }
}
