import type { Child, Prisma } from "../generated/prisma/client";
import { FocusArea } from "../generated/prisma/enums";
import { notFound } from "./api/errors";
import { prisma } from "./prisma";

export const focusAreaLabels = [
  "Komunikasi",
  "Motorik",
  "Perilaku",
  "Akademik",
] as const;

export type FocusAreaLabel = (typeof focusAreaLabels)[number];

const focusAreaToEnumMap: Record<FocusAreaLabel, (typeof FocusArea)[keyof typeof FocusArea]> = {
  Komunikasi: FocusArea.COMMUNICATION,
  Motorik: FocusArea.MOTORIC,
  Perilaku: FocusArea.BEHAVIOR,
  Akademik: FocusArea.ACADEMIC,
};

const enumToFocusAreaMap: Record<(typeof FocusArea)[keyof typeof FocusArea], FocusAreaLabel> = {
  [FocusArea.COMMUNICATION]: "Komunikasi",
  [FocusArea.MOTORIC]: "Motorik",
  [FocusArea.BEHAVIOR]: "Perilaku",
  [FocusArea.ACADEMIC]: "Akademik",
};

const childSelect = {
  id: true,
  guardianId: true,
  name: true,
  birthDate: true,
  condition: true,
  focusAreas: true,
  routine: true,
  supportNeed: true,
  onboardingCompletedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ChildSelect;

export type SerializedChild = {
  id: string;
  guardianId: string;
  name: string;
  birthDate: string;
  condition: string;
  focusAreas: FocusAreaLabel[];
  routine: string | null;
  supportNeed: string | null;
  onboardingCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ChildRecord = Prisma.ChildGetPayload<{ select: typeof childSelect }>;

export function mapFocusAreasToEnum(focusAreas: FocusAreaLabel[]) {
  return focusAreas.map((focusArea) => focusAreaToEnumMap[focusArea]);
}

export function mapFocusAreasToLabel(
  focusAreas: Array<(typeof FocusArea)[keyof typeof FocusArea]>,
) {
  return focusAreas.map((focusArea) => enumToFocusAreaMap[focusArea]);
}

function toDateTimeString(dateValue: string) {
  return new Date(`${dateValue}T00:00:00.000Z`).toISOString();
}

export function serializeChild(child: ChildRecord): SerializedChild {
  return {
    id: child.id,
    guardianId: child.guardianId,
    name: child.name,
    birthDate: child.birthDate.toISOString(),
    condition: child.condition,
    focusAreas: child.focusAreas.map((focusArea) => enumToFocusAreaMap[focusArea]),
    routine: child.routine,
    supportNeed: child.supportNeed,
    onboardingCompletedAt: child.onboardingCompletedAt?.toISOString() ?? null,
    createdAt: child.createdAt.toISOString(),
    updatedAt: child.updatedAt.toISOString(),
  };
}

export type CreateChildInput = {
  name: string;
  birthDate: string;
  condition: string;
  focusAreas: FocusAreaLabel[];
  routine?: string | null;
  supportNeed?: string | null;
};

export type UpdateChildInput = Partial<CreateChildInput>;

export async function listChildrenForGuardian(guardianId: string) {
  const children = await prisma.child.findMany({
    where: {
      guardianId,
      deletedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: childSelect,
  });

  return children.map(serializeChild);
}

export async function getOwnedChildForGuardian(guardianId: string, childId: string) {
  const child = await prisma.child.findFirst({
    where: {
      id: childId,
      guardianId,
      deletedAt: null,
    },
    select: childSelect,
  });

  if (!child) {
    throw notFound("Child not found");
  }

  return child;
}

export async function createChildForGuardian(guardianId: string, input: CreateChildInput) {
  const child = await prisma.child.create({
    data: {
      guardianId,
      name: input.name,
      birthDate: toDateTimeString(input.birthDate),
      condition: input.condition,
      focusAreas: mapFocusAreasToEnum(input.focusAreas),
      routine: input.routine ?? null,
      supportNeed: input.supportNeed ?? null,
    },
    select: childSelect,
  });

  return serializeChild(child);
}

export async function updateOwnedChildForGuardian(
  guardianId: string,
  childId: string,
  input: UpdateChildInput,
) {
  await getOwnedChildForGuardian(guardianId, childId);

  const child = await prisma.child.update({
    where: {
      id: childId,
    },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.birthDate !== undefined ? { birthDate: toDateTimeString(input.birthDate) } : {}),
      ...(input.condition !== undefined ? { condition: input.condition } : {}),
      ...(input.focusAreas !== undefined
        ? { focusAreas: mapFocusAreasToEnum(input.focusAreas) }
        : {}),
      ...(input.routine !== undefined ? { routine: input.routine } : {}),
      ...(input.supportNeed !== undefined ? { supportNeed: input.supportNeed } : {}),
    },
    select: childSelect,
  });

  return serializeChild(child);
}

export async function markChildOnboardingComplete(guardianId: string, childId: string) {
  const existingChild = await getOwnedChildForGuardian(guardianId, childId);

  if (existingChild.onboardingCompletedAt) {
    return serializeChild(existingChild);
  }

  const child = await prisma.child.update({
    where: {
      id: childId,
    },
    data: {
      onboardingCompletedAt: new Date(),
    },
    select: childSelect,
  });

  return serializeChild(child);
}
