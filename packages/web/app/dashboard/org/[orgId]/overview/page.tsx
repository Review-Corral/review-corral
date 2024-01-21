"use server";

import {
  fetchOrganization,
  fetchRepositories,
  fetchSlackIntegrations,
} from "@/lib/fetchers/organizations";
import { OrgViewPathParams, orgViewPathSchema } from "../types";
import { ConnectionArrows } from "./ConnectionArrows";

export default async function OverviewPage({
  params,
}: {
  params: OrgViewPathParams;
}) {
  const { orgId } = orgViewPathSchema.parse(params);
  const organization = await fetchOrganization(orgId);

  const repositories = await fetchRepositories(organization.id);
  const slackIntegrations = await fetchSlackIntegrations(organization.id);

  return (
    <ConnectionArrows
      slackIntegrations={
        slackIntegrations.length > 0 ? slackIntegrations[0] : null
      }
      repositories={repositories}
    />
  );
}
