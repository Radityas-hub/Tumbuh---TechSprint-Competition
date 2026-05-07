ALTER TABLE "roadmap_items"
ADD COLUMN "last_personalized_at" TIMESTAMP(3),
ADD COLUMN "personalization_source" TEXT,
ADD COLUMN "source_insight_id" TEXT,
ADD COLUMN "personalization_reason" TEXT;
