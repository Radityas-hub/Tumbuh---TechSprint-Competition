import { unstable_noStore as noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { getMediaFileResponsePayload } from "../../../../../lib/media";
import { handleRouteError } from "../../../../../lib/api/response";
import { getOrCreateGuardianForRequest } from "../../../../../lib/auth/session";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ documentId: string }> },
) {
  try {
    noStore();
    await getOrCreateGuardianForRequest(request);
    const params = await context.params;
    const file = await getMediaFileResponsePayload(params.documentId);

    return new NextResponse(file.body, {
      headers: {
        "Content-Type": file.mimeType,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
