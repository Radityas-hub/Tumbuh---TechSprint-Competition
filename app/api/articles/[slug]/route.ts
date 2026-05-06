import { unstable_noStore as noStore } from "next/cache";
import { NextRequest } from "next/server";

import { getArticleBySlug } from "../../../../lib/articles";
import { handleRouteError, ok } from "../../../../lib/api/response";
import { parseParams, z } from "../../../../lib/api/validation";

const articleParamsSchema = z.object({
  slug: z.string().trim().min(1, "slug is required"),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    noStore();
    const params = parseParams(await context.params, articleParamsSchema);
    const article = await getArticleBySlug(params.slug);

    return ok({ article });
  } catch (error) {
    return handleRouteError(error);
  }
}
