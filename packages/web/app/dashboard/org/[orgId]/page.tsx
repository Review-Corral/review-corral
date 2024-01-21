import { fetchOrganization } from "@/lib/fetchers/organizations";
import { redirect } from "next/navigation";
import { OrgViewPathParams, orgViewPathSchema } from "./types";

export default async function OrgViewPage({
  params,
}: {
  params: OrgViewPathParams;
}) {
  const { orgId } = orgViewPathSchema.parse(params);
  const organization = await fetchOrganization(orgId);

  return redirect(`/dashboard/org/${organization.id}/overview`);
}
