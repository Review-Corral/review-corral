import { Header } from "@/components/ui/header";
import {
  fetchOrganizationMembers,
  fetchUsernameMappings,
} from "@/lib/fetchers/organizations";
import { OrgViewPathParams, orgViewPathSchema } from "../types";
import {
  GithubAndOptionalPersistedUsername,
  UsernamesTable,
} from "./table/UsernamesTable";

export default async function UsernamesPage({
  params,
}: {
  params: OrgViewPathParams;
}) {
  const { orgId } = orgViewPathSchema.parse(params);
  const usernames = await fetchUsernameMappings(orgId);
  console.log({ usernames });

  const installationMembers = await fetchOrganizationMembers(orgId);
  console.log({ installationMembers });

  const mappedUsernames: GithubAndOptionalPersistedUsername[] =
    installationMembers.map((member) => ({
      ...member,
      mappedState: usernames.find(
        (username) => username.githubUsername === member.login
      ),
    }));

  return (
    <div>
      <Header classname="pb-8">Usernames</Header>
      <UsernamesTable data={mappedUsernames} />
    </div>
  );
}
