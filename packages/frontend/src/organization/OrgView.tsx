import { Organization } from "@core/db/types";
import { FC, useEffect, useState } from "react";
import { redirect, useLoaderData, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "src/layouts/DashboardLayout";
import { useOrganizations } from "src/org/useOrganizations";
import * as z from "zod";
import OrgTabbedViewHandler from "./OrgTabbedViewHandler";

interface OrgViewProps {}

const PageSchema = z.enum(["github", "slack", "usernames", "overview"]);

export type Page = z.infer<typeof PageSchema>;

const orgViewParamsSchema = z.object({
  orgId: z.string(),
});

const orgViewSearchParamsSchema = z
  .object({
    page: PageSchema.optional().default("overview"),
  })
  .optional()
  .default({ page: "overview" });

export const OrgView: FC<OrgViewProps> = () => {
  const loaderData = useLoaderData();
  console.log(loaderData);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [searchParams, _] = useSearchParams();

  const { page } = orgViewSearchParamsSchema.parse(searchParams);

  const { orgId } = orgViewParamsSchema.parse(loaderData);

  const { data, isLoading } = useOrganizations();

  const [organization, setOrganization] = useState<Organization | undefined>(
    undefined
  );

  // Gets the correct organization from the list of organizations fetched from
  // the database
  useEffect(() => {
    if (data) {
      const org = data.find((org) => org.id === Number(orgId));
      if (org) {
        setOrganization(org);
        return;
      } else {
        // TODO: I think rendering a 404 would be better
        redirect("/404");
      }
    }
    setOrganization(undefined);
  }, [data]);

  return (
    <DashboardLayout title="Organization">
      {isLoading && <div>Loading...</div>}
      {organization && (
        <OrgTabbedViewHandler
          organization={organization}
          page={page}
        ></OrgTabbedViewHandler>
      )}
    </DashboardLayout>
  );
};
