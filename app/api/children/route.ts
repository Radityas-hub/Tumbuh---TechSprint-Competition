import { NextRequest } from "next/server";
import { unstable_noStore as noStore } from "next/cache";

import { createAuditLog } from "../../../lib/audit";
import { createChildForGuardian, focusAreaLabels, listChildrenForGuardian } from "../../../lib/children";
import { created, handleRouteError, ok } from "../../../lib/api/response";
import { parseJsonBody, z } from "../../../lib/api/validation";
import { getOrCreateGuardianForRequest } from "../../../lib/auth/session";

const childPayloadSchema = z.object({
  name: z.string().trim().min(1, "name is required").max(100, "name must be 100 characters or less"),
  birthDate: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "birthDate must be a valid date")
    .refine((value) => new Date(value) <= new Date(), "birthDate cannot be in the future"),
  condition: z.string().trim().min(1, "condition is required").max(120, "condition must be 120 characters or less"),
  focusAreas: z.array(z.enum(focusAreaLabels)).min(1, "focusAreas must contain at least one item"),
  routine: z.string().trim().max(500, "routine must be 500 characters or less").optional().nullable(),
  supportNeed: z.string().trim().max(500, "supportNeed must be 500 characters or less").optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    noStore();
    const guardian = await getOrCreateGuardianForRequest(request);
    const children = await listChildrenForGuardian(guardian.id);

    return ok({ children });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    noStore();
    const guardian = await getOrCreateGuardianForRequest(request);
    const body = await parseJsonBody(request, childPayloadSchema);

    const child = await createChildForGuardian(guardian.id, body);

    await createAuditLog({
      guardianId: guardian.id,
      childId: child.id,
      action: "child.created",
      metadata: {
        focusAreas: child.focusAreas,
      },
      request,
    });

    return created({ child });
  } catch (error) {
    return handleRouteError(error);
  }
}
