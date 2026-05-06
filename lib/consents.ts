import type { Prisma } from "../generated/prisma/client";
import { ConsentScope } from "../generated/prisma/enums";
import { prisma } from "./prisma";

export const consentScopeValues = [
  "health_data",
  "ai_insight",
  "media_upload",
  "document_analysis",
  "location",
] as const;

export type ConsentScopeValue = (typeof consentScopeValues)[number];

const consentScopeToEnumMap: Record<
  ConsentScopeValue,
  (typeof ConsentScope)[keyof typeof ConsentScope]
> = {
  health_data: ConsentScope.HEALTH_DATA,
  ai_insight: ConsentScope.AI_INSIGHT,
  media_upload: ConsentScope.MEDIA_UPLOAD,
  document_analysis: ConsentScope.DOCUMENT_ANALYSIS,
  location: ConsentScope.LOCATION,
};

const enumToConsentScopeMap: Record<
  (typeof ConsentScope)[keyof typeof ConsentScope],
  ConsentScopeValue
> = {
  [ConsentScope.HEALTH_DATA]: "health_data",
  [ConsentScope.AI_INSIGHT]: "ai_insight",
  [ConsentScope.MEDIA_UPLOAD]: "media_upload",
  [ConsentScope.DOCUMENT_ANALYSIS]: "document_analysis",
  [ConsentScope.LOCATION]: "location",
};

const consentSelect = {
  id: true,
  childId: true,
  scope: true,
  granted: true,
  grantedAt: true,
  revokedAt: true,
  source: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ConsentSelect;

export type SerializedConsent = {
  id: string;
  childId: string;
  scope: ConsentScopeValue;
  granted: boolean;
  grantedAt: string | null;
  revokedAt: string | null;
  source: string | null;
  createdAt: string;
  updatedAt: string;
};

type ConsentRecord = Prisma.ConsentGetPayload<{ select: typeof consentSelect }>;

export function serializeConsent(consent: ConsentRecord): SerializedConsent {
  return {
    id: consent.id,
    childId: consent.childId,
    scope: enumToConsentScopeMap[consent.scope],
    granted: consent.granted,
    grantedAt: consent.grantedAt?.toISOString() ?? null,
    revokedAt: consent.revokedAt?.toISOString() ?? null,
    source: consent.source ?? null,
    createdAt: consent.createdAt.toISOString(),
    updatedAt: consent.updatedAt.toISOString(),
  };
}

export async function listConsentsForChild(childId: string) {
  const consents = await prisma.consent.findMany({
    where: {
      childId,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: consentSelect,
  });

  return consents.map(serializeConsent);
}

export async function upsertConsentForChild(
  childId: string,
  input: {
    scope: ConsentScopeValue;
    granted: boolean;
    source?: string | null;
  },
) {
  const now = new Date();
  const scope = consentScopeToEnumMap[input.scope];

  const consent = await prisma.consent.upsert({
    where: {
      childId_scope: {
        childId,
        scope,
      },
    },
    update: {
      granted: input.granted,
      grantedAt: input.granted ? now : null,
      revokedAt: input.granted ? null : now,
      source: input.source ?? null,
    },
    create: {
      childId,
      scope,
      granted: input.granted,
      grantedAt: input.granted ? now : null,
      revokedAt: input.granted ? null : now,
      source: input.source ?? null,
    },
    select: consentSelect,
  });

  return serializeConsent(consent);
}

export async function seedOnboardingConsents(childId: string) {
  const consentPayloads: Array<{ scope: ConsentScopeValue; granted: boolean }> = [
    { scope: "health_data", granted: true },
    { scope: "ai_insight", granted: true },
    { scope: "media_upload", granted: false },
    { scope: "document_analysis", granted: false },
    { scope: "location", granted: false },
  ];

  const consents = await Promise.all(
    consentPayloads.map((consent) =>
      upsertConsentForChild(childId, {
        ...consent,
        source: "onboarding",
      }),
    ),
  );

  return consents;
}
