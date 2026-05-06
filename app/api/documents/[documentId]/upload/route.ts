import { unstable_noStore as noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { uploadMediaBinary } from "../../../../../lib/media";
import { handleRouteError } from "../../../../../lib/api/response";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ documentId: string }> },
) {
  try {
    noStore();
    const params = await context.params;
    const signature = request.nextUrl.searchParams.get("signature");
    const body = await request.arrayBuffer();
    const asset = await uploadMediaBinary(params.documentId, signature, body);

    return NextResponse.json({ data: { document: asset } });
  } catch (error) {
    return handleRouteError(error);
  }
}
