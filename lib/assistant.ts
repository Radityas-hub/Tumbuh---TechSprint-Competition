import type { Prisma } from "../generated/prisma/client";

import { notFound } from "./api/errors";
import { prisma } from "./prisma";

const conversationSelect = {
  id: true,
  guardianId: true,
  childId: true,
  title: true,
  createdAt: true,
  updatedAt: true,
  messages: {
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      role: true,
      content: true,
      metadata: true,
      createdAt: true,
    },
  },
} satisfies Prisma.AssistantConversationSelect;

type ConversationRecord = Prisma.AssistantConversationGetPayload<{ select: typeof conversationSelect }>;

export type SerializedAssistantConversation = {
  id: string;
  guardianId: string;
  childId: string | null;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    metadata: Record<string, unknown> | null;
    createdAt: string;
  }>;
};

function parseMetadata(value: Prisma.JsonValue | null): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function serializeConversation(record: ConversationRecord): SerializedAssistantConversation {
  return {
    id: record.id,
    guardianId: record.guardianId,
    childId: record.childId,
    title: record.title,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    messages: record.messages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      metadata: parseMetadata(message.metadata),
      createdAt: message.createdAt.toISOString(),
    })),
  };
}

function buildGuardedAssistantReply(question: string, context: { childName?: string | null }) {
  const normalized = question.toLowerCase();

  if (
    normalized.includes("obat") ||
    normalized.includes("dosis") ||
    normalized.includes("diagnosa") ||
    normalized.includes("diagnosis")
  ) {
    return "Saya tidak bisa memberi diagnosis, obat, atau dosis. Gunakan catatan observasi Anda sebagai bahan diskusi dengan dokter atau profesional yang mendampingi anak.";
  }

  if (
    normalized.includes("menyakiti diri") ||
    normalized.includes("kejang") ||
    normalized.includes("tidak mau makan") ||
    normalized.includes("sesak")
  ) {
    return "Bila ada tanda bahaya atau kondisi yang terasa mendesak, segera hubungi tenaga medis atau layanan darurat setempat. Saya hanya bisa membantu menyusun observasi dan bukan memberi diagnosis.";
  }

  const childLabel = context.childName ? `untuk ${context.childName}` : "untuk anak Anda";

  if (normalized.includes("tantrum") || normalized.includes("transisi") || normalized.includes("screen")) {
    return `Coba fokus pada pola transisi ${childLabel}: catat kapan kejadian muncul, pemicu sebelum perilaku terjadi, dan apa yang membantu anak kembali tenang. Insight ini bukan diagnosis, tetapi bisa membantu Anda menyiapkan diskusi dengan profesional.`;
  }

  if (normalized.includes("komunikasi") || normalized.includes("bicara") || normalized.includes("kontak mata")) {
    return `Mulai dari latihan komunikasi singkat ${childLabel} di rutinitas harian yang sama setiap hari. Catat momen respons spontan, meski masih kecil. Jawaban ini bukan diagnosis, melainkan panduan observasi awal untuk dibawa saat konsultasi bila diperlukan.`;
  }

  return `Mulai dari tiga hal sederhana ${childLabel}: kapan kejadian terjadi, apa pemicunya, dan apa yang membantu. Simpan pola itu selama beberapa hari agar Anda punya bahan observasi yang lebih jelas. Jawaban ini bukan diagnosis dan tidak menggantikan bantuan profesional.`;
}

export async function createAssistantReply(input: {
  guardianId: string;
  childId?: string | null;
  question: string;
  conversationId?: string | null;
}) {
  const child = input.childId
    ? await prisma.child.findFirst({
        where: {
          id: input.childId,
          guardianId: input.guardianId,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
        },
      })
    : null;

  if (input.childId && !child) {
    throw notFound("Child not found");
  }

  const reply = buildGuardedAssistantReply(input.question, {
    childName: child?.name ?? null,
  });

  let conversationId = input.conversationId ?? null;

  if (conversationId) {
    const existing = await prisma.assistantConversation.findFirst({
      where: {
        id: conversationId,
        guardianId: input.guardianId,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      throw notFound("Assistant conversation not found");
    }
  } else {
    const conversation = await prisma.assistantConversation.create({
      data: {
        guardianId: input.guardianId,
        childId: input.childId ?? null,
        title: input.question.trim().slice(0, 80),
      },
      select: {
        id: true,
      },
    });

    conversationId = conversation.id;
  }

  await prisma.assistantMessage.createMany({
    data: [
      {
        conversationId,
        role: "user",
        content: input.question,
      },
      {
        conversationId,
        role: "assistant",
        content: reply,
        metadata: {
          guarded: true,
        },
      },
    ],
  });

  const conversation = await prisma.assistantConversation.findUniqueOrThrow({
    where: {
      id: conversationId,
    },
    select: conversationSelect,
  });

  return {
    reply,
    conversation: serializeConversation(conversation),
  };
}

export async function listAssistantConversationsForChild(guardianId: string, childId: string) {
  const conversations = await prisma.assistantConversation.findMany({
    where: {
      guardianId,
      childId,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: conversationSelect,
    take: 10,
  });

  return conversations.map(serializeConversation);
}
