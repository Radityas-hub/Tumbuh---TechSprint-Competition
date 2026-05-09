import type { Prisma } from "../generated/prisma/client";

import { notFound } from "./api/errors";
import { evaluateAssistantResponseLog } from "./assistant-evaluator";
import {
  buildChildAssistantContext,
  classifyAssistantIntent,
  createAssistantResponseLog,
  generateAssistantAnswer,
  getAssistantPromptVersion,
  retrieveAssistantPolicies,
  retrieveKnowledgeChunks,
} from "./assistant-rag";
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

export async function createAssistantReply(input: {
  guardianId: string;
  childId?: string | null;
  question: string;
  conversationId?: string | null;
}) {
  const startedAt = Date.now();
  const intent = classifyAssistantIntent(input.question);

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

  let conversationId = input.conversationId ?? null;

  if (conversationId) {
    const existing = await prisma.assistantConversation.findFirst({
      where: {
        id: conversationId,
        guardianId: input.guardianId,
      },
      select: {
        id: true,
        messages: {
          orderBy: {
            createdAt: "asc",
          },
          take: 8,
          select: {
            role: true,
            content: true,
          },
        },
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

  const conversationHistory = conversationId
    ? await prisma.assistantMessage.findMany({
        where: {
          conversationId,
        },
        orderBy: {
          createdAt: "asc",
        },
        take: 8,
        select: {
          role: true,
          content: true,
        },
      })
    : [];

  const childContext = child ? await buildChildAssistantContext(child.id) : {
    child: null,
    snapshot: null,
    recentProgress: [],
    latestInsightSummary: null,
    roadmapTargets: [],
  };

  const [policies, chunks] = await Promise.all([
    retrieveAssistantPolicies(intent),
    retrieveKnowledgeChunks({
      question: input.question,
      childContext,
      limit: 4,
    }),
  ]);

  const requestPayload = {
    question: input.question,
    intent,
    childContext,
    retrievedChunks: chunks.map((chunk) => ({
      id: chunk.id,
      citationLabel: chunk.citationLabel,
      retrievalScore: chunk.retrievalScore ?? null,
      retrievalReasons: chunk.retrievalReasons ?? [],
    })),
    retrievedPolicyIds: policies.map((policy) => policy.id),
    conversationHistory: conversationHistory.slice(-4),
    promptVersion: getAssistantPromptVersion(),
  };

  const generated = await generateAssistantAnswer({
    question: input.question,
    intent,
    context: childContext,
    chunks,
    policies,
    conversationHistory,
  });

  const reply = generated.structured.answer;
  const messageMetadata = {
    rag: true,
    intent,
    riskLevel: generated.structured.riskLevel,
    fallbackUsed: generated.fallbackUsed,
    promptVersion: getAssistantPromptVersion(),
    knowledgeChunkIds: chunks.map((chunk) => chunk.id),
    citations: generated.structured.citations ?? [],
    policyIds: policies.map((policy) => policy.id),
    childSnapshotId: childContext.snapshot?.id ?? null,
    nextObservationIdeas: generated.structured.nextObservationIdeas,
    followupQuestions: generated.structured.followupQuestions,
  };

  await prisma.assistantMessage.createMany({
    data: [
      {
        conversationId,
        role: "user",
        content: input.question,
        metadata: {
          intent,
        },
      },
      {
        conversationId,
        role: "assistant",
        content: reply,
        metadata: messageMetadata,
      },
    ],
  });

  const responseLog = await createAssistantResponseLog({
    guardianId: input.guardianId,
    childId: child?.id ?? null,
    conversationId,
    question: input.question,
    intent,
    snapshotIds: childContext.snapshot ? [childContext.snapshot.id] : [],
    progressEntryIds: childContext.recentProgress.map((entry) => entry.id),
    knowledgeChunkIds: chunks.map((chunk) => chunk.id),
    policyIds: policies.map((policy) => policy.id),
    modelName: generated.modelName,
    requestPayload: requestPayload as unknown as Prisma.InputJsonValue,
    responseText: reply,
    responseJson: generated.rawResponse,
    safetyOutcome: generated.structured.riskLevel,
    fallbackUsed: generated.fallbackUsed,
    latencyMs: Date.now() - startedAt,
  });

  await evaluateAssistantResponseLog(responseLog.id);

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
