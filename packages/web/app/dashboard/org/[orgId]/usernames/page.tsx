import { Header } from "@/components/ui/header";
import { fetchUsernameMappings } from "@/lib/fetchers/organizations";
import { OrgViewPathParams, orgViewPathSchema } from "../types";
import { UsernamesTable } from "./table/UsernamesTable";

export default async function UsernamesPage({
  params,
}: {
  params: OrgViewPathParams;
}) {
  const { orgId } = orgViewPathSchema.parse(params);
  const usernames = await fetchUsernameMappings(orgId);

  return (
    <div>
      <Header>Usernames</Header>
      <UsernamesTable data={usernames} />
    </div>
  );
}
