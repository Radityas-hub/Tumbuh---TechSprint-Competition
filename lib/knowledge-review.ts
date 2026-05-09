import { Prisma } from "../generated/prisma/client";

import { notFound } from "./api/errors";
import { prisma } from "./prisma";

const articleReviewSelect = {
  id: true,
  slug: true,
  title: true,
  category: true,
  reviewStatus: true,
  reviewedBy: true,
  reviewNotes: true,
  lastReviewedAt: true,
  approvedBy: true,
  publishedAt: true,
  focusAreaTags: true,
  conditionTags: true,
  _count: {
    select: {
      chunks: true,
    },
  },
} satisfies Prisma.KnowledgeArticleSelect;

const chunkReviewSelect = {
  id: true,
  articleId: true,
  chunkIndex: true,
  heading: true,
  chunkText: true,
  reviewStatus: true,
  reviewedBy: true,
  reviewNotes: true,
  lastReviewedAt: true,
  focusAreaTags: true,
  conditionTags: true,
  article: {
    select: {
      id: true,
      title: true,
      slug: true,
      category: true,
    },
  },
} satisfies Prisma.KnowledgeChunkSelect;

export async function listKnowledgeArticlesForReview(filters: {
  reviewStatus?: string;
  category?: string;
}) {
  return prisma.knowledgeArticle.findMany({
    where: {
      ...(filters.reviewStatus ? { reviewStatus: filters.reviewStatus } : {}),
      ...(filters.category ? { category: filters.category } : {}),
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: articleReviewSelect,
  });
}

export async function updateKnowledgeArticleReview(input: {
  articleId: string;
  reviewerLabel: string;
  reviewStatus: string;
  reviewNotes?: string | null;
}) {
  const existing = await prisma.knowledgeArticle.findUnique({
    where: {
      id: input.articleId,
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    throw notFound("Knowledge article not found");
  }

  return prisma.knowledgeArticle.update({
    where: {
      id: input.articleId,
    },
    data: {
      reviewStatus: input.reviewStatus,
      reviewedBy: input.reviewerLabel,
      reviewNotes: input.reviewNotes ?? null,
      lastReviewedAt: new Date(),
      ...(input.reviewStatus === "approved"
        ? {
            approvedBy: input.reviewerLabel,
            publishedAt: new Date(),
          }
        : {}),
    },
    select: articleReviewSelect,
  });
}

export async function listKnowledgeChunksForReview(filters: {
  articleId?: string;
  reviewStatus?: string;
}) {
  return prisma.knowledgeChunk.findMany({
    where: {
      ...(filters.articleId ? { articleId: filters.articleId } : {}),
      ...(filters.reviewStatus ? { reviewStatus: filters.reviewStatus } : {}),
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: chunkReviewSelect,
  });
}

export async function updateKnowledgeChunkReview(input: {
  chunkId: string;
  reviewerLabel: string;
  reviewStatus: string;
  reviewNotes?: string | null;
}) {
  const existing = await prisma.knowledgeChunk.findUnique({
    where: {
      id: input.chunkId,
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    throw notFound("Knowledge chunk not found");
  }

  return prisma.knowledgeChunk.update({
    where: {
      id: input.chunkId,
    },
    data: {
      reviewStatus: input.reviewStatus,
      reviewedBy: input.reviewerLabel,
      reviewNotes: input.reviewNotes ?? null,
      lastReviewedAt: new Date(),
    },
    select: chunkReviewSelect,
  });
}
