import { prisma } from "./prisma";

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

export async function getAdminDashboardForGuardian(guardianId: string) {
  const [articles, chunks, children, responseLogs, evaluations] = await Promise.all([
    prisma.knowledgeArticle.findMany({
      orderBy: [{ lastReviewedAt: "asc" }, { updatedAt: "desc" }],
      select: {
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
      },
    }),
    prisma.knowledgeChunk.findMany({
      orderBy: [{ lastReviewedAt: "asc" }, { updatedAt: "desc" }],
      select: {
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
      },
    }),
    prisma.child.findMany({
      where: {
        guardianId,
        deletedAt: null,
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        name: true,
        onboardingCompletedAt: true,
        progressEntries: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
          },
        },
        contextSnapshots: {
          where: {
            snapshotType: "assistant",
          },
          orderBy: [{ version: "desc" }, { createdAt: "desc" }],
          take: 1,
          select: {
            id: true,
            version: true,
            summary: true,
            progressCount: true,
            roadmapCount: true,
            lastProgressAt: true,
            dataCompleteness: true,
            updatedAt: true,
          },
        },
      },
    }),
    prisma.assistantResponseLog.findMany({
      where: {
        guardianId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        fallbackUsed: true,
      },
    }),
    prisma.assistantEvaluation.findMany({
      where: {
        guardianId,
      },
      orderBy: [{ overallScore: "asc" }, { createdAt: "desc" }],
      take: 8,
      select: {
        id: true,
        responseLogId: true,
        overallScore: true,
        relevanceScore: true,
        safetyScore: true,
        faithfulnessScore: true,
        actionabilityScore: true,
        issues: true,
        summary: true,
        createdAt: true,
        childId: true,
        child: {
          select: {
            name: true,
          },
        },
        responseLog: {
          select: {
            question: true,
          },
        },
      },
    }),
  ]);

  const pendingArticles = articles.filter(
    (article) => article.reviewStatus !== "approved" || !article.lastReviewedAt,
  );
  const pendingChunks = chunks.filter(
    (chunk) => chunk.reviewStatus !== "approved" || !chunk.lastReviewedAt,
  );
  const issueCounts = new Map<string, number>();

  for (const evaluation of evaluations) {
    for (const issue of parseStringArray(evaluation.issues)) {
      issueCounts.set(issue, (issueCounts.get(issue) ?? 0) + 1);
    }
  }

  const averageOverallScore =
    evaluations.length > 0
      ? Math.round(
          evaluations.reduce((total, evaluation) => total + evaluation.overallScore, 0) /
            evaluations.length,
        )
      : null;

  return {
    overview: {
      articleCount: articles.length,
      chunkCount: chunks.length,
      pendingReviewCount: pendingArticles.length + pendingChunks.length,
      childCount: children.length,
      responseLogCount: responseLogs.length,
      fallbackCount: responseLogs.filter((log) => log.fallbackUsed).length,
      evaluationCount: evaluations.length,
      averageOverallScore,
      lowScoreCount: evaluations.filter((evaluation) => evaluation.overallScore < 75).length,
    },
    issueHotspots: Array.from(issueCounts.entries())
      .map(([issue, count]) => ({ issue, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 5),
    reviewQueue: {
      articles: pendingArticles.slice(0, 6).map((article) => ({
        id: article.id,
        slug: article.slug,
        title: article.title,
        category: article.category,
        reviewStatus: article.reviewStatus,
        reviewedBy: article.reviewedBy,
        reviewNotes: article.reviewNotes,
        lastReviewedAt: article.lastReviewedAt?.toISOString() ?? null,
        approvedBy: article.approvedBy,
        publishedAt: article.publishedAt?.toISOString() ?? null,
        focusAreaTags: parseStringArray(article.focusAreaTags),
        conditionTags: parseStringArray(article.conditionTags),
        chunkCount: article._count.chunks,
      })),
      chunks: pendingChunks.slice(0, 6).map((chunk) => ({
        id: chunk.id,
        articleId: chunk.articleId,
        chunkIndex: chunk.chunkIndex,
        heading: chunk.heading,
        chunkText: chunk.chunkText,
        reviewStatus: chunk.reviewStatus,
        reviewedBy: chunk.reviewedBy,
        reviewNotes: chunk.reviewNotes,
        lastReviewedAt: chunk.lastReviewedAt?.toISOString() ?? null,
        focusAreaTags: parseStringArray(chunk.focusAreaTags),
        conditionTags: parseStringArray(chunk.conditionTags),
        article: chunk.article,
      })),
    },
    latestEvaluations: evaluations.map((evaluation) => ({
      id: evaluation.id,
      childId: evaluation.childId,
      childName: evaluation.child?.name ?? null,
      responseLogId: evaluation.responseLogId,
      question: evaluation.responseLog.question,
      overallScore: evaluation.overallScore,
      relevanceScore: evaluation.relevanceScore,
      safetyScore: evaluation.safetyScore,
      faithfulnessScore: evaluation.faithfulnessScore,
      actionabilityScore: evaluation.actionabilityScore,
      issues: parseStringArray(evaluation.issues),
      summary: evaluation.summary,
      createdAt: evaluation.createdAt.toISOString(),
    })),
    childHealth: children.map((child) => {
      const snapshot = child.contextSnapshots[0] ?? null;
      const dataCompleteness =
        snapshot?.dataCompleteness &&
        typeof snapshot.dataCompleteness === "object" &&
        !Array.isArray(snapshot.dataCompleteness)
          ? (snapshot.dataCompleteness as Record<string, unknown>)
          : null;

      return {
        childId: child.id,
        childName: child.name,
        onboardingCompletedAt: child.onboardingCompletedAt?.toISOString() ?? null,
        progressCount: child.progressEntries.length,
        snapshot: snapshot
          ? {
              id: snapshot.id,
              version: snapshot.version,
              summary: snapshot.summary,
              progressCount: snapshot.progressCount,
              roadmapCount: snapshot.roadmapCount,
              lastProgressAt: snapshot.lastProgressAt?.toISOString() ?? null,
              sparseData: Boolean(dataCompleteness?.sparseData),
              hasWeeklyInsight: Boolean(dataCompleteness?.hasWeeklyInsight),
              updatedAt: snapshot.updatedAt.toISOString(),
            }
          : null,
      };
    }),
  };
}
