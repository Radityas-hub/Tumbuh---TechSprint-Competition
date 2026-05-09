import { FocusArea, RoadmapStatus } from "../generated/prisma/enums";

import { markInsightsStaleForChild, scheduleInsightRefreshForChild } from "./insights";
import { notFound } from "./api/errors";
import { focusAreaLabels, type FocusAreaLabel } from "./children";
import { selectCurriculumForChild } from "./curriculum";
import { prisma } from "./prisma";

const roadmapSelect = {
  id: true,
  childId: true,
  area: true,
  title: true,
  detail: true,
  status: true,
  evidence: true,
  confidenceScore: true,
  sortOrder: true,
  achievedAt: true,
  lastPersonalizedAt: true,
  personalizationSource: true,
  sourceInsightId: true,
  personalizationReason: true,
  createdAt: true,
  updatedAt: true,
};

type RoadmapRecord = {
  id: string;
  childId: string;
  area: (typeof FocusArea)[keyof typeof FocusArea];
  title: string;
  detail: string | null;
  status: (typeof RoadmapStatus)[keyof typeof RoadmapStatus];
  evidence: unknown;
  confidenceScore: number;
  sortOrder: number;
  achievedAt: Date | null;
  lastPersonalizedAt: Date | null;
  personalizationSource: string | null;
  sourceInsightId: string | null;
  personalizationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export const roadmapStatusLabels = {
  [RoadmapStatus.ACHIEVED]: "Tercapai",
  [RoadmapStatus.IN_PROGRESS]: "Berproses",
  [RoadmapStatus.NEXT_TARGET]: "Target berikutnya",
  [RoadmapStatus.NEEDS_ATTENTION]: "Perlu perhatian",
  [RoadmapStatus.PAUSED]: "Dijeda",
} as const;

export const roadmapStatusTones = {
  [RoadmapStatus.ACHIEVED]: "green",
  [RoadmapStatus.IN_PROGRESS]: "amber",
  [RoadmapStatus.NEXT_TARGET]: "blue",
  [RoadmapStatus.NEEDS_ATTENTION]: "coral",
  [RoadmapStatus.PAUSED]: "slate",
} as const;

const enumToFocusAreaMap: Record<
  (typeof FocusArea)[keyof typeof FocusArea],
  FocusAreaLabel
> = {
  [FocusArea.COMMUNICATION]: "Komunikasi",
  [FocusArea.MOTORIC]: "Motorik",
  [FocusArea.BEHAVIOR]: "Perilaku",
  [FocusArea.ACADEMIC]: "Akademik",
};

const focusAreaToEnumMap: Record<
  FocusAreaLabel,
  (typeof FocusArea)[keyof typeof FocusArea]
> = {
  Komunikasi: FocusArea.COMMUNICATION,
  Motorik: FocusArea.MOTORIC,
  Perilaku: FocusArea.BEHAVIOR,
  Akademik: FocusArea.ACADEMIC,
};

export type SerializedRoadmapItem = {
  id: string;
  childId: string;
  area: FocusAreaLabel;
  title: string;
  detail: string | null;
  status: keyof typeof roadmapStatusLabels;
  statusLabel: string;
  tone: string;
  evidence: string[];
  confidenceScore: number;
  sortOrder: number;
  achievedAt: string | null;
  lastPersonalizedAt: string | null;
  personalizationSource: string | null;
  sourceInsightId: string | null;
  personalizationReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RoadmapResponseMeta = {
  personalizedAt: string | null;
  personalizationSource: string | null;
  sourceInsightId: string | null;
  isDerivedFromLatestInsight: boolean;
  hasMeaningfulProgress: boolean;
  shouldUsePlaceholder: boolean;
  isSeedOnly: boolean;
};

export type UpdateRoadmapItemInput = {
  status?: keyof typeof roadmapStatusLabels;
  detail?: string | null;
  evidence?: string[];
  confidenceScore?: number;
};

type RoadmapSeedInput = {
  childId: string;
  focusAreas: FocusAreaLabel[];
  condition?: string | null;
  birthDate?: string | Date | null;
  routine?: string | null;
  supportNeed?: string | null;
};

function parseEvidence(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

export function serializeRoadmapItem(item: RoadmapRecord): SerializedRoadmapItem {
  return {
    id: item.id,
    childId: item.childId,
    area: enumToFocusAreaMap[item.area],
    title: item.title,
    detail: item.detail,
    status: item.status,
    statusLabel: roadmapStatusLabels[item.status],
    tone: roadmapStatusTones[item.status],
    evidence: parseEvidence(item.evidence),
    confidenceScore: item.confidenceScore,
    sortOrder: item.sortOrder,
    achievedAt: item.achievedAt?.toISOString() ?? null,
    lastPersonalizedAt: item.lastPersonalizedAt?.toISOString() ?? null,
    personalizationSource: item.personalizationSource,
    sourceInsightId: item.sourceInsightId,
    personalizationReason: item.personalizationReason,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

const fallbackRoadmapTemplates: Record<
  FocusAreaLabel,
  Array<{
    title: string;
    detail: string;
    evidence: string[];
  }>
> = {
  Komunikasi: [
    {
      title: "Kontak mata 5 detik",
      detail: "Latih kontak mata singkat saat memberi instruksi sederhana dan jelas.",
      evidence: ["Amati respons saat dipanggil", "Catat momen ketika anak menoleh spontan"],
    },
    {
      title: "Meminta bantuan dengan kata atau gestur",
      detail: "Gunakan pilihan visual agar anak belajar meminta bantuan sebelum frustrasi.",
      evidence: ["Siapkan dua pilihan aktivitas", "Tunggu 3-5 detik sebelum memberi prompt"],
    },
  ],
  Motorik: [
    {
      title: "Mengikuti aktivitas motorik 2 langkah",
      detail: "Gunakan aktivitas sederhana seperti duduk lalu berdiri dengan contoh visual.",
      evidence: ["Catat keberhasilan mengikuti urutan", "Perhatikan kebutuhan bantuan fisik"],
    },
    {
      title: "Koordinasi tangan saat aktivitas bermain",
      detail: "Gunakan permainan sederhana yang melibatkan memegang, memindah, dan menyusun benda.",
      evidence: ["Catat durasi fokus", "Perhatikan gerakan yang masih kaku"],
    },
  ],
  Perilaku: [
    {
      title: "Transisi dengan dukungan visual",
      detail: "Gunakan timer visual sebelum pergantian aktivitas agar transisi lebih bisa diprediksi.",
      evidence: ["Catat pemicu sebelum tantrum", "Lihat apakah timer membantu transisi"],
    },
    {
      title: "Regulasi emosi saat rutinitas berubah",
      detail: "Mulai dari perubahan kecil dengan pilihan yang terbatas agar anak merasa lebih aman.",
      evidence: ["Catat situasi yang memicu penolakan", "Bandingkan hari dengan rutinitas stabil"],
    },
  ],
  Akademik: [
    {
      title: "Mengikuti instruksi belajar singkat",
      detail: "Fokus pada satu instruksi singkat dalam sesi 5-10 menit.",
      evidence: ["Catat durasi perhatian", "Amati respons pada instruksi satu langkah"],
    },
    {
      title: "Mengenali simbol atau benda target",
      detail: "Gunakan benda konkret dan ulangi dalam konteks yang sama agar lebih mudah dipahami.",
      evidence: ["Catat benda yang paling mudah dikenali", "Ulangi dalam rutinitas yang konsisten"],
    },
  ],
};

function buildSeedRoadmapItems(input: RoadmapSeedInput) {
  const areas = input.focusAreas.length > 0 ? input.focusAreas : focusAreaLabels.slice(0, 2);

  // Coba curriculum selector dulu (personalized by condition + age + routine).
  const curriculumPicks = selectCurriculumForChild({
    focusAreas: areas,
    condition: input.condition ?? null,
    birthDate: input.birthDate ?? null,
    routine: input.routine ?? null,
    supportNeed: input.supportNeed ?? null,
  });

  // Kalau selector tidak menghasilkan apapun (edge case), fallback ke template generic.
  const picks = curriculumPicks.length > 0
    ? curriculumPicks.map((pick) => ({
        area: pick.area,
        title: pick.title,
        detail: pick.detail,
        evidence: pick.evidence,
        reason: pick.reason,
      }))
    : areas.flatMap((area) =>
        fallbackRoadmapTemplates[area].map((template) => ({
          area,
          title: template.title,
          detail: template.detail,
          evidence: template.evidence,
          reason: "fallback generic",
        })),
      );

  // Group per area untuk pengurutan + status assignment yang konsisten.
  const byArea = new Map<FocusAreaLabel, typeof picks>();
  picks.forEach((pick) => {
    const bucket = byArea.get(pick.area) ?? [];
    bucket.push(pick);
    byArea.set(pick.area, bucket);
  });

  const result: Array<{
    childId: string;
    area: (typeof FocusArea)[keyof typeof FocusArea];
    title: string;
    detail: string | null;
    status: (typeof RoadmapStatus)[keyof typeof RoadmapStatus];
    evidence: string[];
    confidenceScore: number;
    sortOrder: number;
    personalizationSource: string;
    personalizationReason: string;
  }> = [];

  let globalOrder = 0;
  areas.forEach((area, areaIndex) => {
    const items = byArea.get(area) ?? [];
    items.forEach((item, templateIndex) => {
      const isFirstOverall = areaIndex === 0 && templateIndex === 0;
      const status = isFirstOverall
        ? RoadmapStatus.IN_PROGRESS
        : area === "Perilaku" && templateIndex === 0
          ? RoadmapStatus.NEEDS_ATTENTION
          : RoadmapStatus.NEXT_TARGET;

      result.push({
        childId: input.childId,
        area: focusAreaToEnumMap[area],
        title: item.title,
        detail: item.detail,
        status,
        evidence: item.evidence,
        confidenceScore: status === RoadmapStatus.IN_PROGRESS ? 0.72 : 0.58,
        sortOrder: globalOrder,
        personalizationSource: "curriculum_v1",
        personalizationReason: item.reason,
      });
      globalOrder += 1;
    });
  });

  return result;
}

export async function ensureInitialRoadmapForChild(input: RoadmapSeedInput) {
  const existingCount = await prisma.roadmapItem.count({
    where: {
      childId: input.childId,
    },
  });

  if (existingCount > 0) {
    return listRoadmapItemsForChild(input.childId);
  }

  const items = buildSeedRoadmapItems(input);

  if (items.length === 0) {
    return [];
  }

  await prisma.roadmapItem.createMany({
    data: items,
  });

  return listRoadmapItemsForChild(input.childId);
}

export async function listRoadmapItemsForChild(childId: string) {
  const items = await prisma.roadmapItem.findMany({
    where: {
      childId,
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: roadmapSelect,
  });

  return items.map(serializeRoadmapItem);
}

export function buildRoadmapMeta(
  items: SerializedRoadmapItem[],
  latestInsightId: string | null = null,
  options?: {
    hasMeaningfulProgress?: boolean;
  },
): RoadmapResponseMeta {
  const latestPersonalizedItem = items
    .filter((item) => item.lastPersonalizedAt)
    .sort((left, right) =>
      (right.lastPersonalizedAt ?? "").localeCompare(left.lastPersonalizedAt ?? ""),
    )[0];

  const hasMeaningfulProgress = options?.hasMeaningfulProgress ?? false;
  const isSeedOnly = !hasMeaningfulProgress && items.length > 0;

  return {
    personalizedAt: latestPersonalizedItem?.lastPersonalizedAt ?? null,
    personalizationSource: latestPersonalizedItem?.personalizationSource ?? null,
    sourceInsightId: latestPersonalizedItem?.sourceInsightId ?? null,
    isDerivedFromLatestInsight:
      latestInsightId !== null &&
      latestPersonalizedItem?.sourceInsightId != null &&
      latestPersonalizedItem.sourceInsightId === latestInsightId,
    hasMeaningfulProgress,
    shouldUsePlaceholder: !hasMeaningfulProgress,
    isSeedOnly,
  };
}

export async function getOwnedRoadmapItemForGuardian(guardianId: string, itemId: string) {
  const item = await prisma.roadmapItem.findFirst({
    where: {
      id: itemId,
      child: {
        guardianId,
        deletedAt: null,
      },
    },
    select: roadmapSelect,
  });

  if (!item) {
    throw notFound("Roadmap item not found");
  }

  return item;
}

export async function updateOwnedRoadmapItemForGuardian(
  guardianId: string,
  childId: string,
  itemId: string,
  input: UpdateRoadmapItemInput,
) {
  await getOwnedRoadmapItemForGuardian(guardianId, itemId);

  const item = await prisma.roadmapItem.update({
    where: {
      id: itemId,
    },
    data: {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.detail !== undefined ? { detail: input.detail } : {}),
      ...(input.evidence !== undefined ? { evidence: input.evidence } : {}),
      ...(input.confidenceScore !== undefined
        ? { confidenceScore: Number(input.confidenceScore.toFixed(2)) }
        : {}),
      ...(input.status === RoadmapStatus.ACHIEVED ? { achievedAt: new Date() } : {}),
      ...(input.status !== undefined && input.status !== RoadmapStatus.ACHIEVED
        ? { achievedAt: null }
        : {}),
    },
    select: roadmapSelect,
  });

  await markInsightsStaleForChild(childId);
  await scheduleInsightRefreshForChild(childId);

  return serializeRoadmapItem(item);
}
