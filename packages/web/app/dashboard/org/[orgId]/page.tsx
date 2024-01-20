import { Header } from "@/components/ui/header";
import { fetchOrganization } from "@/lib/fetchers/organizations";
import { OrgViewPathParams, orgViewPathSchema } from "./types";

export default async function OrgViewPage({
  params,
}: {
  params: OrgViewPathParams;
}) {
  const { orgId } = orgViewPathSchema.parse(params);

  const organization = await fetchOrganization(orgId);

  return (
    <>
      <Header></Header>
      <div>This is the org view for {organization.accountName} </div>
    </>
  );
}
