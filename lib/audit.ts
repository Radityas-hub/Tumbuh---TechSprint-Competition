import { NextRequest } from "next/server";

import type { Prisma } from "../generated/prisma/client";
import { prisma } from "./prisma";

type AuditLogInput = {
  guardianId?: string | null;
  childId?: string | null;
  action: string;
  metadata?: unknown;
  request?: NextRequest;
};

function getIpAddress(request?: NextRequest) {
  const forwardedFor = request?.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }

  return request?.headers.get("x-real-ip") ?? null;
}

export async function createAuditLog(input: AuditLogInput) {
  await prisma.auditLog.create({
    data: {
      guardianId: input.guardianId ?? null,
      childId: input.childId ?? null,
      action: input.action,
      metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      ipAddress: getIpAddress(input.request),
      userAgent: input.request?.headers.get("user-agent") ?? null,
    },
  });
}
