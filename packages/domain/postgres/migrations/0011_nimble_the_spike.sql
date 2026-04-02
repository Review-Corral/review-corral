ALTER TABLE "pull_requests" ADD COLUMN "reviewer_statuses" jsonb DEFAULT '[]'::jsonb NOT NULL;
