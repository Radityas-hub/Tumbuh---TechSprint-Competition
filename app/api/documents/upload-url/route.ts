import { unstable_noStore as noStore } from "next/cache";
import { NextRequest } from "next/server";

import { createAuditLog } from "../../../../lib/audit";
import { getOrCreateGuardianForRequest } from "../../../../lib/auth/session";
import { getOwnedChildForGuardian } from "../../../../lib/children";
import { createUploadRequestForChild, assertConsentGrantedForChild } from "../../../../lib/media";
import { handleRouteError, created } from "../../../../lib/api/response";
import { parseJsonBody, z } from "../../../../lib/api/validation";

const createDocumentUploadSchema = z.object({
  childId: z.string().trim().min(1, "childId is required"),
  fileName: z.string().trim().min(1, "fileName is required").max(200, "fileName must be 200 characters or less"),
  mimeType: z.string().trim().max(200, "mimeType must be 200 characters or less").optional().nullable(),
  sizeBytes: z.number().int().positive("sizeBytes must be positive").max(20_000_000, "sizeBytes must be 20MB or less").optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    noStore();
    const guardian = await getOrCreateGuardianForRequest(request);
    const body = await parseJsonBody(request, createDocumentUploadSchema);
    await getOwnedChildForGuardian(guardian.id, body.childId);
    await assertConsentGrantedForChild(body.childId, "document_analysis");

    const uploadRequest = await createUploadRequestForChild({
      ...body,
      type: "Dokumen",
    });

    await createAuditLog({
      guardianId: guardian.id,
      childId: body.childId,
      action: "document.upload_requested",
      metadata: {
        documentId: uploadRequest.asset.id,
        fileName: body.fileName,
      },
      request,
    });

    return created(uploadRequest);
  } catch (error) {
    return handleRouteError(error);
  }
}
