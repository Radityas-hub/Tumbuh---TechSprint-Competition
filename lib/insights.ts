import { createHash } from "node:crypto";

import type { Prisma } from "../generated/prisma/client";
import { FocusArea, InsightKind, RoadmapStatus } from "../generated/prisma/enums";

import { notFound } from "./api/errors";
import { z } from "./api/validation";
import { type FocusAreaLabel } from "./children";
import { prisma } from "./prisma";
import { personalizeRoadmapForChild } from "./roadmap-personalization";
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
  sourceDataHash: true,
  status: true,
  version: true,
  modelName: true,
  promptVersion: true,
  rawInput: true,
  rawOutput: true,
  isActive: true,
  staleAt: true,
  generatedAt: true,
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
  sourceDataHash: string | null;
  status: string;
  version: number;
  modelName: string | null;
  promptVersion: string | null;
  isActive: boolean;
  staleAt: string | null;
  generatedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InsightListState = {
  latest: SerializedInsight | null;
  insights: SerializedInsight[];
  status: string;
  isStale: boolean;
};

type GeneratedInsightDraft = {
  summary: string;
  alerts: string[];
  recommendations: string[];
  confidenceScore: number;
  rangeStart: Date | null;
  rangeEnd: Date | null;
};

type InsightSnapshot = {
  childId: string;
  childName: string;
  focusAreas: FocusAreaLabel[];
  rangeStart: string;
  rangeEnd: string;
  previousRangeStart: string;
  previousRangeEnd: string;
  currentEntries: Array<{
    area: FocusAreaLabel;
    observedAt: string;
  }>;
  previousEntries: Array<{
    area: FocusAreaLabel;
  }>;
  roadmapItems: Array<{
    title: string;
    status: keyof typeof RoadmapStatus;
  }>;
};

type EntryInsightSnapshot = {
  childId: string;
  childName: string;
  progressEntryId: string;
  area: FocusAreaLabel;
  inputType: "Teks" | "Foto" | "Suara";
  title: string | null;
  note: string | null;
  observedAt: string;
  focusAreas: FocusAreaLabel[];
  weeklyInsightSummary: string | null;
  mediaSummary: string | null;
};

type InsightBuildResult = {
  childId: string;
  snapshot: InsightSnapshot;
  sourceDataHash: string;
  draft: GeneratedInsightDraft;
};

type EntryInsightBuildResult = {
  childId: string;
  progressEntryId: string;
  snapshot: EntryInsightSnapshot;
  sourceDataHash: string;
  draft: GeneratedInsightDraft;
};

const insightPromptVersion = "insight-v2-persisted";
const entryInsightPromptVersion = "entry-insight-v1";
const insightPlaceholderSummary =
  "Insight sedang disusun dari catatan terbaru. Hasil ini tetap bersifat pendamping dan bukan diagnosis.";

const llmInsightResponseSchema = z.object({
  summary: z.string().trim().min(1).max(1200),
  alerts: z.array(z.string().trim().min(1).max(240)).max(5),
  recommendations: z.array(z.string().trim().min(1).max(240)).max(5),
  confidenceScore: z.number().min(0).max(1).nullable().optional(),
});

type InsightGenerationPayload = {
  summary: string;
  alerts: string[];
  recommendations: string[];
  confidenceScore: number;
  generatedBy: string;
  modelName: string | null;
  promptVersion: string;
  rawOutput: Prisma.InputJsonValue;
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
    sourceDataHash: insight.sourceDataHash,
    status: insight.status,
    version: insight.version,
    modelName: insight.modelName,
    promptVersion: insight.promptVersion,
    isActive: insight.isActive,
    staleAt: insight.staleAt?.toISOString() ?? null,
    generatedAt: insight.generatedAt?.toISOString() ?? null,
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

function buildFallbackInsightPayload(draft: GeneratedInsightDraft): InsightGenerationPayload {
  const confidenceScore = Number(clamp(draft.confidenceScore, 0, 1).toFixed(2));

  return {
    summary: draft.summary,
    alerts: draft.alerts,
    recommendations: draft.recommendations,
    confidenceScore,
    generatedBy: "rule-based",
    modelName: null,
    promptVersion: insightPromptVersion,
    rawOutput: {
      summary: draft.summary,
      alerts: draft.alerts,
      recommendations: draft.recommendations,
      confidenceScore,
    },
  };
}

function buildFallbackEntryInsightPayload(draft: GeneratedInsightDraft): InsightGenerationPayload {
  const confidenceScore = Number(clamp(draft.confidenceScore, 0, 1).toFixed(2));

  return {
    summary: draft.summary,
    alerts: draft.alerts,
    recommendations: draft.recommendations,
    confidenceScore,
    generatedBy: "rule-based",
    modelName: null,
    promptVersion: entryInsightPromptVersion,
    rawOutput: {
      summary: draft.summary,
      alerts: draft.alerts,
      recommendations: draft.recommendations,
      confidenceScore,
    },
  };
}

function getInsightLlmConfig() {
  const apiUrl = process.env.INSIGHT_LLM_API_URL?.trim();
  const apiKey = process.env.INSIGHT_LLM_API_KEY?.trim();
  const model = process.env.INSIGHT_LLM_MODEL?.trim();

  if (!apiUrl || !apiKey || !model) {
    return null;
  }

  return {
    apiUrl,
    apiKey,
    model,
  };
}

function buildInsightLlmMessages(snapshot: InsightSnapshot, draft: GeneratedInsightDraft) {
  return [
    {
      role: "system",
      content:
        "Anda adalah asisten untuk aplikasi parenting. Gunakan hanya fakta dari input. Jangan memberi diagnosis, obat, dosis, atau menambah fakta baru. Balas hanya JSON dengan field summary, alerts, recommendations, confidenceScore.",
    },
    {
      role: "user",
      content: JSON.stringify({
        task: "Rapikan insight anak menjadi narasi yang aman, konsisten, dan non-diagnostik.",
        rules: {
          language: "id-ID",
          nonDiagnostic: true,
          preserveEvidenceOnly: true,
          maxAlerts: 3,
          maxRecommendations: 3,
        },
        snapshot,
        baselineDraft: {
          summary: draft.summary,
          alerts: draft.alerts,
          recommendations: draft.recommendations,
          confidenceScore: Number(draft.confidenceScore.toFixed(2)),
        },
      }),
    },
  ];
}

function buildEntryInsightLlmMessages(
  snapshot: EntryInsightSnapshot,
  draft: GeneratedInsightDraft,
) {
  return [
    {
      role: "system",
      content:
        "Anda membantu membuat insight singkat untuk satu catatan perkembangan anak. Gunakan hanya fakta dari input. Jangan memberi diagnosis, obat, atau menambah fakta baru. Balas hanya JSON dengan field summary, alerts, recommendations, confidenceScore.",
    },
    {
      role: "user",
      content: JSON.stringify({
        task: "Buat insight singkat dan aman untuk satu entry timeline agar orang tua tahu apa yang bisa diamati berikutnya.",
        rules: {
          language: "id-ID",
          nonDiagnostic: true,
          preserveEvidenceOnly: true,
          maxAlerts: 2,
          maxRecommendations: 2,
          concise: true,
        },
        snapshot,
        baselineDraft: {
          summary: draft.summary,
          alerts: draft.alerts,
          recommendations: draft.recommendations,
          confidenceScore: Number(draft.confidenceScore.toFixed(2)),
        },
      }),
    },
  ];
}

function parseChatCompletionContent(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    return null;
  }

  const firstChoice = choices[0];
  if (!firstChoice || typeof firstChoice !== "object") {
    return null;
  }

  const message = (firstChoice as { message?: unknown }).message;
  if (!message || typeof message !== "object") {
    return null;
  }

  const content = (message as { content?: unknown }).content;
  return typeof content === "string" ? content : null;
}

async function generateInsightWithLlm(
  snapshot: InsightSnapshot,
  draft: GeneratedInsightDraft,
): Promise<InsightGenerationPayload> {
  const config = getInsightLlmConfig();
  if (!config) {
    return buildFallbackInsightPayload(draft);
  }

  try {
    const response = await fetch(config.apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.1,
        response_format: {
          type: "json_object",
        },
        messages: buildInsightLlmMessages(snapshot, draft),
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as unknown;
    const content = parseChatCompletionContent(payload);

    if (!content) {
      throw new Error("LLM response content is empty");
    }

    const parsed = llmInsightResponseSchema.parse(JSON.parse(content));
    const confidenceScore = Number(
      clamp(parsed.confidenceScore ?? draft.confidenceScore, 0, 1).toFixed(2),
    );

    return {
      summary: parsed.summary,
      alerts: parsed.alerts,
      recommendations: parsed.recommendations,
      confidenceScore,
      generatedBy: "llm",
      modelName: config.model,
      promptVersion: insightPromptVersion,
      rawOutput: payload as Prisma.InputJsonValue,
    };
  } catch (error) {
    console.error("Failed to generate insight with LLM, falling back to rule-based", error);
    return buildFallbackInsightPayload(draft);
  }
}

async function generateEntryInsightWithLlm(
  snapshot: EntryInsightSnapshot,
  draft: GeneratedInsightDraft,
): Promise<InsightGenerationPayload> {
  const config = getInsightLlmConfig();
  if (!config) {
    return buildFallbackEntryInsightPayload(draft);
  }

  try {
    const response = await fetch(config.apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.1,
        response_format: {
          type: "json_object",
        },
        messages: buildEntryInsightLlmMessages(snapshot, draft),
      }),
    });

    if (!response.ok) {
      throw new Error(`Entry LLM request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as unknown;
    const content = parseChatCompletionContent(payload);

    if (!content) {
      throw new Error("Entry LLM response content is empty");
    }

    const parsed = llmInsightResponseSchema.parse(JSON.parse(content));
    const confidenceScore = Number(
      clamp(parsed.confidenceScore ?? draft.confidenceScore, 0, 1).toFixed(2),
    );

    return {
      summary: parsed.summary,
      alerts: parsed.alerts,
      recommendations: parsed.recommendations,
      confidenceScore,
      generatedBy: "llm",
      modelName: config.model,
      promptVersion: entryInsightPromptVersion,
      rawOutput: payload as Prisma.InputJsonValue,
    };
  } catch (error) {
    console.error("Failed to generate entry insight with LLM, falling back to rule-based", error);
    return buildFallbackEntryInsightPayload(draft);
  }
}

function stableJsonStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJsonStringify(item)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
    left.localeCompare(right),
  );

  return `{${entries
    .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableJsonStringify(entryValue)}`)
    .join(",")}}`;
}

function buildInsightSnapshotHash(snapshot: InsightSnapshot | EntryInsightSnapshot) {
  return createHash("sha256").update(stableJsonStringify(snapshot)).digest("hex");
}

async function buildInsightDraft(childId: string): Promise<InsightBuildResult> {
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

  const focusAreas = child.focusAreas.map((area) => enumToFocusAreaMap[area]);
  const snapshot: InsightSnapshot = {
    childId: child.id,
    childName: child.name,
    focusAreas,
    rangeStart: rangeStart.toISOString(),
    rangeEnd: rangeEnd.toISOString(),
    previousRangeStart: previousRangeStart.toISOString(),
    previousRangeEnd: previousRangeEnd.toISOString(),
    currentEntries: currentEntries.map((entry) => ({
      area: enumToFocusAreaMap[entry.area],
      observedAt: entry.observedAt.toISOString(),
    })),
    previousEntries: previousEntries.map((entry) => ({
      area: enumToFocusAreaMap[entry.area],
    })),
    roadmapItems: roadmapItems.map((item) => ({
      title: item.title,
      status: item.status,
    })),
  };

  const sourceDataHash = buildInsightSnapshotHash(snapshot);

  if (currentEntries.length === 0) {
    return {
      childId,
      snapshot,
      sourceDataHash,
      draft: {
        summary: `Belum ada cukup catatan baru untuk membaca pola ${child.name} minggu ini. Tambahkan observasi rutin agar dashboard bisa merangkum perubahan dengan lebih bermakna. Insight ini bukan diagnosis.`,
        alerts: ["Catatan mingguan masih terbatas sehingga pola belum terlihat jelas."],
        recommendations: buildRecommendations(
          focusAreas[0] ?? null,
          roadmapItems.map((item) => item.title),
        ),
        confidenceScore: 0.25,
        rangeStart,
        rangeEnd,
      },
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
  const dominantArea = pickDominantArea(currentAreaCounts, focusAreas);

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
    childId,
    snapshot,
    sourceDataHash,
    draft: {
      summary: `${growthText} untuk ${child.name}, ${summaryArea}. Pola ini bisa dipakai sebagai bahan diskusi lanjutan bersama pendamping atau profesional, bukan sebagai diagnosis. ${roadmapContext}`,
      alerts,
      recommendations: buildRecommendations(dominantArea, roadmapItems.map((item) => item.title)),
      confidenceScore: clamp(0.35 + currentCount * 0.08, 0.35, 0.92),
      rangeStart,
      rangeEnd,
    },
  };
}

async function buildEntryInsightDraft(progressEntryId: string): Promise<EntryInsightBuildResult> {
  const entry = await prisma.progressEntry.findUniqueOrThrow({
    where: {
      id: progressEntryId,
    },
    select: {
      id: true,
      childId: true,
      area: true,
      inputType: true,
      title: true,
      note: true,
      observedAt: true,
      child: {
        select: {
          id: true,
          name: true,
          focusAreas: true,
        },
      },
      mediaAssets: {
        orderBy: {
          createdAt: "asc",
        },
        take: 1,
        select: {
          processedOutput: true,
          status: true,
        },
      },
    },
  });

  const weeklyInsight = await prisma.insight.findFirst({
    where: {
      childId: entry.childId,
      kind: InsightKind.WEEKLY,
      isActive: true,
      status: "READY",
    },
    orderBy: [{ version: "desc" }, { createdAt: "desc" }],
    select: {
      summary: true,
    },
  });

  const focusAreas = entry.child.focusAreas.map((area) => enumToFocusAreaMap[area]);
  const firstMedia = entry.mediaAssets[0];
  const mediaSummary =
    firstMedia?.processedOutput &&
    typeof firstMedia.processedOutput === "object" &&
    !Array.isArray(firstMedia.processedOutput) &&
    typeof (firstMedia.processedOutput as Record<string, unknown>).summary === "string"
      ? ((firstMedia.processedOutput as Record<string, unknown>).summary as string)
      : null;

  const inputType =
    entry.inputType === "TEXT"
      ? "Teks"
      : entry.inputType === "PHOTO"
        ? "Foto"
        : "Suara";

  const area = enumToFocusAreaMap[entry.area];
  const snapshot: EntryInsightSnapshot = {
    childId: entry.child.id,
    childName: entry.child.name,
    progressEntryId: entry.id,
    area,
    inputType,
    title: entry.title,
    note: entry.note,
    observedAt: entry.observedAt.toISOString(),
    focusAreas,
    weeklyInsightSummary: weeklyInsight?.summary ?? null,
    mediaSummary,
  };

  const sourceDataHash = buildInsightSnapshotHash(snapshot);
  const summary =
    inputType === "Foto"
      ? `Observasi visual di area ${area.toLowerCase()} sudah tersimpan untuk ${entry.child.name}. Catatan berikutnya bisa fokus pada konteks sebelum dan sesudah kejadian agar polanya lebih jelas.`
      : inputType === "Suara"
        ? `Voice note area ${area.toLowerCase()} sudah masuk ke timeline ${entry.child.name}. Gunakan catatan berikutnya untuk menegaskan pemicu, respons anak, dan apa yang membantu.`
        : `Catatan area ${area.toLowerCase()} ini menambah bukti harian untuk ${entry.child.name}. Observasi berikutnya bisa menyorot pemicu, respons, dan perubahan setelah intervensi ringan.`;

  const alerts = [
    area === "Perilaku"
      ? "Perhatikan apakah pola ini sering muncul pada situasi transisi atau perubahan rutinitas."
      : `Catatan ini belum cukup untuk menarik kesimpulan besar, jadi lanjutkan observasi di area ${area.toLowerCase()}.`,
  ];

  const recommendations = [
    `Catat konteks sebelum observasi ${area.toLowerCase()} berikutnya agar pola lebih mudah dibandingkan.`,
    weeklyInsight?.summary
      ? "Bandingkan observasi ini dengan insight mingguan agar tahu apakah polanya konsisten."
      : "Tambahkan satu observasi lanjutan dalam 1-2 hari agar backend punya pembanding yang lebih kuat.",
  ];

  return {
    childId: entry.childId,
    progressEntryId: entry.id,
    snapshot,
    sourceDataHash,
    draft: {
      summary,
      alerts,
      recommendations,
      confidenceScore: inputType === "Teks" ? 0.62 : 0.68,
      rangeStart: entry.observedAt,
      rangeEnd: entry.observedAt,
    },
  };
}

export async function listInsightsForChild(
  childId: string,
  options?: {
    kind?: keyof typeof InsightKind;
    activeOnly?: boolean;
    limit?: number;
  },
) {
  const insights = await prisma.insight.findMany({
    where: {
      childId,
      ...(options?.kind ? { kind: options.kind } : {}),
      ...(options?.activeOnly ? { isActive: true } : {}),
    },
    orderBy: [{ isActive: "desc" }, { version: "desc" }, { createdAt: "desc" }],
    select: insightSelect,
    take: options?.limit ?? 10,
  });

  return insights.map(serializeInsight);
}

export async function getLatestInsightForChild(childId: string) {
  const insight = await prisma.insight.findFirst({
    where: {
      childId,
      kind: InsightKind.WEEKLY,
      isActive: true,
    },
    orderBy: [{ version: "desc" }, { createdAt: "desc" }],
    select: insightSelect,
  });

  return insight ? serializeInsight(insight) : null;
}

export async function getInsightStateForChild(childId: string): Promise<InsightListState> {
  const [latest, insights] = await Promise.all([
    getLatestInsightForChild(childId),
    listInsightsForChild(childId, { kind: InsightKind.WEEKLY }),
  ]);

  return {
    latest,
    insights,
    status: latest?.status ?? "EMPTY",
    isStale: latest?.status === "STALE",
  };
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

export async function markInsightsStaleForChild(childId: string) {
  const staleAt = new Date();

  await prisma.insight.updateMany({
    where: {
      childId,
      kind: InsightKind.WEEKLY,
      isActive: true,
      status: {
        not: "ARCHIVED",
      },
    },
    data: {
      status: "STALE",
      staleAt,
    },
  });
}

async function getLatestInsightVersion(childId: string) {
  const latestVersionRecord = await prisma.insight.findFirst({
    where: {
      childId,
      kind: InsightKind.WEEKLY,
    },
    orderBy: [{ version: "desc" }, { createdAt: "desc" }],
    select: {
      version: true,
    },
  });

  return latestVersionRecord?.version ?? 0;
}

async function setInsightRefreshPending(childId: string) {
  const activeInsight = await prisma.insight.findFirst({
    where: {
      childId,
      kind: InsightKind.WEEKLY,
      isActive: true,
    },
    orderBy: [{ version: "desc" }, { createdAt: "desc" }],
    select: insightSelect,
  });

  if (activeInsight) {
    if (activeInsight.status === "PENDING") {
      return false;
    }

    await prisma.insight.update({
      where: {
        id: activeInsight.id,
      },
      data: {
        status: "PENDING",
        staleAt: activeInsight.staleAt ?? new Date(),
      },
    });

    return true;
  }

  const version = (await getLatestInsightVersion(childId)) + 1;

  await prisma.insight.create({
    data: {
      childId,
      kind: InsightKind.WEEKLY,
      summary: insightPlaceholderSummary,
      alerts: [],
      recommendations: [],
      confidenceScore: 0,
      generatedBy: "system",
      status: "PENDING",
      version,
      promptVersion: insightPromptVersion,
      isActive: true,
      staleAt: new Date(),
    },
    select: {
      id: true,
    },
  });

  return true;
}

async function markInsightRefreshFailed(childId: string, error: unknown) {
  const activeInsight = await prisma.insight.findFirst({
    where: {
      childId,
      kind: InsightKind.WEEKLY,
      isActive: true,
    },
    orderBy: [{ version: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      rawOutput: true,
    },
  });

  if (!activeInsight) {
    return;
  }

  await prisma.insight.update({
    where: {
      id: activeInsight.id,
    },
    data: {
      status: "FAILED",
      rawOutput:
        activeInsight.rawOutput && typeof activeInsight.rawOutput === "object"
          ? {
              ...(activeInsight.rawOutput as Record<string, unknown>),
              error: error instanceof Error ? error.message : "Insight generation failed",
            }
          : {
              error: error instanceof Error ? error.message : "Insight generation failed",
            },
    },
  });
}

export async function scheduleInsightRefreshForChild(childId: string) {
  const shouldRun = await setInsightRefreshPending(childId);
  if (!shouldRun) {
    return;
  }

  void generateInsightForChild(childId).catch(async (error) => {
    await markInsightRefreshFailed(childId, error);
  });
}

export async function generateInsightForChild(childId: string) {
  const { draft, snapshot, sourceDataHash } = await buildInsightDraft(childId);
  const generatedPayload = await generateInsightWithLlm(snapshot, draft);

  const existingInsight = await prisma.insight.findFirst({
    where: {
      childId,
      kind: InsightKind.WEEKLY,
      sourceDataHash,
    },
    orderBy: [{ version: "desc" }, { createdAt: "desc" }],
    select: insightSelect,
  });

  if (existingInsight) {
    await prisma.insight.updateMany({
      where: {
        childId,
        kind: InsightKind.WEEKLY,
        isActive: true,
        id: {
          not: existingInsight.id,
        },
      },
      data: {
        isActive: false,
        status: "ARCHIVED",
      },
    });

    const refreshedInsight = await prisma.insight.update({
      where: {
        id: existingInsight.id,
      },
      data: {
        summary: generatedPayload.summary,
        alerts: generatedPayload.alerts,
        recommendations: generatedPayload.recommendations,
        confidenceScore: generatedPayload.confidenceScore,
        generatedBy: generatedPayload.generatedBy,
        modelName: generatedPayload.modelName,
        promptVersion: generatedPayload.promptVersion,
        rawInput: snapshot,
        rawOutput: generatedPayload.rawOutput,
        isActive: true,
        status: "READY",
        staleAt: null,
        generatedAt: existingInsight.generatedAt ?? new Date(),
      },
      select: insightSelect,
    });

    const serializedInsight = serializeInsight(refreshedInsight);
    await personalizeRoadmapForChild({
      childId,
      latestInsight: serializedInsight,
      trigger: "insight.ready",
    });

    return serializedInsight;
  }

  const latestVersion = await getLatestInsightVersion(childId);

  await prisma.insight.updateMany({
    where: {
      childId,
      kind: InsightKind.WEEKLY,
      isActive: true,
    },
    data: {
      isActive: false,
      status: "ARCHIVED",
    },
  });

  const now = new Date();
  const insight = await prisma.insight.create({
    data: {
      childId,
      kind: InsightKind.WEEKLY,
      summary: generatedPayload.summary,
      alerts: generatedPayload.alerts,
      recommendations: generatedPayload.recommendations,
      confidenceScore: generatedPayload.confidenceScore,
      rangeStart: draft.rangeStart,
      rangeEnd: draft.rangeEnd,
      generatedBy: generatedPayload.generatedBy,
      sourceDataHash,
      status: "READY",
      version: latestVersion + 1,
      modelName: generatedPayload.modelName,
      promptVersion: generatedPayload.promptVersion,
      rawInput: snapshot,
      rawOutput: generatedPayload.rawOutput,
      isActive: true,
      staleAt: null,
      generatedAt: now,
    },
    select: insightSelect,
  });

  const serializedInsight = serializeInsight(insight);
  await personalizeRoadmapForChild({
    childId,
    latestInsight: serializedInsight,
    trigger: "insight.ready",
  });

  return serializedInsight;
}

async function getLatestEntryInsightVersion(progressEntryId: string) {
  const latestVersionRecord = await prisma.insight.findFirst({
    where: {
      progressEntryId,
      kind: InsightKind.ENTRY,
    },
    orderBy: [{ version: "desc" }, { createdAt: "desc" }],
    select: {
      version: true,
    },
  });

  return latestVersionRecord?.version ?? 0;
}

export async function archiveEntryInsightsForProgressEntry(progressEntryId: string) {
  await prisma.insight.updateMany({
    where: {
      progressEntryId,
      kind: InsightKind.ENTRY,
      isActive: true,
    },
    data: {
      isActive: false,
      status: "ARCHIVED",
    },
  });
}

export async function generateEntryInsightForProgressEntry(progressEntryId: string) {
  const { childId, draft, progressEntryId: entryId, snapshot, sourceDataHash } =
    await buildEntryInsightDraft(progressEntryId);
  const generatedPayload = await generateEntryInsightWithLlm(snapshot, draft);

  const existingInsight = await prisma.insight.findFirst({
    where: {
      progressEntryId: entryId,
      kind: InsightKind.ENTRY,
      sourceDataHash,
    },
    orderBy: [{ version: "desc" }, { createdAt: "desc" }],
    select: insightSelect,
  });

  if (existingInsight) {
    await prisma.insight.updateMany({
      where: {
        progressEntryId: entryId,
        kind: InsightKind.ENTRY,
        isActive: true,
        id: {
          not: existingInsight.id,
        },
      },
      data: {
        isActive: false,
        status: "ARCHIVED",
      },
    });

    const refreshedInsight = await prisma.insight.update({
      where: {
        id: existingInsight.id,
      },
      data: {
        summary: generatedPayload.summary,
        alerts: generatedPayload.alerts,
        recommendations: generatedPayload.recommendations,
        confidenceScore: generatedPayload.confidenceScore,
        rangeStart: draft.rangeStart,
        rangeEnd: draft.rangeEnd,
        generatedBy: generatedPayload.generatedBy,
        modelName: generatedPayload.modelName,
        promptVersion: generatedPayload.promptVersion,
        rawInput: snapshot,
        rawOutput: generatedPayload.rawOutput,
        isActive: true,
        status: "READY",
        staleAt: null,
        generatedAt: existingInsight.generatedAt ?? new Date(),
      },
      select: insightSelect,
    });

    await prisma.progressEntry.update({
      where: {
        id: entryId,
      },
      data: {
        insight: generatedPayload.summary,
      },
    });

    return serializeInsight(refreshedInsight);
  }

  const latestVersion = await getLatestEntryInsightVersion(entryId);

  await prisma.insight.updateMany({
    where: {
      progressEntryId: entryId,
      kind: InsightKind.ENTRY,
      isActive: true,
    },
    data: {
      isActive: false,
      status: "ARCHIVED",
    },
  });

  const now = new Date();
  const insight = await prisma.insight.create({
    data: {
      childId,
      progressEntryId: entryId,
      kind: InsightKind.ENTRY,
      summary: generatedPayload.summary,
      alerts: generatedPayload.alerts,
      recommendations: generatedPayload.recommendations,
      confidenceScore: generatedPayload.confidenceScore,
      rangeStart: draft.rangeStart,
      rangeEnd: draft.rangeEnd,
      generatedBy: generatedPayload.generatedBy,
      sourceDataHash,
      status: "READY",
      version: latestVersion + 1,
      modelName: generatedPayload.modelName,
      promptVersion: generatedPayload.promptVersion,
      rawInput: snapshot,
      rawOutput: generatedPayload.rawOutput,
      isActive: true,
      staleAt: null,
      generatedAt: now,
    },
    select: insightSelect,
  });

  await prisma.progressEntry.update({
    where: {
      id: entryId,
    },
    data: {
      insight: generatedPayload.summary,
    },
  });

  return serializeInsight(insight);
}

export async function getLatestOrGeneratedInsightForChild(childId: string) {
  const latestInsight = await getLatestInsightForChild(childId);
  if (latestInsight) {
    return latestInsight;
  }

  return null;
}
