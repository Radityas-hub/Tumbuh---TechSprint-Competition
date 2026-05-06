import { unstable_noStore as noStore } from "next/cache";
import { NextRequest } from "next/server";

import { getOrCreateGuardianForRequest } from "../../../lib/auth/session";
import { badRequest } from "../../../lib/api/errors";
import { assertLocationConsentIfNeeded, searchProviders } from "../../../lib/consultations";
import { handleRouteError, ok } from "../../../lib/api/response";
import { parseQuery, z } from "../../../lib/api/validation";

const providersQuerySchema = z.object({
  childId: z.string().trim().min(1, "childId cannot be empty").optional(),
  specialty: z.string().trim().max(100, "specialty must be 100 characters or less").optional(),
  lat: z.string().trim().optional(),
  lng: z.string().trim().optional(),
  radius: z.string().trim().optional(),
});

export async function GET(request: NextRequest) {
  try {
    noStore();
    const guardian = await getOrCreateGuardianForRequest(request);
    const query = parseQuery(request, providersQuerySchema);
    const hasLocation = Boolean(query.lat && query.lng);

    if (hasLocation && !query.childId) {
      throw badRequest("childId is required when using location filters");
    }

    await assertLocationConsentIfNeeded(guardian.id, query.childId ?? "", hasLocation);

    const providers = await searchProviders({
      specialty: query.specialty,
      lat: query.lat ? Number(query.lat) : undefined,
      lng: query.lng ? Number(query.lng) : undefined,
      radius: query.radius ? Number(query.radius) : undefined,
    });

    return ok({ providers });
  } catch (error) {
    return handleRouteError(error);
  }
}
