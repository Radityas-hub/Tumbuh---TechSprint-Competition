import { unstable_noStore as noStore } from "next/cache";
import { NextRequest } from "next/server";

import { getOrCreateGuardianForRequest } from "../../../../lib/auth/session";
import { getAdminDashboardForGuardian } from "../../../../lib/admin-dashboard";
import { handleRouteError, ok } from "../../../../lib/api/response";

export async function GET(request: NextRequest) {
  try {
    noStore();
    const guardian = await getOrCreateGuardianForRequest(request);
    const dashboard = await getAdminDashboardForGuardian(guardian.id);

    return ok({ dashboard });
  } catch (error) {
    return handleRouteError(error);
  }
}
