import { NextRequest } from "next/server";
import { unstable_noStore as noStore } from "next/cache";

import { createAuditLog } from "../../../../lib/audit";
import {
  focusAreaLabels,
  getOwnedChildForGuardian,
  serializeChild,
  updateOwnedChildForGuardian,
} from "../../../../lib/children";
import { handleRouteError, ok } from "../../../../lib/api/response";
import { parseJsonBody, parseParams, z } from "../../../../lib/api/validation";
import { getOrCreateGuardianForRequest } from "../../../../lib/auth/session";

const childParamsSchema = z.object({
  childId: z.string().trim().min(1, "childId is required"),
});

const updateChildSchema = z
  .object({
    name: z.string().trim().min(1, "name cannot be empty").max(100, "name must be 100 characters or less").optional(),
    birthDate: z
      .string()
      .refine((value) => !Number.isNaN(Date.parse(value)), "birthDate must be a valid date")
      .refine((value) => new Date(value) <= new Date(), "birthDate cannot be in the future")
      .optional(),
    condition: z
      .string()
      .trim()
      .min(1, "condition cannot be empty")
      .max(120, "condition must be 120 characters or less")
      .optional(),
    focusAreas: z.array(z.enum(focusAreaLabels)).min(1, "focusAreas must contain at least one item").optional(),
    routine: z.string().trim().max(500, "routine must be 500 characters or less").nullable().optional(),
    supportNeed: z.string().trim().max(500, "supportNeed must be 500 characters or less").nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "At least one field must be provided");

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ childId: string }> },
) {
  try {
    noStore();
    const guardian = await getOrCreateGuardianForRequest(request);
    const params = parseParams(await context.params, childParamsSchema);
    const child = await getOwnedChildForGuardian(guardian.id, params.childId);

    return ok({ child: serializeChild(child) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ childId: string }> },
) {
  try {
    noStore();
    const guardian = await getOrCreateGuardianForRequest(request);
    const params = parseParams(await context.params, childParamsSchema);
    const body = await parseJsonBody(request, updateChildSchema);

    const child = await updateOwnedChildForGuardian(guardian.id, params.childId, body);

    await createAuditLog({
      guardianId: guardian.id,
      childId: child.id,
      action: "child.updated",
      metadata: {
        fields: Object.keys(body),
      },
      request,
    });

    return ok({ child });
  } catch (error) {
    return handleRouteError(error);
  }
}
