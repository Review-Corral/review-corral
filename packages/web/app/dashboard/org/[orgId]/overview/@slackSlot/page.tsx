"use server";

import { SlackOverviewCard } from "@/components/slack/SlackOverviewCard";
import { fetchOrganization } from "@/lib/fetchers/organizations";
import { OrgViewPathParams, orgViewPathSchema } from "../../types";

export default async function SlackOverviewSlot({
  params,
}: {
  params: OrgViewPathParams;
}) {
  const { orgId } = orgViewPathSchema.parse(params);
  const organization = await fetchOrganization(orgId);

  return <SlackOverviewCard organization={organization} />;
}
