import { RoadmapStatus } from "../generated/prisma/enums";

import { mapFocusAreasToLabel } from "./children";
import type { SerializedRoadmapItem } from "./roadmap";
import { prisma } from "./prisma";
import { getLatestInsightForChild } from "./insights";
import { ensureInitialRoadmapForChild } from "./roadmap";

export type DashboardMetricSummary = {
  notesThisWeek: number;
  completedActivities: number;
  achievedTargets: number;
  alertCount: number;
};

export type DashboardChartPoint = {
  label: string;
  value: number;
};

export type DashboardActivity = {
  title: string;
  body: string;
  area: string;
  actionType: "practice" | "observe" | "record";
};

export type DashboardSpotlight = {
  message: string;
  area: string | null;
  suggestedAction: "insight" | "consultation";
};

export type DashboardFocusTarget = {
  id: string;
  title: string;
  area: string;
  status: string;
  statusLabel: string;
  progressPercent: number;
};

export type DashboardResponse = {
  metrics: DashboardMetricSummary;
  chart: DashboardChartPoint[];
  trend: {
    direction: "up" | "flat";
    label: string;
    delta: number;
  };
  latestInsight: Awaited<ReturnType<typeof getLatestInsightForChild>>;
  activities: DashboardActivity[];
  roadmapPreview: SerializedRoadmapItem[];
  focusTargets: DashboardFocusTarget[];
  spotlight: DashboardSpotlight | null;
  dailyDots: boolean[];
  meta: {
    hasMeaningfulProgress: boolean;
    hasCurrentWeekEntries: boolean;
    usesSeedRoadmap: boolean;
    shouldUsePlaceholder: boolean;
    todayIndex: number;
  };
};

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

const weekdayLabels = ["M", "S", "S", "R", "K", "J", "S"];

function computeProgressPercent(item: SerializedRoadmapItem): number {
  switch (item.status) {
    case RoadmapStatus.ACHIEVED:
      return 100;
    case RoadmapStatus.IN_PROGRESS:
      return Math.min(90, Math.max(20, Math.round(item.confidenceScore * 100)));
    case RoadmapStatus.NEEDS_ATTENTION:
      return Math.min(50, Math.max(10, Math.round(item.confidenceScore * 100)));
    case RoadmapStatus.NEXT_TARGET:
      return 5;
    default:
      return 0;
  }
}

function statusToLabel(status: string): string {
  switch (status) {
    case RoadmapStatus.ACHIEVED:
      return "Tercapai";
    case RoadmapStatus.IN_PROGRESS:
      return "Sedang berjalan";
    case RoadmapStatus.NEEDS_ATTENTION:
      return "Perlu perhatian";
    case RoadmapStatus.NEXT_TARGET:
      return "Target berikutnya";
    case "PAUSED":
      return "Dijeda";
    default:
      return status;
  }
}

export async function buildDashboardForChild(childId: string): Promise<DashboardResponse> {
  const now = new Date();
  const chartStart = addDays(startOfDay(now), -6);
  const previousWeekStart = addDays(startOfDay(now), -13);
  const previousWeekEnd = addDays(startOfDay(now), -7);

  const child = await prisma.child.findUniqueOrThrow({
    where: {
      id: childId,
    },
    select: {
      id: true,
      focusAreas: true,
      condition: true,
      birthDate: true,
      routine: true,
      supportNeed: true,
    },
  });

  const [latestInsight, roadmapItems, weekEntries, previousWeekCount, totalProgressCount] =
    await Promise.all([
    getLatestInsightForChild(childId),
    ensureInitialRoadmapForChild({
      childId,
      focusAreas: mapFocusAreasToLabel(child.focusAreas),
      condition: child.condition,
      birthDate: child.birthDate,
      routine: child.routine,
      supportNeed: child.supportNeed,
    }),
    prisma.progressEntry.findMany({
      where: {
        childId,
        deletedAt: null,
        observedAt: {
          gte: chartStart,
          lte: now,
        },
      },
      select: {
        id: true,
        observedAt: true,
      },
      orderBy: [{ observedAt: "asc" }],
    }),
    prisma.progressEntry.count({
      where: {
        childId,
        deletedAt: null,
        observedAt: {
          gte: previousWeekStart,
          lte: previousWeekEnd,
        },
      },
    }),
    prisma.progressEntry.count({
      where: {
        childId,
        deletedAt: null,
      },
    }),
  ]);

  const chart = Array.from({ length: 7 }, (_, index) => {
    const dayStart = addDays(chartStart, index);
    const dayEnd = addDays(dayStart, 1);
    const value = weekEntries.filter(
      (entry) => entry.observedAt >= dayStart && entry.observedAt < dayEnd,
    ).length;

    return {
      label: weekdayLabels[index],
      value,
    };
  });

  // Compute daily dots (boolean per day: has entry or not)
  const dailyDots = Array.from({ length: 7 }, (_, index) => {
    const dayStart = addDays(chartStart, index);
    const dayEnd = addDays(dayStart, 1);
    return weekEntries.some(
      (entry) => entry.observedAt >= dayStart && entry.observedAt < dayEnd,
    );
  });

  // Today's index in the 7-day window (0-6)
  const todayStart = startOfDay(now);
  const todayIndex = Math.round(
    (todayStart.getTime() - chartStart.getTime()) / (24 * 60 * 60 * 1000),
  );

  const notesThisWeek = weekEntries.length;
  const hasMeaningfulProgress = totalProgressCount > 0;
  const shouldUsePlaceholder = !hasMeaningfulProgress;
  const usesSeedRoadmap = shouldUsePlaceholder && roadmapItems.length > 0;
  const achievedTargets = roadmapItems.filter((item) => item.status === RoadmapStatus.ACHIEVED).length;
  const activeRoadmapCount = roadmapItems.filter(
    (item) => item.status === RoadmapStatus.IN_PROGRESS || item.status === RoadmapStatus.ACHIEVED,
  ).length;
  const alertCount = hasMeaningfulProgress ? latestInsight?.alerts.length ?? 0 : 0;
  const delta = notesThisWeek - previousWeekCount;

  // Build spotlight from the most important alert
  let spotlight: DashboardSpotlight | null = null;
  if (hasMeaningfulProgress && latestInsight && latestInsight.alerts.length > 0) {
    spotlight = {
      message: latestInsight.alerts[0],
      area: roadmapItems.find((item) => item.status === RoadmapStatus.NEEDS_ATTENTION)?.area ?? null,
      suggestedAction: "insight",
    };
  }

  // Build focus targets: top 2 most relevant roadmap items
  const focusTargets: DashboardFocusTarget[] = hasMeaningfulProgress
    ? roadmapItems
        .filter((item) => item.status === RoadmapStatus.IN_PROGRESS || item.status === RoadmapStatus.NEEDS_ATTENTION)
        .sort((a, b) => {
          // Prioritize items closer to achieved (higher confidence)
          return b.confidenceScore - a.confidenceScore;
        })
        .slice(0, 2)
        .map((item) => ({
          id: item.id,
          title: item.title,
          area: item.area,
          status: item.status,
          statusLabel: statusToLabel(item.status),
          progressPercent: computeProgressPercent(item),
        }))
    : [];

  const recommendations =
    hasMeaningfulProgress ? latestInsight?.recommendations.slice(0, 2) ?? [] : [];
  const activities: DashboardActivity[] = recommendations.map((body, index) => ({
    title:
      index === 0
        ? "Fokus latihan hari ini"
        : "Observasi yang bisa dicatat",
    body,
    area: roadmapItems[index]?.area ?? "Rutinitas",
    actionType: index === 0 ? "practice" as const : "observe" as const,
  }));

  return {
    metrics: {
      notesThisWeek: hasMeaningfulProgress ? notesThisWeek : 0,
      completedActivities: hasMeaningfulProgress ? activeRoadmapCount : 0,
      achievedTargets: hasMeaningfulProgress ? achievedTargets : 0,
      alertCount,
    },
    chart: hasMeaningfulProgress ? chart : [],
    trend: {
      direction: delta > 0 ? "up" : "flat",
      label: hasMeaningfulProgress ? (delta > 0 ? `+${delta}` : "Stabil") : "",
      delta,
    },
    latestInsight: hasMeaningfulProgress ? latestInsight : null,
    activities: hasMeaningfulProgress ? activities : [],
    roadmapPreview: hasMeaningfulProgress ? roadmapItems.slice(0, 4) : [],
    focusTargets,
    spotlight,
    dailyDots: hasMeaningfulProgress ? dailyDots : [],
    meta: {
      hasMeaningfulProgress,
      hasCurrentWeekEntries: notesThisWeek > 0,
      usesSeedRoadmap,
      shouldUsePlaceholder,
      todayIndex,
    },
  };
}
