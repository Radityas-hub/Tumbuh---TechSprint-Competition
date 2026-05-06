import { unstable_noStore as noStore } from "next/cache";
import { NextRequest } from "next/server";

import { getOrCreateGuardianForRequest } from "../../../../lib/auth/session";
import { getSerializedOwnedMediaAssetForGuardian } from "../../../../lib/media";
import { handleRouteError, ok } from "../../../../lib/api/response";
import { parseParams, z } from "../../../../lib/api/validation";

const documentParamsSchema = z.object({
  documentId: z.string().trim().min(1, "documentId is required"),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ documentId: string }> },
) {
  try {
    noStore();
    const guardian = await getOrCreateGuardianForRequest(request);
    const params = parseParams(await context.params, documentParamsSchema);
    const asset = await getSerializedOwnedMediaAssetForGuardian(guardian.id, params.documentId);

    return ok({ document: asset });
  } catch (error) {
    return handleRouteError(error);
  }
}
