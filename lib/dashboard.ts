import { RoadmapStatus } from "../generated/prisma/enums";

import { mapFocusAreasToLabel } from "./children";
import type { SerializedRoadmapItem } from "./roadmap";
import { prisma } from "./prisma";
import { getLatestOrGeneratedInsightForChild } from "./insights";
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
};

export type DashboardResponse = {
  metrics: DashboardMetricSummary;
  chart: DashboardChartPoint[];
  trend: {
    direction: "up" | "flat";
    label: string;
  };
  latestInsight: Awaited<ReturnType<typeof getLatestOrGeneratedInsightForChild>>;
  activities: DashboardActivity[];
  roadmapPreview: SerializedRoadmapItem[];
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
    },
  });

  const [latestInsight, roadmapItems, weekEntries, previousWeekCount] = await Promise.all([
    getLatestOrGeneratedInsightForChild(childId),
    ensureInitialRoadmapForChild({
      childId,
      focusAreas: mapFocusAreasToLabel(child.focusAreas),
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

  const notesThisWeek = weekEntries.length;
  const achievedTargets = roadmapItems.filter((item) => item.status === RoadmapStatus.ACHIEVED).length;
  const activeRoadmapCount = roadmapItems.filter(
    (item) => item.status === RoadmapStatus.IN_PROGRESS || item.status === RoadmapStatus.ACHIEVED,
  ).length;
  const alertCount = latestInsight.alerts.length;
  const delta = notesThisWeek - previousWeekCount;

  const recommendations = latestInsight.recommendations.slice(0, 3);
  const activities: DashboardActivity[] = recommendations.map((body, index) => ({
    title:
      index === 0
        ? "Fokus latihan hari ini"
        : index === 1
          ? "Observasi yang bisa dicatat"
          : "Langkah kecil berikutnya",
    body,
    area: roadmapItems[index]?.area ?? "Rutinitas",
  }));

  return {
    metrics: {
      notesThisWeek,
      completedActivities: activeRoadmapCount,
      achievedTargets,
      alertCount,
    },
    chart,
    trend: {
      direction: delta > 0 ? "up" : "flat",
      label: delta > 0 ? `+${delta}` : "Stabil",
    },
    latestInsight,
    activities,
    roadmapPreview: roadmapItems.slice(0, 4),
  };
}
