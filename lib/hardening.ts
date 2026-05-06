import { prisma } from "./prisma";
import { getOwnedChildForGuardian, serializeChild } from "./children";
import { listConsentsForChild } from "./consents";
import { listProgressEntriesForChild } from "./progress";
import { listRoadmapItemsForChild } from "./roadmap";
import { listInsightsForChild } from "./insights";

export async function listAuditLogsForChild(guardianId: string, childId: string) {
  await getOwnedChildForGuardian(guardianId, childId);

  const logs = await prisma.auditLog.findMany({
    where: {
      childId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  return logs.map((log) => ({
    id: log.id,
    guardianId: log.guardianId,
    childId: log.childId,
    action: log.action,
    metadata:
      log.metadata && typeof log.metadata === "object" && !Array.isArray(log.metadata)
        ? (log.metadata as Record<string, unknown>)
        : log.metadata,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    createdAt: log.createdAt.toISOString(),
  }));
}

export async function exportChildData(guardianId: string, childId: string) {
  const child = await getOwnedChildForGuardian(guardianId, childId);

  const [consents, progress, roadmap, insights, mediaAssets] = await Promise.all([
    listConsentsForChild(childId),
    listProgressEntriesForChild(childId, { limit: 50 }),
    listRoadmapItemsForChild(childId),
    listInsightsForChild(childId),
    prisma.mediaAsset.findMany({
      where: {
        childId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        type: true,
        status: true,
        mimeType: true,
        sizeBytes: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    child: serializeChild(child),
    consents,
    progress: progress.entries,
    roadmap,
    insights,
    mediaAssets: mediaAssets.map((asset) => ({
      ...asset,
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString(),
    })),
  };
}

export async function softDeleteChildData(guardianId: string, childId: string) {
  await getOwnedChildForGuardian(guardianId, childId);

  const now = new Date();

  await prisma.$transaction([
    prisma.child.update({
      where: {
        id: childId,
      },
      data: {
        deletedAt: now,
      },
    }),
    prisma.progressEntry.updateMany({
      where: {
        childId,
        deletedAt: null,
      },
      data: {
        deletedAt: now,
      },
    }),
  ]);

  return {
    childId,
    deletedAt: now.toISOString(),
  };
}
