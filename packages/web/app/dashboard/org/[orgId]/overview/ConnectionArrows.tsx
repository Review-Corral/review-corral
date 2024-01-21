"use client";

import { slackIntegration } from "@core/db/schema";
import { Repository, SlackIntegration } from "@core/db/types";
import { FC } from "react";
import Xarrow from "react-xarrows";

interface ConnectionArrowsProps {
  slackIntegrations: SlackIntegration | null;
  repositories: Repository[];
}

export const ConnectionArrows: FC<ConnectionArrowsProps> = ({
  slackIntegrations,
  repositories,
}) => {
  if (!slackIntegration) {
    return null;
  }

  return (
    <>
      {/* TODO: in the future the target should be found from a m2m table of Github <-> slack */}
      {/* Only show the Arrows if the slack data has loaded and there's at least one entry */}
      {repositories
        .filter((repo) => repo.isActive)
        .map((repo) => (
          <Xarrow
            key={repo.id.toString()}
            start={repo.id.toString()}
            end="slack-channel"
            showHead={false}
            color={"#6366f1"}
            strokeWidth={2}
          />
        ))}
    </>
  );
};
