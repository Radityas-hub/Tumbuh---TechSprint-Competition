import { unstable_noStore as noStore } from "next/cache";
import { NextRequest } from "next/server";

import { getOrCreateGuardianForRequest } from "../../../../lib/auth/session";
import { getSerializedOwnedMediaAssetForGuardian } from "../../../../lib/media";
import { handleRouteError, ok } from "../../../../lib/api/response";
import { parseParams, z } from "../../../../lib/api/validation";

const mediaParamsSchema = z.object({
  mediaId: z.string().trim().min(1, "mediaId is required"),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ mediaId: string }> },
) {
  try {
    noStore();
    const guardian = await getOrCreateGuardianForRequest(request);
    const params = parseParams(await context.params, mediaParamsSchema);
    const asset = await getSerializedOwnedMediaAssetForGuardian(guardian.id, params.mediaId);

    return ok({ asset });
  } catch (error) {
    return handleRouteError(error);
  }
}
