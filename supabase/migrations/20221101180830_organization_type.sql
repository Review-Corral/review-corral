CREATE TYPE organization_type AS ENUM ('Organization', 'User');

ALTER TABLE "organizations" ADD COLUMN "organization_type" organization_type NOT NULL DEFAULT 'Organization';