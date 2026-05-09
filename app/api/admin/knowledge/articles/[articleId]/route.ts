import { unstable_noStore as noStore } from "next/cache";
import { NextRequest } from "next/server";

import { handleRouteError, ok } from "../../../../../../lib/api/response";
import { parseJsonBody, parseParams, z } from "../../../../../../lib/api/validation";
import { getOrCreateGuardianForRequest } from "../../../../../../lib/auth/session";
import { updateKnowledgeArticleReview } from "../../../../../../lib/knowledge-review";

const paramsSchema = z.object({
  articleId: z.string().trim().min(1, "articleId is required"),
});

const bodySchema = z.object({
  reviewStatus: z.string().trim().min(1, "reviewStatus is required"),
  reviewNotes: z.string().trim().max(1000).optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ articleId: string }> },
) {
  try {
    noStore();
    const guardian = await getOrCreateGuardianForRequest(request);
    const params = parseParams(await context.params, paramsSchema);
    const body = await parseJsonBody(request, bodySchema);

    const reviewerLabel = guardian.displayName?.trim() || guardian.email;
    const article = await updateKnowledgeArticleReview({
      articleId: params.articleId,
      reviewerLabel,
      reviewStatus: body.reviewStatus,
      reviewNotes: body.reviewNotes,
    });

    return ok({ article });
  } catch (error) {
    return handleRouteError(error);
  }
}
