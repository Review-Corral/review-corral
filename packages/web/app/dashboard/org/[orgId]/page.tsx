import { Header } from "@/components/ui/header";
import { useOrganization } from "@/lib/fetchers/organizations";
import { useUser } from "../../userActions";
import { OrgViewPage, orgViewPathSchema } from "./types";

const orgViewPage: OrgViewPage = async function OrgView({ params }) {
  const { orgId } = orgViewPathSchema.parse(params);

  const user = await useUser();
  const organization = await useOrganization(orgId, user);

  return (
    <>
      <Header></Header>
      <div>This is the org view for {organization.accountName} </div>
    </>
  );
};

export default orgViewPage;
