ALTER TABLE pull_requests
ADD CONSTRAINT unique_pr_id UNIQUE (pr_id);