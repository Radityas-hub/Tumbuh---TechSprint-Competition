import { unstable_noStore as noStore } from "next/cache";
import { NextRequest } from "next/server";

import { createAuditLog } from "../../../../../lib/audit";
import { getOrCreateGuardianForRequest } from "../../../../../lib/auth/session";
import { getOwnedChildForGuardian, focusAreaLabels } from "../../../../../lib/children";
import { created, handleRouteError, ok } from "../../../../../lib/api/response";
import { parseJsonBody, parseParams, parseQuery, z } from "../../../../../lib/api/validation";
import {
  createProgressEntryForChild,
  listProgressEntriesForChild,
  progressInputTypeLabels,
} from "../../../../../lib/progress";

const childParamsSchema = z.object({
  childId: z.string().trim().min(1, "childId is required"),
});

const progressQuerySchema = z.object({
  area: z.enum(focusAreaLabels).optional(),
  inputType: z.enum(progressInputTypeLabels).optional(),
  from: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "from must be a valid ISO date")
    .optional(),
  to: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "to must be a valid ISO date")
    .optional(),
  limit: z
    .string()
    .regex(/^\d+$/, "limit must be a number")
    .transform((value) => Number(value))
    .refine((value) => value >= 1 && value <= 50, "limit must be between 1 and 50")
    .optional(),
  cursor: z.string().trim().min(1, "cursor cannot be empty").optional(),
});

const createProgressSchema = z.object({
  area: z.enum(focusAreaLabels),
  inputType: z.enum(progressInputTypeLabels),
  title: z.string().trim().max(120, "title must be 120 characters or less").optional().nullable(),
  note: z.string().trim().min(1, "note is required").max(2000, "note must be 2000 characters or less"),
  mediaId: z.string().trim().min(1, "mediaId cannot be empty").optional(),
  observedAt: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "observedAt must be a valid ISO date")
    .optional(),
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
    const query = parseQuery(request, progressQuerySchema);

    const progress = await listProgressEntriesForChild(params.childId, query);

    return ok(progress);
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
    const body = await parseJsonBody(request, createProgressSchema);

    const entry = await createProgressEntryForChild(params.childId, body);

    await createAuditLog({
      guardianId: guardian.id,
      childId: params.childId,
      action: "progress.created",
      metadata: {
        entryId: entry.id,
        area: entry.area,
        inputType: entry.inputType,
      },
      request,
    });

    return created({ entry });
  } catch (error) {
    return handleRouteError(error);
  }
}
