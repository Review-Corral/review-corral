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

              {/* TODO: in the future the target should be found from a m2m table of Github <-> slack */}
              {/* Only show the Arrows if the slack data has loaded and there's at least one entry */}
              {/* {slackData != undefined &&
                slackData.length > 0 &&
                repo.isActive && (
                  <Xarrow
                    start={repo.id.toString()}
                    end="slack-channel"
                    showHead={false}
                    color={"#6366f1"}
                    strokeWidth={2}
                  />
                )} */}
            </div>
          );
        })}
      </div>
    </div>
  );
};
