DROP TABLE "github_integration";--> statement-breakpoint
ALTER TABLE "github_repositories" RENAME TO "repositories";--> statement-breakpoint
ALTER TABLE "repositories" RENAME COLUMN "repository_name" TO "name";--> statement-breakpoint
ALTER TABLE "repositories" DROP CONSTRAINT "github_repositories_installation_id_organizations_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "repositories" ADD CONSTRAINT "repositories_installation_id_organizations_installation_id_fk" FOREIGN KEY ("installation_id") REFERENCES "organizations"("installation_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
