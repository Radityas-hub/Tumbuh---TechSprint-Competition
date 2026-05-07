import type { Prisma } from "../generated/prisma/client";
import { FocusArea, InputType } from "../generated/prisma/enums";
import { badRequest, notFound } from "./api/errors";
import { focusAreaLabels, type FocusAreaLabel, mapFocusAreasToEnum } from "./children";
import {
  ensureMediaMatchesProgressType,
  linkMediaAssetToProgressEntry,
  type SerializedMediaAsset,
} from "./media";
import { markInsightsStaleForChild, scheduleInsightRefreshForChild } from "./insights";
import { prisma } from "./prisma";

export const progressInputTypeLabels = ["Teks", "Foto", "Suara"] as const;

export type ProgressInputTypeLabel = (typeof progressInputTypeLabels)[number];

const inputTypeToEnumMap: Record<
  ProgressInputTypeLabel,
  (typeof InputType)[keyof typeof InputType]
> = {
  Teks: InputType.TEXT,
  Foto: InputType.PHOTO,
  Suara: InputType.AUDIO,
};

const enumToInputTypeMap: Record<
  (typeof InputType)[keyof typeof InputType],
  ProgressInputTypeLabel
> = {
  [InputType.TEXT]: "Teks",
  [InputType.PHOTO]: "Foto",
  [InputType.AUDIO]: "Suara",
  [InputType.DOCUMENT]: "Teks",
};

const enumToFocusAreaMap: Record<
  (typeof FocusArea)[keyof typeof FocusArea],
  FocusAreaLabel
> = {
  [FocusArea.COMMUNICATION]: "Komunikasi",
  [FocusArea.MOTORIC]: "Motorik",
  [FocusArea.BEHAVIOR]: "Perilaku",
  [FocusArea.ACADEMIC]: "Akademik",
};

const progressSelect = {
  id: true,
  childId: true,
  area: true,
  inputType: true,
  title: true,
  note: true,
  insight: true,
  observedAt: true,
  createdAt: true,
  updatedAt: true,
  mediaAssets: {
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      childId: true,
      progressEntryId: true,
      type: true,
      storageBucket: true,
      storageKey: true,
      url: true,
      mimeType: true,
      sizeBytes: true,
      status: true,
      processingError: true,
      processedOutput: true,
      createdAt: true,
      updatedAt: true,
      processingJobs: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        select: {
          id: true,
          kind: true,
          status: true,
          attempts: true,
          error: true,
          createdAt: true,
          updatedAt: true,
          startedAt: true,
          completedAt: true,
        },
      },
    },
  },
} satisfies Prisma.ProgressEntrySelect;

type ProgressRecord = Prisma.ProgressEntryGetPayload<{ select: typeof progressSelect }>;

export type SerializedProgressEntry = {
  id: string;
  childId: string;
  area: FocusAreaLabel;
  inputType: ProgressInputTypeLabel;
  title: string | null;
  note: string | null;
  insight: string | null;
  observedAt: string;
  createdAt: string;
  updatedAt: string;
  mediaAssets: SerializedMediaAsset[];
};

export type ListProgressInput = {
  area?: FocusAreaLabel;
  inputType?: ProgressInputTypeLabel;
  from?: string;
  to?: string;
  limit?: number;
  cursor?: string;
};

export type CreateProgressInput = {
  area: FocusAreaLabel;
  inputType: ProgressInputTypeLabel;
  title?: string | null;
  note?: string | null;
  observedAt?: string;
  mediaId?: string;
};

export type UpdateProgressInput = Partial<CreateProgressInput>;

function toObservedAtDate(value?: string) {
  if (!value) {
    return new Date();
  }

  return new Date(value);
}

export function serializeProgressEntry(entry: ProgressRecord): SerializedProgressEntry {
  return {
    id: entry.id,
    childId: entry.childId,
    area: enumToFocusAreaMap[entry.area],
    inputType: enumToInputTypeMap[entry.inputType],
    title: entry.title,
    note: entry.note,
    insight: entry.insight,
    observedAt: entry.observedAt.toISOString(),
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    mediaAssets: entry.mediaAssets.map((asset) => ({
      id: asset.id,
      childId: asset.childId,
      progressEntryId: asset.progressEntryId,
      type:
        asset.type === InputType.PHOTO
          ? "Foto"
          : asset.type === InputType.AUDIO
            ? "Suara"
            : "Dokumen",
      storageBucket: asset.storageBucket,
      storageKey: asset.storageKey,
      url: asset.url,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes,
      status: asset.status,
      statusLabel:
        asset.status === "PENDING_UPLOAD"
          ? "Menunggu upload"
          : asset.status === "UPLOADED"
            ? "Terunggah"
            : asset.status === "PROCESSING"
              ? "Sedang diproses"
              : asset.status === "COMPLETED"
                ? "Selesai"
                : "Gagal",
      processingError: asset.processingError,
      processedOutput:
        asset.processedOutput && typeof asset.processedOutput === "object" && !Array.isArray(asset.processedOutput)
          ? (asset.processedOutput as Record<string, unknown>)
          : null,
      latestJob: asset.processingJobs[0]
        ? {
            id: asset.processingJobs[0].id,
            kind: asset.processingJobs[0].kind,
            status: asset.processingJobs[0].status,
            attempts: asset.processingJobs[0].attempts,
            error: asset.processingJobs[0].error,
            createdAt: asset.processingJobs[0].createdAt.toISOString(),
            updatedAt: asset.processingJobs[0].updatedAt.toISOString(),
            startedAt: asset.processingJobs[0].startedAt?.toISOString() ?? null,
            completedAt: asset.processingJobs[0].completedAt?.toISOString() ?? null,
          }
        : null,
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString(),
    })),
  };
}

function buildProgressWhere(
  childId: string,
  filters: ListProgressInput = {},
): Prisma.ProgressEntryWhereInput {
  return {
    childId,
    deletedAt: null,
    ...(filters.area
      ? {
          area: mapFocusAreasToEnum([filters.area])[0],
        }
      : {}),
    ...(filters.inputType
      ? {
          inputType: inputTypeToEnumMap[filters.inputType],
        }
      : {}),
    ...(filters.from || filters.to
      ? {
          observedAt: {
            ...(filters.from ? { gte: new Date(filters.from) } : {}),
            ...(filters.to ? { lte: new Date(filters.to) } : {}),
          },
        }
      : {}),
  };
}

export async function listProgressEntriesForChild(
  childId: string,
  filters: ListProgressInput = {},
) {
  const limit = Math.min(filters.limit ?? 20, 50);

  const entries = await prisma.progressEntry.findMany({
    where: buildProgressWhere(childId, filters),
    ...(filters.cursor
      ? {
          cursor: {
            id: filters.cursor,
          },
          skip: 1,
        }
      : {}),
    take: limit + 1,
    orderBy: [
      {
        observedAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    select: progressSelect,
  });

  const hasMore = entries.length > limit;
  const slicedEntries = hasMore ? entries.slice(0, limit) : entries;

  return {
    entries: slicedEntries.map(serializeProgressEntry),
    pageInfo: {
      hasMore,
      nextCursor: hasMore ? slicedEntries[slicedEntries.length - 1]?.id ?? null : null,
    },
  };
}

export async function createProgressEntryForChild(childId: string, input: CreateProgressInput) {
  if (input.mediaId && input.inputType === "Teks") {
    throw badRequest("mediaId cannot be used with text entries");
  }

  let linkedMedia:
    | {
        id: string;
        type: "Foto" | "Suara" | "Dokumen";
      }
    | null = null;

  if (input.mediaId) {
    const mediaAsset = await prisma.mediaAsset.findFirst({
      where: {
        id: input.mediaId,
        childId,
      },
      select: {
        id: true,
        type: true,
      },
    });

    if (!mediaAsset) {
      throw notFound("Media asset not found");
    }

    linkedMedia = {
      id: mediaAsset.id,
      type:
        mediaAsset.type === InputType.PHOTO
          ? "Foto"
          : mediaAsset.type === InputType.AUDIO
            ? "Suara"
            : "Dokumen",
    };

    ensureMediaMatchesProgressType(linkedMedia.type, input.inputType);
  }

  const entry = await prisma.progressEntry.create({
    data: {
      childId,
      area: mapFocusAreasToEnum([input.area])[0],
      inputType: inputTypeToEnumMap[input.inputType],
      title: input.title ?? null,
      note: input.note ?? null,
      observedAt: toObservedAtDate(input.observedAt),
      insight: null,
    },
    select: progressSelect,
  });

  if (linkedMedia) {
    await linkMediaAssetToProgressEntry(childId, linkedMedia.id, entry.id);
  }

  await markInsightsStaleForChild(childId);
  await scheduleInsightRefreshForChild(childId);

  const refreshedEntry = await prisma.progressEntry.findUniqueOrThrow({
    where: {
      id: entry.id,
    },
    select: progressSelect,
  });

  return serializeProgressEntry(refreshedEntry);
}

export async function getOwnedProgressEntry(guardianId: string, entryId: string) {
  const entry = await prisma.progressEntry.findFirst({
    where: {
      id: entryId,
      deletedAt: null,
      child: {
        guardianId,
        deletedAt: null,
      },
    },
    select: progressSelect,
  });

  if (!entry) {
    throw notFound("Progress entry not found");
  }

  return entry;
}

export async function updateOwnedProgressEntry(
  guardianId: string,
  entryId: string,
  input: UpdateProgressInput,
) {
  const existingEntry = await getOwnedProgressEntry(guardianId, entryId);

  const entry = await prisma.progressEntry.update({
    where: {
      id: entryId,
    },
    data: {
      ...(input.area !== undefined ? { area: mapFocusAreasToEnum([input.area])[0] } : {}),
      ...(input.inputType !== undefined ? { inputType: inputTypeToEnumMap[input.inputType] } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.note !== undefined ? { note: input.note } : {}),
      ...(input.observedAt !== undefined ? { observedAt: toObservedAtDate(input.observedAt) } : {}),
    },
    select: progressSelect,
  });

  await markInsightsStaleForChild(existingEntry.childId);
  await scheduleInsightRefreshForChild(existingEntry.childId);

  return serializeProgressEntry(entry);
}

export async function deleteOwnedProgressEntry(guardianId: string, entryId: string) {
  const entry = await getOwnedProgressEntry(guardianId, entryId);

  await prisma.progressEntry.update({
    where: {
      id: entryId,
    },
    data: {
      deletedAt: new Date(),
    },
  });

  await markInsightsStaleForChild(entry.childId);
  await scheduleInsightRefreshForChild(entry.childId);

  return serializeProgressEntry(entry);
}
