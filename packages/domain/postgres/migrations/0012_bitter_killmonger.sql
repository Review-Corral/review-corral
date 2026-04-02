ALTER TABLE "pull_requests" ADD COLUMN IF NOT EXISTS "reviewer_statuses" jsonb DEFAULT '[]'::jsonb NOT NULL;
