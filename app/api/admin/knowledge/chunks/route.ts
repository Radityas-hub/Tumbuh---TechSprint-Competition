import { unstable_noStore as noStore } from "next/cache";
import { NextRequest } from "next/server";

import { handleRouteError, ok } from "../../../../../lib/api/response";
import { parseQuery, z } from "../../../../../lib/api/validation";
import { getOrCreateGuardianForRequest } from "../../../../../lib/auth/session";
import { listKnowledgeChunksForReview } from "../../../../../lib/knowledge-review";

const querySchema = z.object({
  articleId: z.string().trim().optional(),
  reviewStatus: z.string().trim().optional(),
});

export async function GET(request: NextRequest) {
  try {
    noStore();
    await getOrCreateGuardianForRequest(request);
    const query = parseQuery(request, querySchema);

    const chunks = await listKnowledgeChunksForReview({
      articleId: query.articleId,
      reviewStatus: query.reviewStatus,
    });

    return ok({ chunks });
  } catch (error) {
    return handleRouteError(error);
  }
}
