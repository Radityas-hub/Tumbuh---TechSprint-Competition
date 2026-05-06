import type { Prisma } from "../generated/prisma/client";
import { FocusArea, InputType } from "../generated/prisma/enums";
import { notFound } from "./api/errors";
import { focusAreaLabels, type FocusAreaLabel, mapFocusAreasToEnum } from "./children";
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

  return serializeProgressEntry(entry);
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
  await getOwnedProgressEntry(guardianId, entryId);

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

  return serializeProgressEntry(entry);
}
