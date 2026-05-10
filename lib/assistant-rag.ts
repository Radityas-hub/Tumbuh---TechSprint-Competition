import { createHash } from "node:crypto";

import { Prisma } from "../generated/prisma/client";
import { FocusArea, RoadmapStatus } from "../generated/prisma/enums";

import { mapFocusAreasToLabel, type FocusAreaLabel } from "./children";
import { prisma } from "./prisma";

const assistantPromptVersion = "assistant-rag-v2";
const embeddingDimension = 64;

const knowledgeArticleSelect = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  body: true,
  category: true,
  sourceLabel: true,
  sourceUrl: true,
  evidenceLevel: true,
  language: true,
  ageMinMonths: true,
  ageMaxMonths: true,
  conditionTags: true,
  focusAreaTags: true,
  safetyTags: true,
  reviewStatus: true,
  approvedBy: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  chunks: {
    orderBy: {
      chunkIndex: "asc",
    },
    select: {
      id: true,
      articleId: true,
      chunkIndex: true,
      heading: true,
      chunkText: true,
      keywords: true,
      embedding: true,
      tokenCount: true,
      conditionTags: true,
      focusAreaTags: true,
      safetyTags: true,
      reviewStatus: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} as const;

const policySelect = {
  id: true,
  name: true,
  policyType: true,
  content: true,
  priority: true,
  appliesToIntentTags: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

const snapshotSelect = {
  id: true,
  childId: true,
  snapshotType: true,
  summary: true,
  strengths: true,
  risks: true,
  activeFocusAreas: true,
  latestPatterns: true,
  latestRoadmapTargets: true,
  latestInsightId: true,
  progressCount: true,
  roadmapCount: true,
  progressWindowDays: true,
  lastProgressAt: true,
  dataCompleteness: true,
  sourceDataHash: true,
  version: true,
  generatedBy: true,
  createdAt: true,
  updatedAt: true,
} as const;

type KnowledgeChunkRecord = {
  id: string;
  articleId: string;
  chunkIndex: number;
  heading: string | null;
  chunkText: string;
  keywords: Prisma.JsonValue | null;
  embedding: Prisma.JsonValue | null;
  tokenCount: number | null;
  conditionTags: Prisma.JsonValue | null;
  focusAreaTags: Prisma.JsonValue | null;
  safetyTags: Prisma.JsonValue | null;
  reviewStatus: string;
  createdAt: Date;
  updatedAt: Date;
};

type KnowledgeArticleRecord = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  body: string;
  category: string;
  sourceLabel: string | null;
  sourceUrl: string | null;
  evidenceLevel: string | null;
  language: string;
  ageMinMonths: number | null;
  ageMaxMonths: number | null;
  conditionTags: Prisma.JsonValue | null;
  focusAreaTags: Prisma.JsonValue | null;
  safetyTags: Prisma.JsonValue | null;
  reviewStatus: string;
  approvedBy: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  chunks: KnowledgeChunkRecord[];
};

type AssistantPolicyRecord = {
  id: string;
  name: string;
  policyType: string;
  content: string;
  priority: number;
  appliesToIntentTags: Prisma.JsonValue | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type ChildContextSnapshotRecord = {
  id: string;
  childId: string;
  snapshotType: string;
  summary: string;
  strengths: Prisma.JsonValue | null;
  risks: Prisma.JsonValue | null;
  activeFocusAreas: Prisma.JsonValue | null;
  latestPatterns: Prisma.JsonValue | null;
  latestRoadmapTargets: Prisma.JsonValue | null;
  latestInsightId: string | null;
  progressCount: number;
  roadmapCount: number;
  progressWindowDays: number;
  lastProgressAt: Date | null;
  dataCompleteness: Prisma.JsonValue | null;
  sourceDataHash: string;
  version: number;
  generatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AssistantIntent =
  | "education_general"
  | "child_specific_observation"
  | "activity_suggestion"
  | "roadmap_explanation"
  | "consultation_preparation"
  | "report_interpretation"
  | "high_risk_or_clinical_boundary";

export type SerializedKnowledgeChunk = {
  id: string;
  articleId: string;
  articleTitle: string;
  category: string;
  heading: string | null;
  chunkText: string;
  conditionTags: string[];
  focusAreaTags: string[];
  safetyTags: string[];
  keywords: string[];
  embedding: number[] | null;
  citationLabel: string;
  retrievalScore?: number;
  retrievalReasons?: string[];
};

export type SerializedAssistantPolicy = {
  id: string;
  name: string;
  policyType: string;
  content: string;
  priority: number;
  appliesToIntentTags: string[];
};

export type SerializedChildContextSnapshot = {
  id: string;
  childId: string;
  snapshotType: string;
  summary: string;
  strengths: string[];
  risks: string[];
  activeFocusAreas: string[];
  latestPatterns: string[];
  latestRoadmapTargets: string[];
  latestInsightId: string | null;
  progressCount: number;
  roadmapCount: number;
  progressWindowDays: number;
  lastProgressAt: string | null;
  dataCompleteness: {
    hasRecentProgress: boolean;
    hasWeeklyInsight: boolean;
    hasRoadmap: boolean;
    sparseData: boolean;
  } | null;
  sourceDataHash: string;
  version: number;
  generatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AssistantRagContext = {
  child: {
    id: string;
    name: string;
    condition: string;
    routine: string | null;
    supportNeed: string | null;
    focusAreas: FocusAreaLabel[];
  } | null;
  snapshot: SerializedChildContextSnapshot | null;
  recentProgress: Array<{
    id: string;
    area: FocusAreaLabel;
    title: string | null;
    note: string | null;
    insight: string | null;
    observedAt: string;
  }>;
  latestInsightSummary: string | null;
  roadmapTargets: Array<{
    id: string;
    title: string;
    detail: string | null;
    status: string;
  }>;
};

export type AssistantStructuredAnswer = {
  answer: string;
  reasoningSummary: string;
  nextObservationIdeas: string[];
  followupQuestions: string[];
  riskLevel: "low" | "medium" | "high";
  citations?: Array<{
    chunkId: string;
    articleTitle: string;
    citationLabel: string;
  }>;
};

const llmAssistantResponseSchema = {
  validate(value: unknown): AssistantStructuredAnswer | null {
    if (!value || typeof value !== "object") {
      return null;
    }

    const candidate = value as Record<string, unknown>;
    const answer = typeof candidate.answer === "string" ? candidate.answer.trim() : "";
    const reasoningSummary =
      typeof candidate.reasoningSummary === "string"
        ? candidate.reasoningSummary.trim()
        : "";
    const nextObservationIdeas = Array.isArray(candidate.nextObservationIdeas)
      ? candidate.nextObservationIdeas.filter((item): item is string => typeof item === "string")
      : [];
    const followupQuestions = Array.isArray(candidate.followupQuestions)
      ? candidate.followupQuestions.filter((item): item is string => typeof item === "string")
      : [];
    const riskLevel =
      candidate.riskLevel === "low" ||
      candidate.riskLevel === "medium" ||
      candidate.riskLevel === "high"
        ? candidate.riskLevel
        : "low";
    const citations = Array.isArray(candidate.citations)
      ? candidate.citations
          .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
          .map((item) => ({
            chunkId: typeof item.chunkId === "string" ? item.chunkId : "",
            articleTitle: typeof item.articleTitle === "string" ? item.articleTitle : "",
            citationLabel: typeof item.citationLabel === "string" ? item.citationLabel : "",
          }))
          .filter((item) => item.chunkId && item.articleTitle && item.citationLabel)
      : [];

    if (!answer || !reasoningSummary) {
      return null;
    }

    return {
      answer,
      reasoningSummary,
      nextObservationIdeas: nextObservationIdeas.slice(0, 3),
      followupQuestions: followupQuestions.slice(0, 3),
      riskLevel,
      citations: citations.slice(0, 3),
    };
  },
};

const seededKnowledgeArticles = [
  {
    slug: "observasi-transisi-visual-anak",
    title: "Mengamati transisi dengan dukungan visual",
    summary:
      "Gunakan timer, kartu visual, dan catatan konteks untuk melihat apakah transisi menjadi lebih dapat diprediksi.",
    body:
      "Saat anak kesulitan berpindah aktivitas, fokuskan observasi pada tiga hal: pemicu sebelum perubahan, bentuk dukungan visual yang dipakai, dan durasi sampai anak kembali tenang. Catat juga apakah peringatan 1-2 menit sebelumnya membantu. Hindari menyimpulkan terlalu cepat; cari pola selama beberapa hari.",
    category: "transition_support",
    sourceLabel: "Tumbuh Knowledge Base",
    evidenceLevel: "practice_guidance",
    conditionTags: ["autisme", "anak berkebutuhan khusus"],
    focusAreaTags: ["Perilaku", "Komunikasi"],
    safetyTags: ["non_diagnostic", "home_observation"],
  },
  {
    slug: "latihan-komunikasi-rutinitas-harian",
    title: "Latihan komunikasi lewat rutinitas harian",
    summary:
      "Aktivitas komunikasi paling efektif bila menempel pada rutinitas yang konsisten dan memberi ruang respons singkat.",
    body:
      "Pilih momen yang berulang seperti makan, mandi, atau bermain. Berikan dua pilihan konkret lalu beri jeda beberapa detik agar anak sempat merespons. Catat apakah respons muncul dengan kata, gestur, tatapan, atau pendekatan ke objek. Gunakan bahasa observasional dan jangan memaksa kesimpulan klinis dari satu kejadian.",
    category: "communication_support",
    sourceLabel: "Tumbuh Knowledge Base",
    evidenceLevel: "practice_guidance",
    conditionTags: ["autisme", "speech_delay", "anak berkebutuhan khusus"],
    focusAreaTags: ["Komunikasi"],
    safetyTags: ["non_diagnostic", "home_activity"],
  },
  {
    slug: "menyiapkan-konsultasi-dengan-catatan-yang-berguna",
    title: "Menyiapkan konsultasi dengan catatan yang berguna",
    summary:
      "Ringkasan dua minggu berisi konteks, frekuensi, pemicu, dan strategi yang membantu biasanya paling memudahkan diskusi dengan profesional.",
    body:
      "Sebelum konsultasi, rangkum 2 minggu terakhir: kapan kejadian sering muncul, apa pemicunya, bagaimana respons anak, dan strategi apa yang paling membantu. Jika ada perubahan kecil yang konsisten, catat juga. Tujuannya adalah memberi bahan observasi yang konkret, bukan menebak diagnosis.",
    category: "consultation_preparation",
    sourceLabel: "Tumbuh Knowledge Base",
    evidenceLevel: "practice_guidance",
    conditionTags: ["anak berkebutuhan khusus"],
    focusAreaTags: ["Perilaku", "Komunikasi", "Motorik", "Akademik"],
    safetyTags: ["non_diagnostic", "consultation"],
  },
  {
    slug: "membaca-milestone-sebagai-arah-observasi",
    title: "Membaca milestone sebagai arah observasi",
    summary:
      "Milestone sebaiknya dipakai sebagai arah observasi, bukan label untuk menilai kemampuan anak secara mutlak.",
    body:
      "Saat membandingkan kemampuan anak dengan milestone, fokuskan perhatian pada pola, frekuensi, konteks, dan perubahan kecil yang berulang. Jika data belum cukup, akui bahwa observasi masih terbatas. Hindari kata-kata yang terasa seperti vonis klinis. Gunakan temuan ini untuk memutuskan apa yang perlu diamati berikutnya atau kapan diskusi profesional perlu diprioritaskan.",
    category: "education_general",
    sourceLabel: "Tumbuh Knowledge Base",
    evidenceLevel: "practice_guidance",
    conditionTags: ["anak berkebutuhan khusus"],
    focusAreaTags: ["Akademik", "Komunikasi"],
    safetyTags: ["non_diagnostic", "parent_guidance"],
  },
] as const;

const seededPolicies = [
  {
    name: "non_diagnostic_response",
    policyType: "safety",
    priority: 100,
    appliesToIntentTags: [
      "education_general",
      "child_specific_observation",
      "activity_suggestion",
      "roadmap_explanation",
      "consultation_preparation",
      "report_interpretation",
    ],
    content:
      "Gunakan bahasa observasional dan non-diagnostik. Jangan menyimpulkan kondisi klinis, jangan menyebut pasti ada gangguan tertentu, dan jangan menyamakan pola observasi dengan diagnosis.",
  },
  {
    name: "no_medication_or_dosage",
    policyType: "safety",
    priority: 110,
    appliesToIntentTags: [
      "education_general",
      "child_specific_observation",
      "report_interpretation",
      "high_risk_or_clinical_boundary",
    ],
    content:
      "Jangan memberi saran obat, dosis, perubahan terapi medis, atau instruksi klinis. Arahkan guardian untuk membahas hal tersebut dengan dokter atau profesional terkait.",
  },
  {
    name: "use_child_data_only_if_present",
    policyType: "faithfulness",
    priority: 90,
    appliesToIntentTags: [
      "child_specific_observation",
      "activity_suggestion",
      "roadmap_explanation",
      "consultation_preparation",
      "report_interpretation",
    ],
    content:
      "Sebutkan fakta child hanya jika fakta itu ada di context yang diberikan. Jika data belum cukup, katakan dengan jujur bahwa observasi masih terbatas.",
  },
  {
    name: "escalate_high_risk",
    policyType: "safety",
    priority: 120,
    appliesToIntentTags: ["high_risk_or_clinical_boundary"],
    content:
      "Jika pertanyaan menyebut tanda bahaya, kondisi mendesak, self-harm, kejang, sesak, penolakan makan/minum berat, atau regresi yang mengkhawatirkan, arahkan segera ke tenaga medis atau profesional. Jangan melanjutkan jawaban seolah ini masalah ringan.",
  },
] as const;

function stableJsonStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJsonStringify(item)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
    left.localeCompare(right),
  );

  return `{${entries
    .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableJsonStringify(entryValue)}`)
    .join(",")}}`;
}

function buildHash(value: unknown) {
  return createHash("sha256").update(stableJsonStringify(value)).digest("hex");
}

function parseStringArray(value: Prisma.JsonValue | null): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function tokenize(text: string) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9à-ÿ]+/i)
    .map((item) => item.trim())
    .filter((item) => item.length >= 3);
}

function dedupeStrings(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

function hashToken(token: string) {
  let hash = 2166136261;

  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return Math.abs(hash >>> 0);
}

function normalizeVector(vector: number[]) {
  const magnitude = Math.sqrt(vector.reduce((total, value) => total + value * value, 0));

  if (!magnitude) {
    return vector;
  }

  return vector.map((value) => Number((value / magnitude).toFixed(6)));
}

function buildTextEmbedding(text: string, extraTokens: string[] = []) {
  const vector = Array.from({ length: embeddingDimension }, () => 0);
  const tokens = dedupeStrings([...tokenize(text), ...extraTokens.map((token) => token.toLowerCase())]);

  for (const token of tokens) {
    const bucket = hashToken(token) % embeddingDimension;
    vector[bucket] += 1;
  }

  return normalizeVector(vector);
}

function parseEmbedding(value: Prisma.JsonValue | null): number[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const parsed = value
    .map((item) => (typeof item === "number" ? item : Number(item)))
    .filter((item) => Number.isFinite(item));

  if (parsed.length !== embeddingDimension) {
    return null;
  }

  return parsed;
}

function cosineSimilarity(left: number[], right: number[]) {
  if (left.length !== right.length || left.length === 0) {
    return 0;
  }

  let dot = 0;

  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
  }

  return dot;
}

function chunkArticleBody(body: string) {
  const sentences = body
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length <= 2) {
    return [body.trim()];
  }

  const chunks: string[] = [];

  for (let index = 0; index < sentences.length; index += 2) {
    chunks.push(sentences.slice(index, index + 2).join(" "));
  }

  return chunks;
}

function buildChunkEmbeddingInput(input: {
  articleTitle: string;
  category: string;
  heading: string | null;
  chunkText: string;
  focusAreaTags: string[];
  conditionTags: string[];
  safetyTags: string[];
  keywords: string[];
}) {
  return [
    input.articleTitle,
    input.category,
    input.heading ?? "",
    input.chunkText,
    ...input.focusAreaTags,
    ...input.conditionTags,
    ...input.safetyTags,
    ...input.keywords,
  ]
    .filter(Boolean)
    .join(" ");
}

export async function ensureSeedKnowledgeBase() {
  const existingArticles = await prisma.knowledgeArticle.findMany({
    select: knowledgeArticleSelect,
  });

  if (existingArticles.length === 0) {
    for (const article of seededKnowledgeArticles) {
      const created = await prisma.knowledgeArticle.create({
        data: {
          slug: article.slug,
          title: article.title,
          summary: article.summary,
          body: article.body,
          category: article.category,
          sourceLabel: article.sourceLabel,
          evidenceLevel: article.evidenceLevel,
          conditionTags: article.conditionTags,
          focusAreaTags: article.focusAreaTags,
          safetyTags: article.safetyTags,
          reviewStatus: "approved",
          approvedBy: "system",
          publishedAt: new Date(),
        },
        select: {
          id: true,
        },
      });

      const chunks = chunkArticleBody(`${article.summary} ${article.body}`);

      await prisma.knowledgeChunk.createMany({
        data: chunks.map((chunkText, index) => {
          const keywords = dedupeStrings([
            ...tokenize(article.title),
            ...tokenize(article.summary),
            ...tokenize(chunkText),
          ]).slice(0, 16);

          return {
            articleId: created.id,
            chunkIndex: index,
            heading: article.title,
            chunkText,
            keywords,
            embedding: buildTextEmbedding(
              buildChunkEmbeddingInput({
                articleTitle: article.title,
                category: article.category,
                heading: article.title,
                chunkText,
                focusAreaTags: [...article.focusAreaTags],
                conditionTags: [...article.conditionTags],
                safetyTags: [...article.safetyTags],
                keywords,
              }),
            ) as unknown as Prisma.InputJsonValue,
            conditionTags: article.conditionTags,
            focusAreaTags: article.focusAreaTags,
            safetyTags: article.safetyTags,
            reviewStatus: "approved",
            tokenCount: chunkText.split(/\s+/).length,
          };
        }),
      });
    }
  }

  const chunksMissingEmbedding = existingArticles
    .flatMap((article) =>
      article.chunks.map((chunk) => ({
        article,
        chunk,
      })),
    )
    .filter(({ chunk }) => !parseEmbedding(chunk.embedding));

  for (const { article, chunk } of chunksMissingEmbedding) {
    const keywords = parseStringArray(chunk.keywords);

    await prisma.knowledgeChunk.update({
      where: {
        id: chunk.id,
      },
      data: {
        embedding: buildTextEmbedding(
          buildChunkEmbeddingInput({
            articleTitle: article.title,
            category: article.category,
            heading: chunk.heading,
            chunkText: chunk.chunkText,
            focusAreaTags: parseStringArray(chunk.focusAreaTags),
            conditionTags: parseStringArray(chunk.conditionTags),
            safetyTags: parseStringArray(chunk.safetyTags),
            keywords,
          }),
        ) as unknown as Prisma.InputJsonValue,
      },
    });
  }
}

export async function ensureSeedAssistantPolicies() {
  const count = await prisma.assistantPolicy.count();
  if (count > 0) {
    return;
  }

  await prisma.assistantPolicy.createMany({
    data: seededPolicies.map((policy) => ({
      ...policy,
      active: true,
    })),
  });
}

function serializeSnapshot(snapshot: ChildContextSnapshotRecord): SerializedChildContextSnapshot {
  return {
    id: snapshot.id,
    childId: snapshot.childId,
    snapshotType: snapshot.snapshotType,
    summary: snapshot.summary,
    strengths: parseStringArray(snapshot.strengths),
    risks: parseStringArray(snapshot.risks),
    activeFocusAreas: parseStringArray(snapshot.activeFocusAreas),
    latestPatterns: parseStringArray(snapshot.latestPatterns),
    latestRoadmapTargets: parseStringArray(snapshot.latestRoadmapTargets),
    latestInsightId: snapshot.latestInsightId,
    progressCount: snapshot.progressCount,
    roadmapCount: snapshot.roadmapCount,
    progressWindowDays: snapshot.progressWindowDays,
    lastProgressAt: snapshot.lastProgressAt?.toISOString() ?? null,
    dataCompleteness:
      snapshot.dataCompleteness && typeof snapshot.dataCompleteness === "object" && !Array.isArray(snapshot.dataCompleteness)
        ? (snapshot.dataCompleteness as SerializedChildContextSnapshot["dataCompleteness"])
        : null,
    sourceDataHash: snapshot.sourceDataHash,
    version: snapshot.version,
    generatedBy: snapshot.generatedBy,
    createdAt: snapshot.createdAt.toISOString(),
    updatedAt: snapshot.updatedAt.toISOString(),
  };
}

function serializeKnowledgeChunks(articles: KnowledgeArticleRecord[]) {
  return articles.flatMap((article) =>
    article.chunks.map((chunk: KnowledgeArticleRecord["chunks"][number]) => ({
      id: chunk.id,
      articleId: article.id,
      articleTitle: article.title,
      category: article.category,
      heading: chunk.heading,
      chunkText: chunk.chunkText,
      conditionTags: parseStringArray(chunk.conditionTags),
      focusAreaTags: parseStringArray(chunk.focusAreaTags),
      safetyTags: parseStringArray(chunk.safetyTags),
      keywords: parseStringArray(chunk.keywords),
      embedding: parseEmbedding(chunk.embedding),
      citationLabel: `${article.title}#${chunk.chunkIndex + 1}`,
    })),
  );
}

function serializePolicies(policies: AssistantPolicyRecord[]): SerializedAssistantPolicy[] {
  return policies.map((policy) => ({
    id: policy.id,
    name: policy.name,
    policyType: policy.policyType,
    content: policy.content,
    priority: policy.priority,
    appliesToIntentTags: parseStringArray(policy.appliesToIntentTags),
  }));
}

export function classifyAssistantIntent(question: string): AssistantIntent {
  const normalized = question.toLowerCase();

  if (
    normalized.includes("diagnosa") ||
    normalized.includes("diagnosis") ||
    normalized.includes("obat") ||
    normalized.includes("dosis") ||
    normalized.includes("kejang") ||
    normalized.includes("sesak") ||
    normalized.includes("menyakiti diri")
  ) {
    return "high_risk_or_clinical_boundary";
  }

  if (
    normalized.includes("konsultasi") ||
    normalized.includes("terapis") ||
    normalized.includes("dokter")
  ) {
    return "consultation_preparation";
  }

  if (
    normalized.includes("roadmap") ||
    normalized.includes("target") ||
    normalized.includes("prioritas")
  ) {
    return "roadmap_explanation";
  }

  if (
    normalized.includes("aktivitas") ||
    normalized.includes("latihan") ||
    normalized.includes("coba apa")
  ) {
    return "activity_suggestion";
  }

  if (
    normalized.includes("laporan") ||
    normalized.includes("hasil") ||
    normalized.includes("arti")
  ) {
    return "report_interpretation";
  }

  if (
    normalized.includes("anak saya") ||
    normalized.includes("tantrum") ||
    normalized.includes("transisi") ||
    normalized.includes("kontak mata") ||
    normalized.includes("bicara") ||
    normalized.includes("perkembangan")
  ) {
    return "child_specific_observation";
  }

  return "education_general";
}

export async function retrieveAssistantPolicies(intent: AssistantIntent) {
  await ensureSeedAssistantPolicies();

  const policies = await prisma.assistantPolicy.findMany({
    where: {
      active: true,
    },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    select: policySelect,
  });

  return serializePolicies(policies).filter((policy) => {
    return (
      policy.appliesToIntentTags.length === 0 ||
      policy.appliesToIntentTags.includes(intent)
    );
  });
}

export async function buildChildAssistantContext(childId: string): Promise<AssistantRagContext> {
  const child = await prisma.child.findUniqueOrThrow({
    where: {
      id: childId,
    },
    select: {
      id: true,
      name: true,
      condition: true,
      routine: true,
      supportNeed: true,
      focusAreas: true,
      progressEntries: {
        where: {
          deletedAt: null,
        },
        orderBy: {
          observedAt: "desc",
        },
        take: 8,
        select: {
          id: true,
          area: true,
          title: true,
          note: true,
          insight: true,
          observedAt: true,
        },
      },
      roadmapItems: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        take: 5,
        select: {
          id: true,
          title: true,
          detail: true,
          status: true,
        },
      },
      insights: {
        where: {
          kind: "WEEKLY",
          isActive: true,
        },
        orderBy: [{ version: "desc" }, { createdAt: "desc" }],
        take: 1,
        select: {
          id: true,
          summary: true,
          alerts: true,
        },
      },
    },
  });

  const focusAreas = mapFocusAreasToLabel(child.focusAreas);
  const recentProgress = child.progressEntries.map((entry) => ({
    id: entry.id,
    area: mapFocusAreasToLabel([entry.area])[0],
    title: entry.title,
    note: entry.note,
    insight: entry.insight,
    observedAt: entry.observedAt.toISOString(),
  }));
  const roadmapTargets = child.roadmapItems.map((item) => ({
    id: item.id,
    title: item.title,
    detail: item.detail,
    status: item.status,
  }));
  const latestInsight = child.insights[0] ?? null;
  const latestInsightSummary = latestInsight?.summary ?? null;
  const progressCount = recentProgress.length;
  const roadmapCount = roadmapTargets.length;
  const lastProgressAt = child.progressEntries[0]?.observedAt ?? null;
  const dataCompleteness = {
    hasRecentProgress: progressCount > 0,
    hasWeeklyInsight: Boolean(latestInsightSummary),
    hasRoadmap: roadmapCount > 0,
    sparseData: progressCount < 2,
  };
  const strengths = dedupeStrings(
    roadmapTargets
      .filter((item) => item.status === RoadmapStatus.ACHIEVED || item.status === RoadmapStatus.IN_PROGRESS)
      .map((item) => item.title),
  ).slice(0, 3);
  const risks = dedupeStrings(
    [
      ...roadmapTargets
        .filter((item) => item.status === RoadmapStatus.NEEDS_ATTENTION)
        .map((item) => item.title),
      ...parseStringArray(latestInsight?.alerts ?? null),
    ],
  ).slice(0, 4);
  const latestPatterns = dedupeStrings(
    recentProgress
      .map((entry) => entry.insight ?? entry.note ?? entry.title ?? "")
      .filter(Boolean),
  ).slice(0, 4);
  const latestRoadmapTargets = roadmapTargets.map((item) => item.title).slice(0, 4);

  const snapshotPayload = {
    childId: child.id,
    childName: child.name,
    condition: child.condition,
    focusAreas,
    routine: child.routine,
    supportNeed: child.supportNeed,
    recentProgress,
    roadmapTargets,
    latestInsightSummary,
    progressCount,
    roadmapCount,
    lastProgressAt: lastProgressAt?.toISOString() ?? null,
    dataCompleteness,
  };

  const sourceDataHash = buildHash(snapshotPayload);
  const existingSnapshot = await prisma.childContextSnapshot.findFirst({
    where: {
      childId,
      snapshotType: "assistant",
      sourceDataHash,
    },
    orderBy: [{ version: "desc" }, { createdAt: "desc" }],
    select: snapshotSelect,
  });

  let snapshot = existingSnapshot;

  if (!snapshot) {
    const latestVersionRecord = await prisma.childContextSnapshot.findFirst({
      where: {
        childId,
        snapshotType: "assistant",
      },
      orderBy: [{ version: "desc" }, { createdAt: "desc" }],
      select: {
        version: true,
      },
    });

    snapshot = await prisma.childContextSnapshot.create({
      data: {
        childId,
        snapshotType: "assistant",
        summary:
          latestInsightSummary ??
          `Fokus utama ${child.name} saat ini ada pada ${focusAreas.join(", ")}. Tambahkan observasi rutin agar konteks assistant makin kaya.`,
        strengths,
        risks,
        activeFocusAreas: focusAreas,
        latestPatterns,
        latestRoadmapTargets,
        latestInsightId: latestInsight?.id ?? null,
        progressCount,
        roadmapCount,
        progressWindowDays: 14,
        lastProgressAt,
        dataCompleteness,
        sourceDataHash,
        version: (latestVersionRecord?.version ?? 0) + 1,
        generatedBy: "system",
      },
      select: snapshotSelect,
    });
  } else {
    const shouldRefreshExistingSnapshot =
      snapshot.progressCount !== progressCount ||
      snapshot.roadmapCount !== roadmapCount ||
      snapshot.lastProgressAt?.toISOString() !== lastProgressAt?.toISOString() ||
      stableJsonStringify(snapshot.dataCompleteness) !== stableJsonStringify(dataCompleteness);

    if (shouldRefreshExistingSnapshot) {
      snapshot = await prisma.childContextSnapshot.update({
        where: {
          id: snapshot.id,
        },
        data: {
          summary:
            latestInsightSummary ??
            `Fokus utama ${child.name} saat ini ada pada ${focusAreas.join(", ")}. Tambahkan observasi rutin agar konteks assistant makin kaya.`,
          strengths,
          risks,
          activeFocusAreas: focusAreas,
          latestPatterns,
          latestRoadmapTargets,
          latestInsightId: latestInsight?.id ?? null,
          progressCount,
          roadmapCount,
          progressWindowDays: 14,
          lastProgressAt,
          dataCompleteness,
        },
        select: snapshotSelect,
      });
    }
  }

  return {
    child: {
      id: child.id,
      name: child.name,
      condition: child.condition,
      routine: child.routine,
      supportNeed: child.supportNeed,
      focusAreas,
    },
    snapshot: serializeSnapshot(snapshot),
    recentProgress,
    latestInsightSummary,
    roadmapTargets,
  };
}

export async function getLatestAssistantSnapshotForChild(childId: string) {
  const snapshot = await prisma.childContextSnapshot.findFirst({
    where: {
      childId,
      snapshotType: "assistant",
    },
    orderBy: [{ version: "desc" }, { createdAt: "desc" }],
    select: snapshotSelect,
  });

  return snapshot ? serializeSnapshot(snapshot) : null;
}

export async function retrieveKnowledgeChunks(input: {
  question: string;
  childContext: AssistantRagContext;
  limit?: number;
}) {
  await ensureSeedKnowledgeBase();

  const articles = await prisma.knowledgeArticle.findMany({
    where: {
      reviewStatus: "approved",
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: knowledgeArticleSelect,
  });

  const allChunks = serializeKnowledgeChunks(articles);
  const queryTokens = tokenize(input.question);
  const focusAreaTokens = input.childContext.child?.focusAreas.map((area) => area.toLowerCase()) ?? [];
  const conditionTokens = input.childContext.child?.condition
    ? tokenize(input.childContext.child.condition)
    : [];
  const queryEmbedding = buildTextEmbedding(input.question, [...focusAreaTokens, ...conditionTokens]);

  const ranked = allChunks
    .map((chunk) => {
      const corpus = [
        chunk.articleTitle,
        chunk.category,
        chunk.heading ?? "",
        chunk.chunkText,
        ...chunk.keywords,
        ...chunk.focusAreaTags,
        ...chunk.conditionTags,
      ]
        .join(" ")
        .toLowerCase();

      let lexicalScore = 0;
      const retrievalReasons: string[] = [];

      for (const token of queryTokens) {
        if (corpus.includes(token)) {
          lexicalScore += 3;
        }
      }

      for (const token of focusAreaTokens) {
        if (corpus.includes(token)) {
          lexicalScore += 2;
        }
      }

      for (const token of conditionTokens) {
        if (corpus.includes(token)) {
          lexicalScore += 1;
        }
      }

      const chunkEmbedding =
        chunk.embedding ??
        buildTextEmbedding(
          buildChunkEmbeddingInput({
            articleTitle: chunk.articleTitle,
            category: chunk.category,
            heading: chunk.heading,
            chunkText: chunk.chunkText,
            focusAreaTags: chunk.focusAreaTags,
            conditionTags: chunk.conditionTags,
            safetyTags: chunk.safetyTags,
            keywords: chunk.keywords,
          }),
        );
      const semanticScore = cosineSimilarity(queryEmbedding, chunkEmbedding);
      let metadataBoost = 0;

      if (chunk.focusAreaTags.some((tag) => focusAreaTokens.some((token) => tag.toLowerCase().includes(token)))) {
        metadataBoost += 1.5;
        retrievalReasons.push("focus_area_match");
      }

      if (chunk.conditionTags.some((tag) => conditionTokens.some((token) => tag.toLowerCase().includes(token)))) {
        metadataBoost += 1;
        retrievalReasons.push("condition_match");
      }

      if (lexicalScore > 0) {
        retrievalReasons.push("keyword_overlap");
      }

      if (semanticScore >= 0.2) {
        retrievalReasons.push("semantic_similarity");
      }

      const retrievalScore = Number((lexicalScore + metadataBoost + semanticScore * 8).toFixed(4));

      return {
        ...chunk,
        retrievalScore,
        retrievalReasons: dedupeStrings(retrievalReasons),
      };
    })
    .filter((chunk) => chunk.retrievalScore > 1.5)
    .sort((left, right) => right.retrievalScore - left.retrievalScore)
    .slice(0, input.limit ?? 4);

  return ranked;
}

function getAssistantLlmConfig() {
  const apiUrl = process.env.INSIGHT_LLM_API_URL?.trim();
  const apiKey = process.env.INSIGHT_LLM_API_KEY?.trim();
  const model = process.env.INSIGHT_LLM_MODEL?.trim();

  if (!apiUrl || !apiKey || !model) {
    return null;
  }

  // Extract base URL (remove /chat/completions path for OpenAI SDK)
  const baseURL = apiUrl.replace(/\/chat\/completions\/?$/, "");

  return { apiUrl, apiKey, model, baseURL };
}

function parseChatCompletionContent(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    return null;
  }

  const message = (choices[0] as { message?: { content?: unknown } }).message;
  return typeof message?.content === "string" ? message.content : null;
}

export function buildAssistantFallbackAnswer(input: {
  question: string;
  intent: AssistantIntent;
  context: AssistantRagContext;
  chunks: SerializedKnowledgeChunk[];
}): AssistantStructuredAnswer {
  const childLabel = input.context.child?.name ? `untuk ${input.context.child.name}` : "untuk anak Anda";
  const firstChunk = input.chunks[0];
  const firstRoadmap = input.context.roadmapTargets[0];
  const firstProgress = input.context.recentProgress[0];

  if (input.intent === "high_risk_or_clinical_boundary") {
    return {
      answer:
        "Saya tidak bisa memberi diagnosis, obat, atau keputusan klinis. Jika ada tanda bahaya atau kondisi yang terasa mendesak, segera hubungi tenaga medis atau profesional yang mendampingi anak.",
      reasoningSummary:
        "Pertanyaan ini masuk batas klinis atau high-risk sehingga jawaban diarahkan ke langkah aman dan profesional.",
      nextObservationIdeas: [
        "Catat kapan gejala muncul dan berapa lama berlangsung.",
        "Catat pemicu yang terjadi tepat sebelum kondisi memburuk.",
      ],
      followupQuestions: [
        "Apakah ada perubahan mendadak yang terasa mengkhawatirkan?",
        "Apakah ada profesional yang sedang mendampingi anak saat ini?",
      ],
      riskLevel: "high",
    };
  }

  const answerParts = [
    firstProgress?.insight ||
      firstProgress?.note ||
      input.context.latestInsightSummary ||
      `Saya membaca konteks terbaru ${childLabel} dari data yang tersedia.`,
    firstChunk
      ? `Panduan yang paling relevan saat ini menekankan: ${firstChunk.chunkText}`
      : "Data yang ada masih terbatas, jadi saran di bawah ini sebaiknya dipakai sebagai panduan observasi awal.",
    firstRoadmap
      ? `Target roadmap yang paling dekat untuk dipantau sekarang adalah "${firstRoadmap.title}".`
      : null,
  ].filter(Boolean);

  return {
    answer: `${answerParts.join(" ")} Jawaban ini bukan diagnosis, tetapi bisa dipakai sebagai bahan observasi dan diskusi lanjutan.`,
    reasoningSummary:
      "Jawaban disusun dari progress terbaru, snapshot child, target roadmap aktif, dan knowledge chunk yang paling relevan.",
    nextObservationIdeas: dedupeStrings([
      "Catat konteks sebelum kejadian muncul, termasuk aktivitas sebelumnya.",
      "Catat apa yang membantu anak kembali tenang atau lebih responsif.",
      firstChunk?.articleTitle
        ? `Lihat apakah strategi dari "${firstChunk.articleTitle}" cocok diterapkan secara konsisten beberapa hari.`
        : "",
    ]).slice(0, 3),
    followupQuestions: dedupeStrings([
      "Kapan pola ini paling sering muncul dalam rutinitas harian?",
      "Apakah ada perubahan kecil setelah dukungan visual, jeda, atau prompt tertentu?",
      input.intent === "consultation_preparation"
        ? "Catatan mana dari dua minggu terakhir yang paling ingin dibawa saat konsultasi?"
        : "",
    ]).slice(0, 3),
    riskLevel: "low",
    citations: input.chunks.slice(0, 2).map((chunk) => ({
      chunkId: chunk.id,
      articleTitle: chunk.articleTitle,
      citationLabel: chunk.citationLabel,
    })),
  };
}

export async function generateAssistantAnswer(input: {
  question: string;
  intent: AssistantIntent;
  context: AssistantRagContext;
  chunks: SerializedKnowledgeChunk[];
  policies: SerializedAssistantPolicy[];
  conversationHistory: Array<{
    role: string;
    content: string;
  }>;
}) {
  const { default: OpenAI } = await import("openai");
  const config = getAssistantLlmConfig();
  const fallback = buildAssistantFallbackAnswer(input);

  if (!config) {
    return {
      structured: fallback,
      fallbackUsed: true,
      modelName: null,
      rawResponse: fallback as unknown as Prisma.InputJsonValue,
    };
  }

  const openai = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });

  const systemPrompt = [
    "Anda adalah Tumbuh AI — assistant parenting support untuk anak berkebutuhan khusus.",
    "Gunakan hanya data child dan knowledge chunks yang diberikan.",
    "Jangan memberi diagnosis, obat, dosis, atau klaim klinis.",
    "Jika data belum cukup, katakan dengan jujur.",
    "Beri saran observasi atau langkah rumah yang aman dan sederhana.",
    "Jika terlihat high-risk, arahkan ke profesional.",
    "Jawab dalam bahasa Indonesia yang hangat dan suportif.",
    "",
    "POLICIES:",
    ...input.policies.map((policy) => `- ${policy.content}`),
    "",
    "CHILD CONTEXT:",
    input.context.child
      ? `Nama: ${input.context.child.name}, Kondisi: ${input.context.child.condition}, Fokus: ${input.context.child.focusAreas.join(", ")}, Rutinitas: ${input.context.child.routine ?? "-"}`
      : "Tidak ada child context.",
    input.context.latestInsightSummary
      ? `Insight terakhir: ${input.context.latestInsightSummary}`
      : "",
    input.context.roadmapTargets.length > 0
      ? `Target roadmap aktif: ${input.context.roadmapTargets.map((t) => `${t.title} (${t.status})`).join(", ")}`
      : "",
    input.context.recentProgress.length > 0
      ? `Observasi terbaru: ${input.context.recentProgress.slice(0, 5).map((p) => `[${p.area}] ${p.note ?? p.title ?? "-"}`).join("; ")}`
      : "",
    "",
    "KNOWLEDGE BASE:",
    ...input.chunks.map((chunk) => `[${chunk.citationLabel}] ${chunk.chunkText}`),
    "",
    "Balas dalam JSON: { answer, reasoningSummary, nextObservationIdeas (max 3), followupQuestions (max 3), riskLevel (low/medium/high), citations (array {chunkId, articleTitle, citationLabel} max 3) }",
  ].filter(Boolean).join("\n");

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
  ];

  for (const msg of input.conversationHistory.slice(-4)) {
    messages.push({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    });
  }

  messages.push({ role: "user", content: input.question });

  try {
    const completion = await openai.chat.completions.create({
      model: config.model,
      temperature: 0.15,
      response_format: { type: "json_object" },
      messages,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error("Assistant LLM content is empty");
    }

    const parsed = llmAssistantResponseSchema.validate(JSON.parse(content));

    if (!parsed) {
      throw new Error("Assistant LLM response did not match expected schema");
    }

    return {
      structured: parsed,
      fallbackUsed: false,
      modelName: config.model,
      rawResponse: completion as unknown as Prisma.InputJsonValue,
    };
  } catch (error) {
    console.error("Assistant LLM failed, using fallback response", error);
    return {
      structured: fallback,
      fallbackUsed: true,
      modelName: config.model,
      rawResponse: fallback as unknown as Prisma.InputJsonValue,
    };
  }
}

export async function createAssistantResponseLog(input: {
  guardianId: string;
  childId: string | null;
  conversationId: string | null;
  question: string;
  intent: AssistantIntent;
  snapshotIds: string[];
  progressEntryIds: string[];
  knowledgeChunkIds: string[];
  policyIds: string[];
  modelName: string | null;
  requestPayload: Prisma.InputJsonValue;
  responseText: string;
  responseJson: Prisma.InputJsonValue;
  safetyOutcome: string;
  fallbackUsed: boolean;
  latencyMs: number;
}) {
  return prisma.assistantResponseLog.create({
    data: {
      guardianId: input.guardianId,
      childId: input.childId,
      conversationId: input.conversationId,
      question: input.question,
      intent: input.intent,
      retrievedChildSnapshotIds: input.snapshotIds,
      retrievedProgressEntryIds: input.progressEntryIds,
      retrievedKnowledgeChunkIds: input.knowledgeChunkIds,
      retrievedPolicyIds: input.policyIds,
      promptVersion: assistantPromptVersion,
      modelName: input.modelName,
      requestPayload: input.requestPayload,
      responseText: input.responseText,
      responseJson: input.responseJson,
      safetyOutcome: input.safetyOutcome,
      fallbackUsed: input.fallbackUsed,
      latencyMs: input.latencyMs,
    },
    select: {
      id: true,
      createdAt: true,
    },
  });
}

export function getAssistantPromptVersion() {
  return assistantPromptVersion;
}
