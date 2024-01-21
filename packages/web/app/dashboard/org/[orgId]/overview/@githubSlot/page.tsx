"use server";

import {
  fetchOrganization,
  fetchRepositories,
} from "@/lib/fetchers/organizations";
import { RepositoryCard } from "../../../../../../components/github/RepositoryCard";
import { OrgViewProps } from "../../shared";
import { OrgViewPathParams, orgViewPathSchema } from "../../types";

export default async function GithubOverviewSlot({
  params,
}: {
  params: OrgViewPathParams;
}) {
  const { orgId } = orgViewPathSchema.parse(params);
  const organization = await fetchOrganization(orgId);

  return <GithubCardData organization={organization} />;
}

interface GithubCardProps extends OrgViewProps {}

const GithubCardData = async ({ organization }: GithubCardProps) => {
  const repositories = await fetchRepositories(organization.id);

  return (
    <div>
      <div className="space-y-2">
        {repositories.map((repo) => {
          return (
            <div key={repo.id.toString()}>
              <div
                className="flex flex-row gap-4 items-center justify-between border border-gray-200 rounded-md p-4 bg-white"
                id={repo.id.toString()}
              >
                <div className="truncate">{repo.name}</div>
                <RepositoryCard
                  repoId={repo.id}
                  active={repo.isActive ?? false}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
