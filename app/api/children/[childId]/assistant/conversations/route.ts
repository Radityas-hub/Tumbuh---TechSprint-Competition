import { unstable_noStore as noStore } from "next/cache";
import { NextRequest } from "next/server";

import { getOrCreateGuardianForRequest } from "../../../../../../lib/auth/session";
import { getOwnedChildForGuardian } from "../../../../../../lib/children";
import { listAssistantConversationsForChild } from "../../../../../../lib/assistant";
import { handleRouteError, ok } from "../../../../../../lib/api/response";
import { parseParams, z } from "../../../../../../lib/api/validation";

const childParamsSchema = z.object({
  childId: z.string().trim().min(1, "childId is required"),
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
    const conversations = await listAssistantConversationsForChild(guardian.id, params.childId);

    return ok({ conversations });
  } catch (error) {
    return handleRouteError(error);
  }
}
