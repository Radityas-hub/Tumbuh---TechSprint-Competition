import { unstable_noStore as noStore } from "next/cache";
import { NextRequest } from "next/server";

import { createAuditLog } from "../../../../../lib/audit";
import { getOrCreateGuardianForRequest } from "../../../../../lib/auth/session";
import { processOwnedMediaAsset } from "../../../../../lib/media";
import { handleRouteError, ok } from "../../../../../lib/api/response";
import { parseParams, z } from "../../../../../lib/api/validation";

const documentParamsSchema = z.object({
  documentId: z.string().trim().min(1, "documentId is required"),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ documentId: string }> },
) {
  try {
    noStore();
    const guardian = await getOrCreateGuardianForRequest(request);
    const params = parseParams(await context.params, documentParamsSchema);
    const asset = await processOwnedMediaAsset(guardian.id, params.documentId, "document_analyze");

    await createAuditLog({
      guardianId: guardian.id,
      childId: asset.childId,
      action: "document.analysis_requested",
      metadata: {
        documentId: asset.id,
        status: asset.status,
      },
      request,
    });

    return ok({ document: asset });
  } catch (error) {
    return handleRouteError(error);
  }
}
