import type { Prisma } from "../generated/prisma/client";
import { ConsentScope, RoadmapStatus } from "../generated/prisma/enums";

import { forbidden, notFound } from "./api/errors";
import { getOwnedChildForGuardian, mapFocusAreasToLabel, type FocusAreaLabel } from "./children";
import { prisma } from "./prisma";

const providerSelect = {
  id: true,
  name: true,
  specialty: true,
  address: true,
  phone: true,
  website: true,
  latitude: true,
  longitude: true,
  openingHours: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProviderSelect;

type ProviderRecord = Prisma.ProviderGetPayload<{ select: typeof providerSelect }>;

const seededProviders = [
  {
    name: "Tumbuh Cakap Center",
    specialty: "Speech therapist",
    address: "Jakarta Selatan",
    phone: "021-555-1001",
    website: "https://example.com/speech",
    latitude: -6.2615,
    longitude: 106.8106,
  },
  {
    name: "Sahabat Emosi Anak",
    specialty: "Psikolog anak",
    address: "Bandung",
    phone: "022-555-2002",
    website: "https://example.com/psychology",
    latitude: -6.9147,
    longitude: 107.6098,
  },
  {
    name: "Klinik Tumbuh Mandiri",
    specialty: "Okupasi terapi",
    address: "Surabaya",
    phone: "031-555-3003",
    website: "https://example.com/occupational",
    latitude: -7.2575,
    longitude: 112.7521,
  },
];

export type SerializedProvider = {
  id: string;
  name: string;
  specialty: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
  openingHours: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type ConsultationRecommendation = {
  title: string;
  reason: string;
  prepare: string;
  specialty: string;
};

export type ConsultationRecommendationsResponse = {
  child: {
    id: string;
    name: string;
  };
  latestInsightSummary: string | null;
  recommendations: ConsultationRecommendation[];
  meta: {
    hasMeaningfulProgress: boolean;
    shouldUsePlaceholder: boolean;
  };
};

function parseJsonObject(value: Prisma.JsonValue | null): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function serializeProvider(provider: ProviderRecord): SerializedProvider {
  return {
    id: provider.id,
    name: provider.name,
    specialty: provider.specialty,
    address: provider.address,
    phone: provider.phone,
    website: provider.website,
    latitude: provider.latitude,
    longitude: provider.longitude,
    openingHours: parseJsonObject(provider.openingHours),
    createdAt: provider.createdAt.toISOString(),
    updatedAt: provider.updatedAt.toISOString(),
  };
}

export async function ensureSeedProviders() {
  const count = await prisma.provider.count();
  if (count > 0) {
    return;
  }

  await prisma.provider.createMany({
    data: seededProviders,
  });
}

function buildRecommendationForArea(area: FocusAreaLabel): ConsultationRecommendation {
  if (area === "Komunikasi") {
    return {
      title: "Speech therapist",
      specialty: "Speech therapist",
      reason: "Area komunikasi tampak menjadi fokus utama dan cocok dibantu dengan strategi interaksi yang lebih terstruktur.",
      prepare: "Bawa ringkasan 2 minggu: kata yang muncul, situasi, prompt yang dipakai, dan respons setelah prompt.",
    };
  }

  if (area === "Perilaku") {
    return {
      title: "Psikolog anak",
      specialty: "Psikolog anak",
      reason: "Pola perilaku dan transisi lebih mudah dibahas jika ada catatan pemicu, durasi, dan strategi regulasi yang sudah dicoba.",
      prepare: "Bawa catatan pemicu, durasi perilaku, pola sebelum-sesudah transisi, dan strategi yang sempat membantu.",
    };
  }

  if (area === "Motorik") {
    return {
      title: "Okupasi terapi",
      specialty: "Okupasi terapi",
      reason: "Area motorik dan aktivitas harian bisa dibantu dengan target yang lebih konkret dan terukur.",
      prepare: "Bawa contoh aktivitas yang sulit, bantuan yang masih dibutuhkan, dan perubahan kecil yang sudah terlihat.",
    };
  }

  return {
    title: "Psikolog pendidikan",
    specialty: "Psikolog pendidikan",
    reason: "Area akademik atau kesiapan belajar akan lebih jelas bila dibahas bersama profesional dengan contoh observasi yang konsisten.",
    prepare: "Bawa catatan durasi fokus, jenis instruksi yang paling mudah diikuti, dan respons anak saat sesi belajar singkat.",
  };
}

export async function getConsultationRecommendationsForChild(
  guardianId: string,
  childId: string,
): Promise<ConsultationRecommendationsResponse> {
  const child = await getOwnedChildForGuardian(guardianId, childId);
  const focusAreas = mapFocusAreasToLabel(child.focusAreas);

  const [latestInsight, roadmapAttentionCount, totalProgressCount] = await Promise.all([
    prisma.insight.findFirst({
      where: {
        childId,
        isActive: true,
      },
      orderBy: [{ version: "desc" }, { createdAt: "desc" }],
      select: {
        summary: true,
      },
    }),
    prisma.roadmapItem.count({
      where: {
        childId,
        status: RoadmapStatus.NEEDS_ATTENTION,
      },
    }),
    prisma.progressEntry.count({
      where: {
        childId,
        deletedAt: null,
      },
    }),
  ]);

  const hasMeaningfulProgress = totalProgressCount > 0;
  const shouldUsePlaceholder = !hasMeaningfulProgress;

  const recommendations = hasMeaningfulProgress
    ? focusAreas.slice(0, 2).map(buildRecommendationForArea)
    : [];

  if (hasMeaningfulProgress && roadmapAttentionCount > 0) {
    recommendations.push({
      title: "Fasilitas terdekat",
      specialty: "Layanan terdekat",
      reason: "Ada target yang butuh perhatian tambahan, sehingga akses layanan terdekat bisa membantu mempercepat tindak lanjut.",
      prepare: "Siapkan ringkasan target roadmap yang masih butuh perhatian dan contoh catatan terbaru yang paling relevan.",
    });
  }

  return {
    child: {
      id: child.id,
      name: child.name,
    },
    latestInsightSummary: hasMeaningfulProgress ? latestInsight?.summary ?? null : null,
    recommendations,
    meta: {
      hasMeaningfulProgress,
      shouldUsePlaceholder,
    },
  };
}

export async function searchProviders(input: {
  specialty?: string;
  lat?: number;
  lng?: number;
  radius?: number;
}) {
  await ensureSeedProviders();

  const providers = await prisma.provider.findMany({
    where: input.specialty
      ? {
          specialty: {
            contains: input.specialty,
            mode: "insensitive",
          },
        }
      : undefined,
    orderBy: {
      name: "asc",
    },
    select: providerSelect,
  });

  const serialized = providers.map(serializeProvider);

  if (input.lat === undefined || input.lng === undefined) {
    return serialized;
  }

  const originLat = input.lat;
  const originLng = input.lng;

  return serialized
    .map((provider) => ({
      ...provider,
      distanceKm:
        provider.latitude !== null && provider.longitude !== null
          ? Math.sqrt(
              Math.pow((provider.latitude - originLat) * 111, 2) +
                Math.pow((provider.longitude - originLng) * 111, 2),
            )
          : Number.POSITIVE_INFINITY,
    }))
    .filter((provider) =>
      input.radius !== undefined ? provider.distanceKm <= input.radius : true,
    )
    .sort((left, right) => left.distanceKm - right.distanceKm);
}

export async function assertLocationConsentIfNeeded(guardianId: string, childId: string, needsLocation: boolean) {
  if (!needsLocation) {
    return;
  }

  await getOwnedChildForGuardian(guardianId, childId);

  const consent = await prisma.consent.findFirst({
    where: {
      childId,
      scope: ConsentScope.LOCATION,
      granted: true,
    },
    select: {
      id: true,
    },
  });

  if (!consent) {
    throw forbidden("Location consent is required");
  }
}
