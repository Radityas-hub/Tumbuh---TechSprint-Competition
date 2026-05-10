import type { Prisma } from "../generated/prisma/client";
import { FocusArea, RoadmapStatus } from "../generated/prisma/enums";

import { createAuditLog } from "./audit";
import { mapFocusAreasToLabel, type FocusAreaLabel } from "./children";
import type { SerializedInsight } from "./insights";
import { prisma } from "./prisma";
import { z } from "./api/validation";

const roadmapLlmPromptVersion = "roadmap-personalization-v1";

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

const roadmapStatusValues = [
  RoadmapStatus.ACHIEVED,
  RoadmapStatus.IN_PROGRESS,
  RoadmapStatus.NEXT_TARGET,
  RoadmapStatus.NEEDS_ATTENTION,
  RoadmapStatus.PAUSED,
] as const;

const roadmapAdjustmentSchema = z.object({
  changes: z
    .array(
      z.object({
        itemId: z.string().trim().min(1).optional(),
        action: z.enum(["update", "reprioritize", "pause", "add"]),
        area: z.enum(["Komunikasi", "Motorik", "Perilaku", "Akademik"]).optional(),
        title: z.string().trim().min(1).max(120).optional(),
        status: z.enum(roadmapStatusValues).optional(),
        detail: z.string().trim().min(1).max(300).optional(),
        evidence: z.array(z.string().trim().min(1).max(200)).max(4).optional(),
        confidenceScore: z.number().min(0).max(1).optional(),
        reason: z.string().trim().min(1).max(240).optional(),
      }),
    )
    .max(5),
  summary: z.string().trim().min(1).max(600),
});

type RoadmapSnapshot = {
  child: {
    id: string;
    name: string;
    condition: string;
    focusAreas: FocusAreaLabel[];
    routine: string | null;
    supportNeed: string | null;
  };
  latestInsight: {
    id: string;
    summary: string;
    alerts: string[];
    recommendations: string[];
    confidenceScore: number;
    generatedAt: string | null;
    modelName: string | null;
    promptVersion: string | null;
  } | null;
  progressSummary: {
    dominantArea: FocusAreaLabel | null;
    currentWeekCount: number;
    previousWeekCount: number;
    recentEvidence: Record<FocusAreaLabel, string[]>;
  };
  roadmap: Array<{
    id: string;
    area: FocusAreaLabel;
    title: string;
    detail: string | null;
    status: keyof typeof RoadmapStatus;
    confidenceScore: number;
    sortOrder: number;
    achievedAt: string | null;
  }>;
};

type RuleBasedRoadmapChange = {
  itemId: string;
  status: keyof typeof RoadmapStatus;
  detail: string | null;
  evidence: string[];
  confidenceScore: number;
  sortOrder: number;
  reason: string;
};

type RoadmapLlmChange = z.infer<typeof roadmapAdjustmentSchema>["changes"][number];

type PersonalizeRoadmapInput = {
  childId: string;
  guardianId?: string | null;
  trigger: "insight.ready" | "manual" | "seed";
  latestInsight?: SerializedInsight | null;
};

type RoadmapItemRecord = Awaited<ReturnType<typeof getRoadmapRecordsForChild>>[number];

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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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

function parseEvidence(value: Prisma.JsonValue | null): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

async function getRoadmapRecordsForChild(childId: string) {
  return prisma.roadmapItem.findMany({
    where: {
      childId,
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
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
    },
  });
}

function pickDominantArea(
  counts: Partial<Record<FocusAreaLabel, number>>,
  focusAreas: FocusAreaLabel[],
) {
  const areas = focusAreas.length > 0 ? focusAreas : (Object.keys(counts) as FocusAreaLabel[]);

  return areas.reduce<FocusAreaLabel | null>((best, area) => {
    if (!best) {
      return area;
    }

    return (counts[area] ?? 0) > (counts[best] ?? 0) ? area : best;
  }, areas[0] ?? null);
}

function buildEvidenceLine(date: Date, content: string) {
  const day = date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });

  const normalized = content.trim().replace(/\s+/g, " ");
  return `${day}: ${normalized.slice(0, 120)}`;
}

function roadmapTitleMatchesPriority(
  item: RoadmapItemRecord,
  latestInsight: RoadmapSnapshot["latestInsight"],
) {
  if (!latestInsight) {
    return false;
  }

  const haystack = `${latestInsight.summary} ${latestInsight.alerts.join(" ")} ${latestInsight.recommendations.join(" ")}`.toLowerCase();
  const title = item.title.toLowerCase();

  return (
    (title.includes("transisi") && haystack.includes("transisi")) ||
    (title.includes("emosi") && (haystack.includes("emosi") || haystack.includes("regulasi"))) ||
    (title.includes("kontak mata") && haystack.includes("komunikasi")) ||
    (title.includes("meminta bantuan") && haystack.includes("komunikasi")) ||
    (title.includes("instruksi") && haystack.includes("instruksi")) ||
    (title.includes("motorik") && haystack.includes("motorik"))
  );
}

function buildRuleBasedChanges(
  snapshot: RoadmapSnapshot,
  items: RoadmapItemRecord[],
): RuleBasedRoadmapChange[] {
  const dominantArea = snapshot.progressSummary.dominantArea ?? snapshot.child.focusAreas[0] ?? null;
  const focusAreaPriority = snapshot.child.focusAreas;

  const scoredItems = items.map((item) => {
    const area = enumToFocusAreaMap[item.area];
    let score = 0;

    if (item.status === RoadmapStatus.ACHIEVED) {
      score -= 2;
    }

    if (dominantArea && area === dominantArea) {
      score += 4;
    }

    if (focusAreaPriority.includes(area)) {
      score += 2;
    }

    if (roadmapTitleMatchesPriority(item, snapshot.latestInsight)) {
      score += 3;
    }

    score += Math.min(snapshot.progressSummary.recentEvidence[area].length, 3);

    return {
      item,
      area,
      score,
    };
  });

  const reprioritized = [...scoredItems].sort((left, right) => right.score - left.score || left.item.sortOrder - right.item.sortOrder);

  const topActiveItem = reprioritized.find((entry) => entry.item.status !== RoadmapStatus.ACHIEVED);
  const secondaryItem = reprioritized.find(
    (entry) => entry.item.id !== topActiveItem?.item.id && entry.item.status !== RoadmapStatus.ACHIEVED,
  );

  return reprioritized.map((entry, index) => {
    const relevantEvidence = snapshot.progressSummary.recentEvidence[entry.area].slice(0, 2);
    const existingEvidence = parseEvidence(entry.item.evidence).slice(0, 1);
    const evidence = Array.from(new Set([...relevantEvidence, ...existingEvidence])).slice(0, 3);

    const recommendation =
      snapshot.latestInsight?.recommendations.find((line) => {
        const normalized = line.toLowerCase();
        return (
          (entry.area === "Perilaku" && (normalized.includes("transisi") || normalized.includes("emosi"))) ||
          (entry.area === "Komunikasi" && normalized.includes("komunikasi")) ||
          (entry.area === "Motorik" && normalized.includes("gerak")) ||
          (entry.area === "Akademik" && normalized.includes("instruksi"))
        );
      }) ?? null;

    let status = entry.item.status;

    if (entry.item.status !== RoadmapStatus.ACHIEVED) {
      if (topActiveItem?.item.id === entry.item.id) {
        status =
          entry.area === dominantArea && snapshot.latestInsight?.alerts.length
            ? RoadmapStatus.NEEDS_ATTENTION
            : RoadmapStatus.IN_PROGRESS;
      } else if (secondaryItem?.item.id === entry.item.id) {
        status = RoadmapStatus.NEXT_TARGET;
      } else if (!focusAreaPriority.includes(entry.area) && relevantEvidence.length === 0) {
        status = RoadmapStatus.PAUSED;
      } else {
        status = RoadmapStatus.NEXT_TARGET;
      }
    }

    const detail =
      topActiveItem?.item.id === entry.item.id && recommendation
        ? recommendation
        : entry.item.detail;

    const confidenceScore = Number(
      clamp(
        0.42 +
          entry.score * 0.07 +
          Math.min(snapshot.progressSummary.recentEvidence[entry.area].length, 2) * 0.05,
        0.35,
        0.95,
      ).toFixed(2),
    );

    return {
      itemId: entry.item.id,
      status,
      detail,
      evidence:
        evidence.length > 0
          ? evidence
          : parseEvidence(entry.item.evidence).slice(0, 2),
      confidenceScore,
      sortOrder: index,
      reason:
        topActiveItem?.item.id === entry.item.id
          ? `Target ini diprioritaskan karena paling relevan dengan pola ${entry.area.toLowerCase()} terbaru.`
          : `Target diurutkan ulang berdasarkan fokus area dan evidence child terbaru.`,
    };
  });
}

function getRoadmapLlmConfig() {
  const apiUrl = process.env.INSIGHT_LLM_API_URL?.trim() ?? "";
  const apiKey = process.env.INSIGHT_LLM_API_KEY?.trim() ?? "";
  const model = process.env.INSIGHT_LLM_MODEL?.trim() ?? "";

  if (!apiUrl || !apiKey || !model) {
    return null;
  }

  return {
    apiUrl,
    apiKey,
    model,
  };
}

function buildRoadmapLlmMessages(
  snapshot: RoadmapSnapshot,
  ruleChanges: RuleBasedRoadmapChange[],
) {
  return [
    {
      role: "system",
      content:
        "Anda membantu personalisasi roadmap perkembangan anak. Gunakan hanya data input. Jangan memberi diagnosis, obat, atau menambah fakta baru. Balas hanya JSON dengan field summary dan changes. changes hanya boleh memakai action update, reprioritize, pause, add.",
    },
    {
      role: "user",
      content: JSON.stringify({
        task: "Sarankan penyesuaian roadmap yang lebih spesifik per child, tetap aman dan non-diagnostik.",
        rules: {
          language: "id-ID",
          maxChanges: 4,
          maxAdditions: 1,
          preserveEvidenceOnly: true,
        },
        snapshot,
        baselineChanges: ruleChanges,
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

async function generateRoadmapLlmChanges(
  snapshot: RoadmapSnapshot,
  ruleChanges: RuleBasedRoadmapChange[],
) {
  const config = getRoadmapLlmConfig();
  if (!config || !snapshot.latestInsight) {
    return {
      changes: [] as RoadmapLlmChange[],
      summary: "Roadmap dipersonalisasi dengan rule backend.",
      modelName: null as string | null,
      promptVersion: roadmapLlmPromptVersion,
      rawOutput: {
        summary: "Roadmap dipersonalisasi dengan rule backend.",
        changes: [],
      } as Prisma.InputJsonValue,
      source: "rule-based" as const,
    };
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
        messages: buildRoadmapLlmMessages(snapshot, ruleChanges),
      }),
    });

    if (!response.ok) {
      throw new Error(`Roadmap LLM request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as unknown;
    const content = parseChatCompletionContent(payload);

    if (!content) {
      throw new Error("Roadmap LLM response content is empty");
    }

    const rawParsed = JSON.parse(content) as Record<string, unknown>;

    // Sanitize LLM output before Zod validation: truncate long strings, normalize invalid enums
    if (Array.isArray(rawParsed.changes)) {
      for (const change of rawParsed.changes as Record<string, unknown>[]) {
        if (typeof change.detail === "string" && change.detail.length > 300) {
          change.detail = change.detail.slice(0, 297) + "...";
        }
        if (typeof change.title === "string" && change.title.length > 120) {
          change.title = change.title.slice(0, 117) + "...";
        }
        if (typeof change.reason === "string" && change.reason.length > 240) {
          change.reason = change.reason.slice(0, 237) + "...";
        }
        if (change.status && !roadmapStatusValues.includes(change.status as typeof roadmapStatusValues[number])) {
          change.status = undefined;
        }
        if (Array.isArray(change.evidence)) {
          change.evidence = (change.evidence as string[]).map((e) =>
            typeof e === "string" && e.length > 200 ? e.slice(0, 197) + "..." : e
          ).slice(0, 4);
        }
      }
    }
    if (typeof rawParsed.summary === "string" && rawParsed.summary.length > 600) {
      rawParsed.summary = rawParsed.summary.slice(0, 597) + "...";
    }

    const parsed = roadmapAdjustmentSchema.parse(rawParsed);

    return {
      changes: parsed.changes,
      summary: parsed.summary,
      modelName: config.model,
      promptVersion: roadmapLlmPromptVersion,
      rawOutput: payload as Prisma.InputJsonValue,
      source: "llm" as const,
    };
  } catch (error) {
    console.error("Failed to personalize roadmap with LLM, using rule-based changes", error);
    return {
      changes: [] as RoadmapLlmChange[],
      summary: "Roadmap dipersonalisasi dengan rule backend.",
      modelName: null as string | null,
      promptVersion: roadmapLlmPromptVersion,
      rawOutput: {
        summary: "Roadmap dipersonalisasi dengan rule backend.",
        changes: [],
      } as Prisma.InputJsonValue,
      source: "rule-based" as const,
    };
  }
}

function mergeRoadmapChanges(
  items: RoadmapItemRecord[],
  ruleChanges: RuleBasedRoadmapChange[],
  llmChanges: RoadmapLlmChange[],
) {
  const merged = new Map<string, RuleBasedRoadmapChange>();
  for (const change of ruleChanges) {
    merged.set(change.itemId, change);
  }

  const itemIds = new Set(items.map((item) => item.id));
  let addedCount = 0;

  for (const change of llmChanges) {
    if (change.action === "add") {
      addedCount += 1;
      continue;
    }

    if (!change.itemId || !itemIds.has(change.itemId)) {
      continue;
    }

    const current = merged.get(change.itemId);
    if (!current) {
      continue;
    }

    // Never let LLM override ACHIEVED status set by guardian
    if (current.status === RoadmapStatus.ACHIEVED) {
      continue;
    }

    const actionStatus =
      change.action === "pause"
        ? RoadmapStatus.PAUSED
        : change.status;

    merged.set(change.itemId, {
      ...current,
      status: actionStatus ?? current.status,
      detail: change.detail ?? current.detail,
      evidence: change.evidence && change.evidence.length > 0 ? change.evidence : current.evidence,
      confidenceScore:
        change.confidenceScore !== undefined
          ? Number(clamp(change.confidenceScore, 0, 1).toFixed(2))
          : current.confidenceScore,
      reason: change.reason ?? current.reason,
    });
  }

  return {
    itemChanges: Array.from(merged.values())
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((change, index) => ({
        ...change,
        sortOrder: index,
      })),
    addChanges: llmChanges
      .filter((change) => change.action === "add")
      .slice(0, Math.min(addedCount, 1)),
  };
}

async function buildRoadmapSnapshot(
  childId: string,
  latestInsight: SerializedInsight | null,
  items: RoadmapItemRecord[],
): Promise<RoadmapSnapshot> {
  const now = new Date();
  const currentStart = addDays(startOfDay(now), -13);
  const previousStart = addDays(startOfDay(now), -27);
  const previousEnd = addDays(startOfDay(now), -14);

  const [child, currentEntries, previousEntries] = await Promise.all([
    prisma.child.findUniqueOrThrow({
      where: {
        id: childId,
      },
      select: {
        id: true,
        name: true,
        condition: true,
        focusAreas: true,
        routine: true,
        supportNeed: true,
      },
    }),
    prisma.progressEntry.findMany({
      where: {
        childId,
        deletedAt: null,
        observedAt: {
          gte: currentStart,
          lte: now,
        },
      },
      orderBy: [{ observedAt: "desc" }],
      select: {
        area: true,
        title: true,
        note: true,
        observedAt: true,
      },
      take: 20,
    }),
    prisma.progressEntry.findMany({
      where: {
        childId,
        deletedAt: null,
        observedAt: {
          gte: previousStart,
          lte: previousEnd,
        },
      },
      select: {
        area: true,
      },
    }),
  ]);

  const focusAreas = mapFocusAreasToLabel(child.focusAreas);
  const counts = currentEntries.reduce<Partial<Record<FocusAreaLabel, number>>>((accumulator, entry) => {
    const area = enumToFocusAreaMap[entry.area];
    accumulator[area] = (accumulator[area] ?? 0) + 1;
    return accumulator;
  }, {});

  const recentEvidence = currentEntries.reduce<Record<FocusAreaLabel, string[]>>(
    (accumulator, entry) => {
      const area = enumToFocusAreaMap[entry.area];
      const content = entry.note ?? entry.title ?? "Observasi baru tercatat.";
      accumulator[area].push(buildEvidenceLine(entry.observedAt, content));
      return accumulator;
    },
    {
      Komunikasi: [],
      Motorik: [],
      Perilaku: [],
      Akademik: [],
    },
  );

  return {
    child: {
      id: child.id,
      name: child.name,
      condition: child.condition,
      focusAreas,
      routine: child.routine,
      supportNeed: child.supportNeed,
    },
    latestInsight: latestInsight
      ? {
          id: latestInsight.id,
          summary: latestInsight.summary,
          alerts: latestInsight.alerts,
          recommendations: latestInsight.recommendations,
          confidenceScore: latestInsight.confidenceScore,
          generatedAt: latestInsight.generatedAt,
          modelName: latestInsight.modelName,
          promptVersion: latestInsight.promptVersion,
        }
      : null,
    progressSummary: {
      dominantArea: pickDominantArea(counts, focusAreas),
      currentWeekCount: currentEntries.length,
      previousWeekCount: previousEntries.length,
      recentEvidence,
    },
    roadmap: items.map((item) => ({
      id: item.id,
      area: enumToFocusAreaMap[item.area],
      title: item.title,
      detail: item.detail,
      status: item.status,
      confidenceScore: item.confidenceScore,
      sortOrder: item.sortOrder,
      achievedAt: item.achievedAt?.toISOString() ?? null,
    })),
  };
}

export async function personalizeRoadmapForChild(input: PersonalizeRoadmapInput) {
  const items = await getRoadmapRecordsForChild(input.childId);
  if (items.length === 0) {
    return {
      applied: false,
      reason: "No roadmap items found",
      items: [],
    };
  }

  const latestInsight =
    input.latestInsight ??
    (await prisma.insight.findFirst({
      where: {
        childId: input.childId,
        kind: "WEEKLY",
        isActive: true,
        status: "READY",
      },
      orderBy: [{ version: "desc" }, { createdAt: "desc" }],
      select: {
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
      },
    }).then((insight) =>
      insight
        ? {
            id: insight.id,
            childId: insight.childId,
            progressEntryId: insight.progressEntryId,
            kind: insight.kind,
            summary: insight.summary,
            alerts: Array.isArray(insight.alerts)
              ? insight.alerts.filter((item): item is string => typeof item === "string")
              : [],
            recommendations: Array.isArray(insight.recommendations)
              ? insight.recommendations.filter((item): item is string => typeof item === "string")
              : [],
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
          }
        : null,
    ));

  const snapshot = await buildRoadmapSnapshot(input.childId, latestInsight ?? null, items);
  const ruleChanges = buildRuleBasedChanges(snapshot, items);
  const llmResult = await generateRoadmapLlmChanges(snapshot, ruleChanges);
  const merged = mergeRoadmapChanges(items, ruleChanges, llmResult.changes);
  const now = new Date();

  const itemById = new Map(items.map((item) => [item.id, item]));
  const changedItems: string[] = [];

  for (const change of merged.itemChanges) {
    const current = itemById.get(change.itemId);
    if (!current) {
      continue;
    }

    // Skip items where nothing meaningful changed to avoid unnecessary rewrites
    const statusUnchanged = change.status === current.status;
    const detailUnchanged = change.detail === current.detail;
    const sortOrderUnchanged = change.sortOrder === current.sortOrder;
    const confidenceUnchanged = change.confidenceScore === current.confidenceScore;
    const existingEvidence = parseEvidence(current.evidence);
    const evidenceUnchanged =
      change.evidence.length === existingEvidence.length &&
      change.evidence.every((line, idx) => line === existingEvidence[idx]);

    if (statusUnchanged && detailUnchanged && sortOrderUnchanged && confidenceUnchanged && evidenceUnchanged) {
      continue;
    }

    const source =
      llmResult.changes.some((entry) => entry.itemId === change.itemId) && llmResult.source === "llm"
        ? "llm"
        : "rule-based";

    await prisma.roadmapItem.update({
      where: {
        id: change.itemId,
      },
      data: {
        status: change.status,
        detail: change.detail,
        evidence: change.evidence,
        confidenceScore: change.confidenceScore,
        sortOrder: change.sortOrder,
        achievedAt: change.status === RoadmapStatus.ACHIEVED ? current.achievedAt ?? now : null,
        lastPersonalizedAt: now,
        personalizationSource: source,
        sourceInsightId: latestInsight?.id ?? null,
        personalizationReason: change.reason,
      } as Prisma.RoadmapItemUncheckedUpdateInput,
    });

    changedItems.push(change.itemId);
  }

  let createdItemId: string | null = null;
  if (merged.addChanges.length > 0) {
    const addChange = merged.addChanges[0];
    if (addChange.area && addChange.title && addChange.detail) {
      const addTitle = addChange.title;
      const duplicate = items.find((item) => item.title.toLowerCase() === addTitle.toLowerCase());
      if (!duplicate) {
        const created = await prisma.roadmapItem.create({
          data: {
            childId: input.childId,
            area: focusAreaToEnumMap[addChange.area],
            title: addTitle,
            detail: addChange.detail,
            status: addChange.status ?? RoadmapStatus.NEXT_TARGET,
            evidence: addChange.evidence ?? [],
            confidenceScore: Number(clamp(addChange.confidenceScore ?? 0.62, 0, 1).toFixed(2)),
            sortOrder: items.length + 1,
            lastPersonalizedAt: now,
            personalizationSource: llmResult.source,
            sourceInsightId: latestInsight?.id ?? null,
            personalizationReason: addChange.reason ?? "Target baru ditambahkan dari personalisasi roadmap.",
          } as Prisma.RoadmapItemUncheckedCreateInput,
          select: {
            id: true,
          },
        });

        createdItemId = created.id;
        changedItems.push(created.id);
      }
    }
  }

  await createAuditLog({
    guardianId: input.guardianId ?? null,
    childId: input.childId,
    action: "roadmap.personalized",
    metadata: {
      trigger: input.trigger,
      insightId: latestInsight?.id ?? null,
      modelName: llmResult.modelName,
      promptVersion: llmResult.promptVersion,
      personalizationSource: llmResult.source,
      changedItemIds: changedItems,
      createdItemId,
      snapshotHash: stableJsonStringify(snapshot),
      summary: llmResult.summary,
    },
  });

  const updatedItems = await getRoadmapRecordsForChild(input.childId);

  // If all items are ACHIEVED after personalization, seed next targets
  const allAchieved = updatedItems.every((item) => item.status === RoadmapStatus.ACHIEVED);
  if (allAchieved && updatedItems.length > 0) {
    const { seedNextTargetsIfAllAchieved } = await import("./roadmap");
    await seedNextTargetsIfAllAchieved(input.childId);
    const refreshedItems = await getRoadmapRecordsForChild(input.childId);
    return {
      applied: true,
      source: llmResult.source,
      modelName: llmResult.modelName,
      promptVersion: llmResult.promptVersion,
      summary: llmResult.summary,
      items: refreshedItems,
    };
  }

  return {
    applied: true,
    source: llmResult.source,
    modelName: llmResult.modelName,
    promptVersion: llmResult.promptVersion,
    summary: llmResult.summary,
    items: updatedItems,
  };
}
