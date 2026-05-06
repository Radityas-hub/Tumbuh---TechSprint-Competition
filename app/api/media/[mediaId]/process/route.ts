import { unstable_noStore as noStore } from "next/cache";
import { NextRequest } from "next/server";

import { createAuditLog } from "../../../../../lib/audit";
import { getOrCreateGuardianForRequest } from "../../../../../lib/auth/session";
import { processOwnedMediaAsset } from "../../../../../lib/media";
import { handleRouteError, ok } from "../../../../../lib/api/response";
import { parseParams, z } from "../../../../../lib/api/validation";

const mediaParamsSchema = z.object({
  mediaId: z.string().trim().min(1, "mediaId is required"),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ mediaId: string }> },
) {
  try {
    noStore();
    const guardian = await getOrCreateGuardianForRequest(request);
    const params = parseParams(await context.params, mediaParamsSchema);
    const asset = await processOwnedMediaAsset(guardian.id, params.mediaId, "media_process");

    await createAuditLog({
      guardianId: guardian.id,
      childId: asset.childId,
      action: "media.processing_requested",
      metadata: {
        mediaId: asset.id,
        status: asset.status,
        type: asset.type,
      },
      request,
    });

    return ok({ asset });
  } catch (error) {
    return handleRouteError(error);
  }
}
