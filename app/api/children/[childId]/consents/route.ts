import { NextRequest } from "next/server";
import { unstable_noStore as noStore } from "next/cache";

import { getOrCreateGuardianForRequest } from "../../../../../lib/auth/session";
import { createAuditLog } from "../../../../../lib/audit";
import { getOwnedChildForGuardian } from "../../../../../lib/children";
import { consentScopeValues, listConsentsForChild, upsertConsentForChild } from "../../../../../lib/consents";
import { handleRouteError, ok } from "../../../../../lib/api/response";
import { parseJsonBody, parseParams, z } from "../../../../../lib/api/validation";

const childParamsSchema = z.object({
  childId: z.string().trim().min(1, "childId is required"),
});

const consentPayloadSchema = z.object({
  scope: z.enum(consentScopeValues),
  granted: z.boolean(),
  source: z.string().trim().max(100, "source must be 100 characters or less").optional().nullable(),
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

    const consents = await listConsentsForChild(params.childId);
    return ok({ consents });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ childId: string }> },
) {
  try {
    noStore();
    const guardian = await getOrCreateGuardianForRequest(request);
    const params = parseParams(await context.params, childParamsSchema);
    await getOwnedChildForGuardian(guardian.id, params.childId);
    const body = await parseJsonBody(request, consentPayloadSchema);

    const consent = await upsertConsentForChild(params.childId, body);

    await createAuditLog({
      guardianId: guardian.id,
      childId: params.childId,
      action: body.granted ? "consent.granted" : "consent.revoked",
      metadata: {
        scope: body.scope,
        source: body.source ?? null,
      },
      request,
    });

    return ok({ consent });
  } catch (error) {
    return handleRouteError(error);
  }
}
