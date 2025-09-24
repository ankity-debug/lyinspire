-- Add performance indexes for inspirations table

-- Primary composite index for most common query pattern (archived + score ordering)
CREATE INDEX "inspirations_archived_score_idx" ON "inspirations" ("archived", "score" DESC);

-- Composite index for platform filtering with archived and score
CREATE INDEX "inspirations_platform_archived_score_idx" ON "inspirations" ("platform", "archived", "score" DESC);

-- Composite index for date range queries with archived and score
CREATE INDEX "inspirations_publishedAt_archived_score_idx" ON "inspirations" ("publishedAt", "archived", "score" DESC);

-- GIN index for tags array operations (hasSome, hasEvery)
CREATE INDEX "inspirations_tags_gin_idx" ON "inspirations" USING GIN ("tags");

-- Index for admin views ordered by creation time
CREATE INDEX "inspirations_createdAt_idx" ON "inspirations" ("createdAt" DESC);

-- Composite index for related inspirations queries (platform-based)
CREATE INDEX "inspirations_platform_score_idx" ON "inspirations" ("platform", "score" DESC);

-- Partial index for non-archived inspirations (most queries filter out archived)
CREATE INDEX "inspirations_active_score_idx" ON "inspirations" ("score" DESC) WHERE "archived" = false;

-- Text search optimization indexes
CREATE INDEX "inspirations_title_text_idx" ON "inspirations" USING GIN (to_tsvector('english', "title"));
CREATE INDEX "inspirations_description_text_idx" ON "inspirations" USING GIN (to_tsvector('english', "description"));

-- Composite index for author-based queries
CREATE INDEX "inspirations_authorName_archived_score_idx" ON "inspirations" ("authorName", "archived", "score" DESC);

-- Index for DailyCuration table optimization
CREATE INDEX "daily_curations_date_idx" ON "daily_curations" ("date" DESC);

-- Index for submissions admin views
CREATE INDEX "submissions_status_submittedAt_idx" ON "submissions" ("status", "submittedAt" DESC);
CREATE INDEX "submissions_submittedAt_idx" ON "submissions" ("submittedAt" DESC);