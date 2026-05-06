import type { Prisma } from "../generated/prisma/client";
import { FocusArea, InsightKind, RoadmapStatus } from "../generated/prisma/enums";

import { notFound } from "./api/errors";
import { type FocusAreaLabel } from "./children";
import { prisma } from "./prisma";
import { listRoadmapItemsForChild } from "./roadmap";

const insightSelect = {
  id: true,
  childId: true,
  progressEntryId: true,
  kind: true,
  summary: true,
  alerts: true,
  recommendations: true,
  confidenceScore: true,
  rangeStart: true,
  rangeEnd: true,
  generatedBy: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.InsightSelect;

type InsightRecord = Prisma.InsightGetPayload<{ select: typeof insightSelect }>;

const enumToFocusAreaMap: Record<
  (typeof FocusArea)[keyof typeof FocusArea],
  FocusAreaLabel
> = {
  [FocusArea.COMMUNICATION]: "Komunikasi",
  [FocusArea.MOTORIC]: "Motorik",
  [FocusArea.BEHAVIOR]: "Perilaku",
  [FocusArea.ACADEMIC]: "Akademik",
};

export type SerializedInsight = {
  id: string;
  childId: string;
  progressEntryId: string | null;
  kind: keyof typeof InsightKind;
  summary: string;
  alerts: string[];
  recommendations: string[];
  confidenceScore: number;
  rangeStart: string | null;
  rangeEnd: string | null;
  generatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

type GeneratedInsightDraft = {
  summary: string;
  alerts: string[];
  recommendations: string[];
  confidenceScore: number;
  rangeStart: Date | null;
  rangeEnd: Date | null;
};

function parseStringArray(value: Prisma.JsonValue | null): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

export function serializeInsight(insight: InsightRecord): SerializedInsight {
  return {
    id: insight.id,
    childId: insight.childId,
    progressEntryId: insight.progressEntryId,
    kind: insight.kind,
    summary: insight.summary,
    alerts: parseStringArray(insight.alerts),
    recommendations: parseStringArray(insight.recommendations),
    confidenceScore: insight.confidenceScore,
    rangeStart: insight.rangeStart?.toISOString() ?? null,
    rangeEnd: insight.rangeEnd?.toISOString() ?? null,
    generatedBy: insight.generatedBy,
    createdAt: insight.createdAt.toISOString(),
    updatedAt: insight.updatedAt.toISOString(),
  };
}

function startOfDay(value: Date) {
  const next = new Date(value);
  next.setUTCHours(0, 0, 0, 0);
  return next;
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function pickDominantArea(
  counts: Partial<Record<FocusAreaLabel, number>>,
  focusAreas: FocusAreaLabel[],
) {
  const allAreas = focusAreas.length > 0 ? focusAreas : (Object.keys(counts) as FocusAreaLabel[]);

  return allAreas.reduce<FocusAreaLabel | null>((best, area) => {
    if (!best) {
      return area;
    }

    const currentValue = counts[area] ?? 0;
    const bestValue = counts[best] ?? 0;
    return currentValue > bestValue ? area : best;
  }, allAreas[0] ?? null);
}

function buildRecommendations(area: FocusAreaLabel | null, roadmapTitles: string[]) {
  const roadmapRecommendation = roadmapTitles.slice(0, 2);
  const areaRecommendations =
    area === "Komunikasi"
      ? [
          "Sisihkan 10 menit untuk latihan komunikasi singkat dengan pilihan visual sederhana.",
          "Catat momen ketika anak memulai interaksi, meski masih dengan gestur atau prompt ringan.",
        ]
      : area === "Perilaku"
        ? [
            "Gunakan timer visual sebelum transisi agar perubahan aktivitas lebih mudah diprediksi.",
            "Catat pemicu dan konteks sebelum reaksi emosional muncul agar polanya lebih jelas.",
          ]
        : area === "Motorik"
          ? [
              "Pilih satu aktivitas gerak sederhana yang diulang dalam rutinitas harian.",
              "Catat apakah bantuan fisik masih dibutuhkan atau sudah mulai berkurang.",
            ]
          : [
              "Gunakan sesi belajar singkat dengan satu instruksi pada satu waktu.",
              "Ulangi target yang sama dalam konteks yang konsisten selama beberapa hari.",
            ];

  return [...areaRecommendations, ...roadmapRecommendation.map((title) => `Fokuskan latihan rumah pada target roadmap: ${title}.`)].slice(0, 3);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

async function buildInsightDraft(childId: string): Promise<GeneratedInsightDraft> {
  const now = new Date();
  const rangeEnd = now;
  const rangeStart = addDays(startOfDay(now), -13);
  const previousRangeStart = addDays(startOfDay(now), -27);
  const previousRangeEnd = addDays(startOfDay(now), -14);

  const [child, currentEntries, previousEntries, roadmapItems] = await Promise.all([
    prisma.child.findUniqueOrThrow({
      where: { id: childId },
      select: {
        id: true,
        name: true,
        focusAreas: true,
      },
    }),
    prisma.progressEntry.findMany({
      where: {
        childId,
        deletedAt: null,
        observedAt: {
          gte: rangeStart,
          lte: rangeEnd,
        },
      },
      select: {
        area: true,
        observedAt: true,
      },
    }),
    prisma.progressEntry.findMany({
      where: {
        childId,
        deletedAt: null,
        observedAt: {
          gte: previousRangeStart,
          lte: previousRangeEnd,
        },
      },
      select: {
        area: true,
      },
    }),
    listRoadmapItemsForChild(childId),
  ]);

  if (currentEntries.length === 0) {
    return {
      summary: `Belum ada cukup catatan baru untuk membaca pola ${child.name} minggu ini. Tambahkan observasi rutin agar dashboard bisa merangkum perubahan dengan lebih bermakna. Insight ini bukan diagnosis.`,
      alerts: ["Catatan mingguan masih terbatas sehingga pola belum terlihat jelas."],
      recommendations: buildRecommendations(
        child.focusAreas[0] ? enumToFocusAreaMap[child.focusAreas[0]] : null,
        roadmapItems.map((item) => item.title),
      ),
      confidenceScore: 0.25,
      rangeStart,
      rangeEnd,
    };
  }

  const currentAreaCounts = currentEntries.reduce<Partial<Record<FocusAreaLabel, number>>>(
    (accumulator, entry) => {
      const area = enumToFocusAreaMap[entry.area];
      accumulator[area] = (accumulator[area] ?? 0) + 1;
      return accumulator;
    },
    {},
  );

  const previousCount = previousEntries.length;
  const currentCount = currentEntries.length;
  const dominantArea = pickDominantArea(
    currentAreaCounts,
    child.focusAreas.map((area) => enumToFocusAreaMap[area]),
  );

  const growthText =
    currentCount > previousCount
      ? "Ada lebih banyak observasi dibanding dua minggu sebelumnya"
      : currentCount < previousCount
        ? "Observasi minggu ini lebih sedikit daripada dua minggu sebelumnya"
        : "Jumlah observasi relatif stabil dibanding dua minggu sebelumnya";

  const alerts: string[] = [];

  if ((currentAreaCounts.Perilaku ?? 0) >= 2) {
    alerts.push("Area perilaku tampak cukup sering muncul dan layak dipantau lebih dekat pada konteks transisi atau regulasi emosi.");
  }

  if ((currentAreaCounts.Komunikasi ?? 0) === 0 && child.focusAreas.includes(FocusArea.COMMUNICATION)) {
    alerts.push("Belum banyak catatan komunikasi baru, sehingga perubahan di area ini masih sulit dibandingkan.");
  }

  if (alerts.length === 0) {
    alerts.push("Belum ada alert besar yang konsisten, tetapi pola tetap perlu dilihat bersama catatan harian berikutnya.");
  }

  const roadmapAttentionCount = roadmapItems.filter(
    (item) => item.status === RoadmapStatus.NEEDS_ATTENTION,
  ).length;

  const summaryArea = dominantArea ? `terutama pada area ${dominantArea.toLowerCase()}` : "pada beberapa area";
  const roadmapContext =
    roadmapAttentionCount > 0
      ? "Ada target roadmap yang masih perlu perhatian tambahan."
      : "Roadmap saat ini bisa dipakai sebagai fokus latihan rumah berikutnya.";

  return {
    summary: `${growthText} untuk ${child.name}, ${summaryArea}. Pola ini bisa dipakai sebagai bahan diskusi lanjutan bersama pendamping atau profesional, bukan sebagai diagnosis. ${roadmapContext}`,
    alerts,
    recommendations: buildRecommendations(dominantArea, roadmapItems.map((item) => item.title)),
    confidenceScore: clamp(0.35 + currentCount * 0.08, 0.35, 0.92),
    rangeStart,
    rangeEnd,
  };
}

export async function listInsightsForChild(childId: string) {
  const insights = await prisma.insight.findMany({
    where: {
      childId,
    },
    orderBy: [{ createdAt: "desc" }],
    select: insightSelect,
    take: 10,
  });

  return insights.map(serializeInsight);
}

export async function getLatestInsightForChild(childId: string) {
  const insight = await prisma.insight.findFirst({
    where: {
      childId,
    },
    orderBy: [{ createdAt: "desc" }],
    select: insightSelect,
  });

  return insight ? serializeInsight(insight) : null;
}

export async function getOwnedInsightForGuardian(guardianId: string, insightId: string) {
  const insight = await prisma.insight.findFirst({
    where: {
      id: insightId,
      child: {
        guardianId,
        deletedAt: null,
      },
    },
    select: insightSelect,
  });

  if (!insight) {
    throw notFound("Insight not found");
  }

  return insight;
}

export async function generateInsightForChild(childId: string, generatedBy = "rule-based") {
  const draft = await buildInsightDraft(childId);

  const insight = await prisma.insight.create({
    data: {
      childId,
      kind: InsightKind.WEEKLY,
      summary: draft.summary,
      alerts: draft.alerts,
      recommendations: draft.recommendations,
      confidenceScore: Number(draft.confidenceScore.toFixed(2)),
      rangeStart: draft.rangeStart,
      rangeEnd: draft.rangeEnd,
      generatedBy,
    },
    select: insightSelect,
  });

  return serializeInsight(insight);
}

export async function getLatestOrGeneratedInsightForChild(childId: string) {
  const latestInsight = await getLatestInsightForChild(childId);
  if (latestInsight) {
    return latestInsight;
  }

  return generateInsightForChild(childId);
}
