import { unstable_noStore as noStore } from "next/cache";
import { NextRequest } from "next/server";

import { createAuditLog } from "../../../../../../lib/audit";
import { getOrCreateGuardianForRequest } from "../../../../../../lib/auth/session";
import { getOwnedChildForGuardian } from "../../../../../../lib/children";
import { handleRouteError, ok } from "../../../../../../lib/api/response";
import { parseJsonBody, parseParams, z } from "../../../../../../lib/api/validation";
import { roadmapStatusLabels, updateOwnedRoadmapItemForGuardian } from "../../../../../../lib/roadmap";

const roadmapParamsSchema = z.object({
  childId: z.string().trim().min(1, "childId is required"),
  itemId: z.string().trim().min(1, "itemId is required"),
});

const updateRoadmapSchema = z
  .object({
    status: z.enum(Object.keys(roadmapStatusLabels) as [keyof typeof roadmapStatusLabels, ...Array<keyof typeof roadmapStatusLabels>]).optional(),
    detail: z.string().trim().max(300, "detail must be 300 characters or less").nullable().optional(),
    evidence: z.array(z.string().trim().min(1, "evidence cannot be empty").max(200, "evidence must be 200 characters or less")).max(6, "evidence must be 6 items or less").optional(),
    confidenceScore: z.number().min(0, "confidenceScore must be between 0 and 1").max(1, "confidenceScore must be between 0 and 1").optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "At least one field must be provided");

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ childId: string; itemId: string }> },
) {
  try {
    noStore();
    const guardian = await getOrCreateGuardianForRequest(request);
    const params = parseParams(await context.params, roadmapParamsSchema);
    await getOwnedChildForGuardian(guardian.id, params.childId);
    const body = await parseJsonBody(request, updateRoadmapSchema);

    const item = await updateOwnedRoadmapItemForGuardian(
      guardian.id,
      params.childId,
      params.itemId,
      body,
    );

    await createAuditLog({
      guardianId: guardian.id,
      childId: params.childId,
      action: "roadmap.updated",
      metadata: {
        itemId: item.id,
        fields: Object.keys(body),
        status: item.status,
      },
      request,
    });

    return ok({ item });
  } catch (error) {
    return handleRouteError(error);
  }
}
