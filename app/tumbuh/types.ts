export type Area = "Komunikasi" | "Motorik" | "Perilaku" | "Akademik";

export type Screen =
  | "home"
  | "onboarding"
  | "dashboard"
  | "roadmap"
  | "progress"
  | "education"
  | "consultation"
  | "handoff"
  | "settings";

export type ChildProfile = {
  name: string;
  birthDate: string;
  condition: string;
  focusAreas: Area[];
};

export type GuardianProfile = {
  id: string;
  authUserId: string;
  email: string;
  displayName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MeResponse = {
  guardian: GuardianProfile;
  onboarding: {
    childCount: number;
    completedChildCount: number;
    hasChildren: boolean;
    hasCompletedOnboarding: boolean;
  };
};

export type ChildApiModel = {
  id: string;
  guardianId: string;
  name: string;
  birthDate: string;
  condition: string;
  focusAreas: Area[];
  routine: string | null;
  supportNeed: string | null;
  onboardingCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ChildrenResponse = {
  children: ChildApiModel[];
};

export type OnboardingPayload = ChildProfile & {
  routine: string;
  supportNeed: string;
};

export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type MediaAssetApiModel = {
  id: string;
  childId: string;
  progressEntryId: string | null;
  type: "Foto" | "Suara" | "Dokumen";
  storageBucket: string | null;
  storageKey: string;
  url: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  status: "PENDING_UPLOAD" | "UPLOADED" | "PROCESSING" | "COMPLETED" | "FAILED";
  statusLabel: string;
  processingError: string | null;
  processedOutput: Record<string, unknown> | null;
  latestJob: {
    id: string;
    kind: string;
    status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
    attempts: number;
    error: string | null;
    createdAt: string;
    updatedAt: string;
    startedAt: string | null;
    completedAt: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type ProgressEntryApiModel = {
  id: string;
  childId: string;
  area: Area;
  inputType: "Teks" | "Foto" | "Suara";
  title: string | null;
  note: string | null;
  insight: string | null;
  observedAt: string;
  createdAt: string;
  updatedAt: string;
  mediaAssets: MediaAssetApiModel[];
};

export type ProgressListResponse = {
  entries: ProgressEntryApiModel[];
  pageInfo: {
    hasMore: boolean;
    nextCursor: string | null;
  };
};

export type RoadmapItemApiModel = {
  id: string;
  childId: string;
  area: Area;
  title: string;
  detail: string | null;
  status: "ACHIEVED" | "IN_PROGRESS" | "NEXT_TARGET" | "NEEDS_ATTENTION" | "PAUSED";
  statusLabel: string;
  tone: string;
  evidence: string[];
  confidenceScore: number;
  sortOrder: number;
  achievedAt: string | null;
  lastPersonalizedAt: string | null;
  personalizationSource: string | null;
  sourceInsightId: string | null;
  personalizationReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InsightApiModel = {
  id: string;
  childId: string;
  progressEntryId: string | null;
  kind: "WEEKLY" | "ENTRY" | "ROADMAP" | "ASSISTANT" | "DOCUMENT";
  summary: string;
  alerts: string[];
  recommendations: string[];
  confidenceScore: number;
  rangeStart: string | null;
  rangeEnd: string | null;
  generatedBy: string | null;
  sourceDataHash: string | null;
  status: string;
  version: number;
  modelName: string | null;
  promptVersion: string | null;
  isActive: boolean;
  staleAt: string | null;
  generatedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DashboardData = {
  metrics: {
    notesThisWeek: number;
    completedActivities: number;
    achievedTargets: number;
    alertCount: number;
  };
  chart: Array<{
    label: string;
    value: number;
  }>;
  trend: {
    direction: "up" | "flat";
    label: string;
  };
  latestInsight: InsightApiModel | null;
  activities: Array<{
    title: string;
    body: string;
    area: string;
  }>;
  roadmapPreview: RoadmapItemApiModel[];
  meta: {
    hasMeaningfulProgress: boolean;
    hasCurrentWeekEntries: boolean;
    usesSeedRoadmap: boolean;
    shouldUsePlaceholder: boolean;
  };
};

export type RoadmapResponse = {
  items: RoadmapItemApiModel[];
  meta: {
    personalizedAt: string | null;
    personalizationSource: string | null;
    sourceInsightId: string | null;
    isDerivedFromLatestInsight: boolean;
    hasMeaningfulProgress: boolean;
    shouldUsePlaceholder: boolean;
    isSeedOnly: boolean;
  };
};

export type ArticleApiModel = {
  id: string;
  slug: string;
  title: string;
  category: string;
  readTime: number;
  summary: string;
  content: string;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ArticlesResponse = {
  articles: ArticleApiModel[];
};

export type AssistantConversationApiModel = {
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

export type AssistantChatResponse = {
  reply: string;
  conversation: AssistantConversationApiModel;
};

export type ConsultationRecommendationApiModel = {
  title: string;
  reason: string;
  prepare: string;
  specialty: string;
};

export type ConsultationResponse = {
  child: {
    id: string;
    name: string;
  };
  latestInsightSummary: string | null;
  recommendations: ConsultationRecommendationApiModel[];
  meta: {
    hasMeaningfulProgress: boolean;
    shouldUsePlaceholder: boolean;
  };
};

export type AdminKnowledgeArticle = {
  id: string;
  slug: string;
  title: string;
  category: string;
  reviewStatus: string;
  reviewedBy: string | null;
  reviewNotes: string | null;
  lastReviewedAt: string | null;
  approvedBy: string | null;
  publishedAt: string | null;
  focusAreaTags: string[];
  conditionTags: string[];
  chunkCount: number;
};

export type AdminKnowledgeChunk = {
  id: string;
  articleId: string;
  chunkIndex: number;
  heading: string | null;
  chunkText: string;
  reviewStatus: string;
  reviewedBy: string | null;
  reviewNotes: string | null;
  lastReviewedAt: string | null;
  focusAreaTags: string[];
  conditionTags: string[];
  article: {
    id: string;
    title: string;
    slug: string;
    category: string;
  };
};

export type AdminEvaluationItem = {
  id: string;
  childId: string | null;
  childName: string | null;
  responseLogId: string;
  question: string;
  overallScore: number;
  relevanceScore: number;
  safetyScore: number;
  faithfulnessScore: number;
  actionabilityScore: number;
  issues: string[];
  summary: string | null;
  createdAt: string;
};

export type AdminChildSnapshotHealth = {
  childId: string;
  childName: string;
  onboardingCompletedAt: string | null;
  progressCount: number;
  snapshot: {
    id: string;
    version: number;
    summary: string;
    progressCount: number;
    roadmapCount: number;
    lastProgressAt: string | null;
    sparseData: boolean;
    hasWeeklyInsight: boolean;
    updatedAt: string;
  } | null;
};

export type AdminDashboardData = {
  overview: {
    articleCount: number;
    chunkCount: number;
    pendingReviewCount: number;
    childCount: number;
    responseLogCount: number;
    fallbackCount: number;
    evaluationCount: number;
    averageOverallScore: number | null;
    lowScoreCount: number;
  };
  issueHotspots: Array<{
    issue: string;
    count: number;
  }>;
  reviewQueue: {
    articles: AdminKnowledgeArticle[];
    chunks: AdminKnowledgeChunk[];
  };
  latestEvaluations: AdminEvaluationItem[];
  childHealth: AdminChildSnapshotHealth[];
};

export type AdminDashboardResponse = {
  dashboard: AdminDashboardData;
};

export type UiArticleSummary = {
  title: string;
  category: string;
  readTime: string;
  body: string;
  slug?: string;
};

export type ProgressEntry = {
  id: string;
  type: "Teks" | "Foto" | "Suara";
  title: string;
  note: string;
  area: Area;
  date: string;
  insight: string;
  mediaUrl?: string | null;
  mediaStatusLabel?: string | null;
  mediaProcessingError?: string | null;
};

export type MediaUploadResponse = {
  asset: MediaAssetApiModel;
  upload: {
    uploadUrl: string;
    uploadMethod: "PUT";
    uploadHeaders: Record<string, string>;
  };
};

export type AuthState = "loading" | "ready" | "unauthenticated" | "error";
