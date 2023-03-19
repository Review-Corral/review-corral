ALTER TABLE "public"."pull_requests" ADD COLUMN "draft" boolean NOT NULL DEFAULT false;

-- Make thread_ts nullable since we won't post the initial draft state to Slack
ALTER TABLE "public"."pull_requests" ALTER COLUMN "thread_ts" DROP NOT NULL;