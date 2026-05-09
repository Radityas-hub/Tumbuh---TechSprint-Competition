CREATE TABLE "knowledge_articles" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT,
  "body" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "source_label" TEXT,
  "source_url" TEXT,
  "evidence_level" TEXT,
  "language" TEXT NOT NULL DEFAULT 'id-ID',
  "age_min_months" INTEGER,
  "age_max_months" INTEGER,
  "condition_tags" JSONB,
  "focus_area_tags" JSONB,
  "safety_tags" JSONB,
  "review_status" TEXT NOT NULL DEFAULT 'approved',
  "approved_by" TEXT,
  "published_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "knowledge_articles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "knowledge_chunks" (
  "id" TEXT NOT NULL,
  "article_id" TEXT NOT NULL,
  "chunk_index" INTEGER NOT NULL,
  "heading" TEXT,
  "chunk_text" TEXT NOT NULL,
  "keywords" JSONB,
  "embedding" JSONB,
  "token_count" INTEGER,
  "condition_tags" JSONB,
  "focus_area_tags" JSONB,
  "safety_tags" JSONB,
  "review_status" TEXT NOT NULL DEFAULT 'approved',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "knowledge_chunks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "assistant_policies" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "policy_type" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "applies_to_intent_tags" JSONB,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "assistant_policies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "child_context_snapshots" (
  "id" TEXT NOT NULL,
  "child_id" TEXT NOT NULL,
  "snapshot_type" TEXT NOT NULL DEFAULT 'assistant',
  "summary" TEXT NOT NULL,
  "strengths" JSONB,
  "risks" JSONB,
  "active_focus_areas" JSONB,
  "latest_patterns" JSONB,
  "latest_roadmap_targets" JSONB,
  "latest_insight_id" TEXT,
  "source_data_hash" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "generated_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "child_context_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "assistant_response_logs" (
  "id" TEXT NOT NULL,
  "guardian_id" TEXT NOT NULL,
  "child_id" TEXT,
  "conversation_id" TEXT,
  "question" TEXT NOT NULL,
  "intent" TEXT NOT NULL,
  "retrieved_child_snapshot_ids" JSONB,
  "retrieved_progress_entry_ids" JSONB,
  "retrieved_knowledge_chunk_ids" JSONB,
  "retrieved_policy_ids" JSONB,
  "prompt_version" TEXT,
  "model_name" TEXT,
  "request_payload" JSONB,
  "response_text" TEXT NOT NULL,
  "response_json" JSONB,
  "safety_outcome" TEXT,
  "fallback_used" BOOLEAN NOT NULL DEFAULT false,
  "latency_ms" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "assistant_response_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "knowledge_articles_slug_key" ON "knowledge_articles"("slug");
CREATE UNIQUE INDEX "knowledge_chunks_article_id_chunk_index_key" ON "knowledge_chunks"("article_id", "chunk_index");
CREATE UNIQUE INDEX "assistant_policies_name_key" ON "assistant_policies"("name");

CREATE INDEX "knowledge_articles_category_review_status_idx" ON "knowledge_articles"("category", "review_status");
CREATE INDEX "knowledge_articles_published_at_idx" ON "knowledge_articles"("published_at");
CREATE INDEX "knowledge_chunks_review_status_idx" ON "knowledge_chunks"("review_status");
CREATE INDEX "assistant_policies_policy_type_active_idx" ON "assistant_policies"("policy_type", "active");
CREATE INDEX "child_context_snapshots_child_id_snapshot_type_created_at_idx" ON "child_context_snapshots"("child_id", "snapshot_type", "created_at");
CREATE INDEX "child_context_snapshots_child_id_source_data_hash_idx" ON "child_context_snapshots"("child_id", "source_data_hash");
CREATE INDEX "assistant_response_logs_guardian_id_created_at_idx" ON "assistant_response_logs"("guardian_id", "created_at");
CREATE INDEX "assistant_response_logs_child_id_created_at_idx" ON "assistant_response_logs"("child_id", "created_at");
CREATE INDEX "assistant_response_logs_conversation_id_created_at_idx" ON "assistant_response_logs"("conversation_id", "created_at");
CREATE INDEX "assistant_response_logs_intent_created_at_idx" ON "assistant_response_logs"("intent", "created_at");

ALTER TABLE "knowledge_chunks"
ADD CONSTRAINT "knowledge_chunks_article_id_fkey"
FOREIGN KEY ("article_id") REFERENCES "knowledge_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "child_context_snapshots"
ADD CONSTRAINT "child_context_snapshots_child_id_fkey"
FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "assistant_response_logs"
ADD CONSTRAINT "assistant_response_logs_guardian_id_fkey"
FOREIGN KEY ("guardian_id") REFERENCES "guardians"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "assistant_response_logs"
ADD CONSTRAINT "assistant_response_logs_child_id_fkey"
FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "assistant_response_logs"
ADD CONSTRAINT "assistant_response_logs_conversation_id_fkey"
FOREIGN KEY ("conversation_id") REFERENCES "assistant_conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
