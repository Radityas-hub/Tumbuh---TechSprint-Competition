ALTER TABLE "insights"
ADD COLUMN "source_data_hash" TEXT,
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'READY',
ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "model_name" TEXT,
ADD COLUMN "prompt_version" TEXT,
ADD COLUMN "raw_input" JSONB,
ADD COLUMN "raw_output" JSONB,
ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "stale_at" TIMESTAMP(3),
ADD COLUMN "generated_at" TIMESTAMP(3);

CREATE INDEX "insights_child_id_is_active_created_at_idx"
ON "insights"("child_id", "is_active", "created_at");

CREATE INDEX "insights_child_id_source_data_hash_idx"
ON "insights"("child_id", "source_data_hash");
