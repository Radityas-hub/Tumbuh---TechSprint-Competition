import { unstable_noStore as noStore } from "next/cache";
import { NextRequest } from "next/server";

import { createAuditLog } from "../../../../../../lib/audit";
import { getOrCreateGuardianForRequest } from "../../../../../../lib/auth/session";
import { getOwnedChildForGuardian } from "../../../../../../lib/children";
import { generateInsightForChild } from "../../../../../../lib/insights";
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
    await getOwnedChildForGuardian(guardian.id, params.childId);

    const insight = await generateInsightForChild(params.childId);

    await createAuditLog({
      guardianId: guardian.id,
      childId: params.childId,
      action: "insight.generated",
      metadata: {
        insightId: insight.id,
        kind: insight.kind,
        confidenceScore: insight.confidenceScore,
      },
      request,
    });

    return ok({ insight });
  } catch (error) {
    return handleRouteError(error);
  }
}
