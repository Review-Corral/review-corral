ALTER TABLE "github_repositories" DROP CONSTRAINT "github_repositories_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "github_repositories" ALTER COLUMN "installation_id" SET DATA TYPE bigint;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "github_repositories" ADD CONSTRAINT "github_repositories_installation_id_organizations_id_fk" FOREIGN KEY ("installation_id") REFERENCES "organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "github_repositories" DROP COLUMN IF EXISTS "organization_id";