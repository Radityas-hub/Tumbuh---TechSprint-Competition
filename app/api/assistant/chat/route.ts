import { unstable_noStore as noStore } from "next/cache";
import { NextRequest } from "next/server";

import { createAuditLog } from "../../../../lib/audit";
import { getOrCreateGuardianForRequest } from "../../../../lib/auth/session";
import { createAssistantReply } from "../../../../lib/assistant";
import { handleRouteError, ok } from "../../../../lib/api/response";
import { parseJsonBody, z } from "../../../../lib/api/validation";

const assistantChatSchema = z.object({
  childId: z.string().trim().min(1, "childId cannot be empty").optional().nullable(),
  conversationId: z.string().trim().min(1, "conversationId cannot be empty").optional().nullable(),
  question: z.string().trim().min(1, "question is required").max(1000, "question must be 1000 characters or less"),
});

export async function POST(request: NextRequest) {
  try {
    noStore();
    const guardian = await getOrCreateGuardianForRequest(request);
    const body = await parseJsonBody(request, assistantChatSchema);
    const result = await createAssistantReply({
      guardianId: guardian.id,
      childId: body.childId ?? null,
      conversationId: body.conversationId ?? null,
      question: body.question,
    });

    await createAuditLog({
      guardianId: guardian.id,
      childId: body.childId ?? null,
      action: "assistant.chat",
      metadata: {
        conversationId: result.conversation.id,
      },
      request,
    });

    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
