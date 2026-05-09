-- AlterTable
ALTER TABLE "child_context_snapshots" ADD COLUMN     "data_completeness" JSONB,
ADD COLUMN     "last_progress_at" TIMESTAMP(3),
ADD COLUMN     "progress_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "progress_window_days" INTEGER NOT NULL DEFAULT 14,
ADD COLUMN     "roadmap_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "knowledge_articles" ADD COLUMN     "last_reviewed_at" TIMESTAMP(3),
ADD COLUMN     "review_notes" TEXT,
ADD COLUMN     "reviewed_by" TEXT;

-- AlterTable
ALTER TABLE "knowledge_chunks" ADD COLUMN     "last_reviewed_at" TIMESTAMP(3),
ADD COLUMN     "review_notes" TEXT,
ADD COLUMN     "reviewed_by" TEXT;

-- CreateTable
CREATE TABLE "assistant_evaluations" (
    "id" TEXT NOT NULL,
    "response_log_id" TEXT NOT NULL,
    "guardian_id" TEXT NOT NULL,
    "child_id" TEXT,
    "evaluation_version" TEXT NOT NULL,
    "relevance_score" INTEGER NOT NULL,
    "safety_score" INTEGER NOT NULL,
    "faithfulness_score" INTEGER NOT NULL,
    "actionability_score" INTEGER NOT NULL,
    "overall_score" INTEGER NOT NULL,
    "issues" JSONB,
    "summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assistant_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assistant_evaluations_response_log_id_created_at_idx" ON "assistant_evaluations"("response_log_id", "created_at");

-- CreateIndex
CREATE INDEX "assistant_evaluations_guardian_id_created_at_idx" ON "assistant_evaluations"("guardian_id", "created_at");

-- CreateIndex
CREATE INDEX "assistant_evaluations_child_id_created_at_idx" ON "assistant_evaluations"("child_id", "created_at");

-- CreateIndex
CREATE INDEX "assistant_evaluations_overall_score_created_at_idx" ON "assistant_evaluations"("overall_score", "created_at");

-- AddForeignKey
ALTER TABLE "assistant_evaluations" ADD CONSTRAINT "assistant_evaluations_response_log_id_fkey" FOREIGN KEY ("response_log_id") REFERENCES "assistant_response_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_evaluations" ADD CONSTRAINT "assistant_evaluations_guardian_id_fkey" FOREIGN KEY ("guardian_id") REFERENCES "guardians"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_evaluations" ADD CONSTRAINT "assistant_evaluations_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE SET NULL ON UPDATE CASCADE;
