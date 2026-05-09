import { unstable_noStore as noStore } from "next/cache";
import { NextRequest } from "next/server";

import { handleRouteError, ok } from "../../../../../lib/api/response";
import { parseQuery, z } from "../../../../../lib/api/validation";
import { getOrCreateGuardianForRequest } from "../../../../../lib/auth/session";
import { listKnowledgeArticlesForReview } from "../../../../../lib/knowledge-review";

const querySchema = z.object({
  reviewStatus: z.string().trim().optional(),
  category: z.string().trim().optional(),
});

export async function GET(request: NextRequest) {
  try {
    noStore();
    await getOrCreateGuardianForRequest(request);
    const query = parseQuery(request, querySchema);

    const articles = await listKnowledgeArticlesForReview({
      reviewStatus: query.reviewStatus,
      category: query.category,
    });

    return ok({ articles });
  } catch (error) {
    return handleRouteError(error);
  }
}
