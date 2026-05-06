import { unstable_noStore as noStore } from "next/cache";
import { NextRequest } from "next/server";

import { createAuditLog } from "../../../../lib/audit";
import { getOrCreateGuardianForRequest } from "../../../../lib/auth/session";
import { focusAreaLabels } from "../../../../lib/children";
import { handleRouteError, ok } from "../../../../lib/api/response";
import { parseJsonBody, parseParams, z } from "../../../../lib/api/validation";
import {
  deleteOwnedProgressEntry,
  getOwnedProgressEntry,
  progressInputTypeLabels,
  serializeProgressEntry,
  updateOwnedProgressEntry,
} from "../../../../lib/progress";

const entryParamsSchema = z.object({
  entryId: z.string().trim().min(1, "entryId is required"),
});

const updateProgressSchema = z
  .object({
    area: z.enum(focusAreaLabels).optional(),
    inputType: z.enum(progressInputTypeLabels).optional(),
    title: z.string().trim().max(120, "title must be 120 characters or less").nullable().optional(),
    note: z
      .string()
      .trim()
      .min(1, "note cannot be empty")
      .max(2000, "note must be 2000 characters or less")
      .nullable()
      .optional(),
    observedAt: z
      .string()
      .refine((value) => !Number.isNaN(Date.parse(value)), "observedAt must be a valid ISO date")
      .optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "At least one field must be provided");

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ entryId: string }> },
) {
  try {
    noStore();
    const guardian = await getOrCreateGuardianForRequest(request);
    const params = parseParams(await context.params, entryParamsSchema);
    const entry = await getOwnedProgressEntry(guardian.id, params.entryId);

    return ok({ entry: serializeProgressEntry(entry) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ entryId: string }> },
) {
  try {
    noStore();
    const guardian = await getOrCreateGuardianForRequest(request);
    const params = parseParams(await context.params, entryParamsSchema);
    const body = await parseJsonBody(request, updateProgressSchema);

    const entry = await updateOwnedProgressEntry(guardian.id, params.entryId, body);

    await createAuditLog({
      guardianId: guardian.id,
      childId: entry.childId,
      action: "progress.updated",
      metadata: {
        entryId: entry.id,
        fields: Object.keys(body),
      },
      request,
    });

    return ok({ entry });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ entryId: string }> },
) {
  try {
    noStore();
    const guardian = await getOrCreateGuardianForRequest(request);
    const params = parseParams(await context.params, entryParamsSchema);
    const entry = await deleteOwnedProgressEntry(guardian.id, params.entryId);

    await createAuditLog({
      guardianId: guardian.id,
      childId: entry.childId,
      action: "progress.deleted",
      metadata: {
        entryId: entry.id,
      },
      request,
    });

    return ok({ entry });
  } catch (error) {
    return handleRouteError(error);
  }
}
