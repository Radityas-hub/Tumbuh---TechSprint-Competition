import { unstable_noStore as noStore } from "next/cache";
import { NextRequest } from "next/server";

import { getOrCreateGuardianForRequest } from "../../../../../lib/auth/session";
import { getOwnedChildForGuardian } from "../../../../../lib/children";
import { handleRouteError, ok } from "../../../../../lib/api/response";
import { parseParams, z } from "../../../../../lib/api/validation";
import { getLatestOrGeneratedInsightForChild, listInsightsForChild } from "../../../../../lib/insights";

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
    await getOwnedChildForGuardian(guardian.id, params.childId);

    const [latest, insights] = await Promise.all([
      getLatestOrGeneratedInsightForChild(params.childId),
      listInsightsForChild(params.childId),
    ]);

    return ok({
      latest,
      insights,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
