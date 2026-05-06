import { unstable_noStore as noStore } from "next/cache";
import { NextRequest } from "next/server";

import { listArticles } from "../../../lib/articles";
import { handleRouteError, ok } from "../../../lib/api/response";
import { parseQuery, z } from "../../../lib/api/validation";

const articleQuerySchema = z.object({
  query: z.string().trim().max(100, "query must be 100 characters or less").optional(),
  category: z.string().trim().max(100, "category must be 100 characters or less").optional(),
});

export async function GET(request: NextRequest) {
  try {
    noStore();
    const query = parseQuery(request, articleQuerySchema);
    const articles = await listArticles(query);

    return ok({ articles });
  } catch (error) {
    return handleRouteError(error);
  }
}
