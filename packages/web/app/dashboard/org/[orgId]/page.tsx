import { Header } from "@/components/ui/header";
import { useOrganization } from "@/lib/fetchers/organizations";
import { OrgViewPage, orgViewPathSchema } from "./types";

const orgViewPage: OrgViewPage = async function OrgView({ params }) {
  const { orgId } = orgViewPathSchema.parse(params);

  const organization = await useOrganization(orgId);

  return (
    <>
      <Header></Header>
      <div>This is the org view for {organization.accountName} </div>
    </>
  );
};

export default orgViewPage;
