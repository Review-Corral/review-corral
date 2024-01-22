import { Header } from "@/components/ui/header";
import {
  fetchOranizationMembers,
  fetchUsernameMappings,
} from "@/lib/fetchers/organizations";
import { OrgViewPathParams, orgViewPathSchema } from "../types";
import { UsernamesTable } from "./table/UsernamesTable";

export default async function UsernamesPage({
  params,
}: {
  params: OrgViewPathParams;
}) {
  const { orgId } = orgViewPathSchema.parse(params);
  const usernames = await fetchUsernameMappings(orgId);

  console.log({ usernames });

  const installationMembers = await fetchOranizationMembers(orgId);

  console.log({ installationMembers });

  return (
    <div>
      <Header classname="pb-8">Usernames</Header>
      <UsernamesTable data={usernames} />
    </div>
  );
}
