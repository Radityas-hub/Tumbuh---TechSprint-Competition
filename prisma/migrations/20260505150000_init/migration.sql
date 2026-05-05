-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "FocusArea" AS ENUM ('COMMUNICATION', 'MOTORIC', 'BEHAVIOR', 'ACADEMIC');

-- CreateEnum
CREATE TYPE "ConsentScope" AS ENUM ('HEALTH_DATA', 'AI_INSIGHT', 'MEDIA_UPLOAD', 'DOCUMENT_ANALYSIS', 'LOCATION');

-- CreateEnum
CREATE TYPE "InputType" AS ENUM ('TEXT', 'PHOTO', 'AUDIO', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('PENDING_UPLOAD', 'UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "RoadmapStatus" AS ENUM ('ACHIEVED', 'IN_PROGRESS', 'NEXT_TARGET', 'NEEDS_ATTENTION', 'PAUSED');

-- CreateEnum
CREATE TYPE "InsightKind" AS ENUM ('WEEKLY', 'ENTRY', 'ROADMAP', 'ASSISTANT', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "guardians" (
    "id" TEXT NOT NULL,
    "auth_user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "guardians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "children" (
    "id" TEXT NOT NULL,
    "guardian_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birth_date" TIMESTAMP(3) NOT NULL,
    "condition" TEXT NOT NULL,
    "focus_areas" "FocusArea"[],
    "routine" TEXT,
    "support_need" TEXT,
    "onboarding_completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "children_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consents" (
    "id" TEXT NOT NULL,
    "child_id" TEXT NOT NULL,
    "scope" "ConsentScope" NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT false,
    "granted_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress_entries" (
    "id" TEXT NOT NULL,
    "child_id" TEXT NOT NULL,
    "area" "FocusArea" NOT NULL,
    "input_type" "InputType" NOT NULL DEFAULT 'TEXT',
    "title" TEXT,
    "note" TEXT,
    "insight" TEXT,
    "observed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "progress_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "child_id" TEXT NOT NULL,
    "progress_entry_id" TEXT,
    "type" "InputType" NOT NULL,
    "storage_bucket" TEXT,
    "storage_key" TEXT NOT NULL,
    "url" TEXT,
    "mime_type" TEXT,
    "size_bytes" INTEGER,
    "status" "MediaStatus" NOT NULL DEFAULT 'PENDING_UPLOAD',
    "processing_error" TEXT,
    "processed_output" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadmap_items" (
    "id" TEXT NOT NULL,
    "child_id" TEXT NOT NULL,
    "area" "FocusArea" NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "status" "RoadmapStatus" NOT NULL DEFAULT 'NEXT_TARGET',
    "evidence" JSONB,
    "confidence_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "achieved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roadmap_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insights" (
    "id" TEXT NOT NULL,
    "child_id" TEXT NOT NULL,
    "progress_entry_id" TEXT,
    "kind" "InsightKind" NOT NULL DEFAULT 'WEEKLY',
    "summary" TEXT NOT NULL,
    "alerts" JSONB,
    "recommendations" JSONB,
    "confidence_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "range_start" TIMESTAMP(3),
    "range_end" TIMESTAMP(3),
    "generated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "guardian_id" TEXT,
    "child_id" TEXT,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "read_time" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistant_conversations" (
    "id" TEXT NOT NULL,
    "guardian_id" TEXT NOT NULL,
    "child_id" TEXT,
    "title" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assistant_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistant_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assistant_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "providers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "opening_hours" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processing_jobs" (
    "id" TEXT NOT NULL,
    "media_asset_id" TEXT,
    "kind" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "payload" JSONB,
    "result" JSONB,
    "error" TEXT,
    "run_after" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processing_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guardians_auth_user_id_key" ON "guardians"("auth_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "guardians_email_key" ON "guardians"("email");

-- CreateIndex
CREATE INDEX "children_guardian_id_idx" ON "children"("guardian_id");

-- CreateIndex
CREATE INDEX "children_deleted_at_idx" ON "children"("deleted_at");

-- CreateIndex
CREATE INDEX "consents_child_id_granted_idx" ON "consents"("child_id", "granted");

-- CreateIndex
CREATE UNIQUE INDEX "consents_child_id_scope_key" ON "consents"("child_id", "scope");

-- CreateIndex
CREATE INDEX "progress_entries_child_id_observed_at_idx" ON "progress_entries"("child_id", "observed_at");

-- CreateIndex
CREATE INDEX "progress_entries_child_id_area_idx" ON "progress_entries"("child_id", "area");

-- CreateIndex
CREATE INDEX "progress_entries_child_id_input_type_idx" ON "progress_entries"("child_id", "input_type");

-- CreateIndex
CREATE INDEX "progress_entries_deleted_at_idx" ON "progress_entries"("deleted_at");

-- CreateIndex
CREATE INDEX "media_assets_child_id_status_idx" ON "media_assets"("child_id", "status");

-- CreateIndex
CREATE INDEX "media_assets_progress_entry_id_idx" ON "media_assets"("progress_entry_id");

-- CreateIndex
CREATE INDEX "roadmap_items_child_id_sort_order_idx" ON "roadmap_items"("child_id", "sort_order");

-- CreateIndex
CREATE INDEX "roadmap_items_child_id_status_idx" ON "roadmap_items"("child_id", "status");

-- CreateIndex
CREATE INDEX "insights_child_id_kind_created_at_idx" ON "insights"("child_id", "kind", "created_at");

-- CreateIndex
CREATE INDEX "insights_progress_entry_id_idx" ON "insights"("progress_entry_id");

-- CreateIndex
CREATE INDEX "audit_logs_guardian_id_created_at_idx" ON "audit_logs"("guardian_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_child_id_created_at_idx" ON "audit_logs"("child_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");

-- CreateIndex
CREATE INDEX "articles_category_published_idx" ON "articles"("category", "published");

-- CreateIndex
CREATE INDEX "assistant_conversations_guardian_id_updated_at_idx" ON "assistant_conversations"("guardian_id", "updated_at");

-- CreateIndex
CREATE INDEX "assistant_conversations_child_id_updated_at_idx" ON "assistant_conversations"("child_id", "updated_at");

-- CreateIndex
CREATE INDEX "assistant_messages_conversation_id_created_at_idx" ON "assistant_messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "providers_specialty_idx" ON "providers"("specialty");

-- CreateIndex
CREATE INDEX "processing_jobs_status_run_after_idx" ON "processing_jobs"("status", "run_after");

-- CreateIndex
CREATE INDEX "processing_jobs_media_asset_id_idx" ON "processing_jobs"("media_asset_id");

-- AddForeignKey
ALTER TABLE "children" ADD CONSTRAINT "children_guardian_id_fkey" FOREIGN KEY ("guardian_id") REFERENCES "guardians"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consents" ADD CONSTRAINT "consents_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_entries" ADD CONSTRAINT "progress_entries_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_progress_entry_id_fkey" FOREIGN KEY ("progress_entry_id") REFERENCES "progress_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_items" ADD CONSTRAINT "roadmap_items_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insights" ADD CONSTRAINT "insights_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insights" ADD CONSTRAINT "insights_progress_entry_id_fkey" FOREIGN KEY ("progress_entry_id") REFERENCES "progress_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_guardian_id_fkey" FOREIGN KEY ("guardian_id") REFERENCES "guardians"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_conversations" ADD CONSTRAINT "assistant_conversations_guardian_id_fkey" FOREIGN KEY ("guardian_id") REFERENCES "guardians"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_conversations" ADD CONSTRAINT "assistant_conversations_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_messages" ADD CONSTRAINT "assistant_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "assistant_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processing_jobs" ADD CONSTRAINT "processing_jobs_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
