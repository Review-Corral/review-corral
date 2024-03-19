import { IssueCommentEvent } from "@octokit/webhooks-types";
import { Logger } from "../../../logging";
import { getInstallationAccessToken, getPullRequestInfo } from "../../fetchers";
import { GithubWebhookEventHander } from "../types";
import { getThreadTs } from "./shared";

const LOGGER = new Logger("core.github.webhooks.handlers.pullRequest");

export const handleIssueCommentEvent: GithubWebhookEventHander<
  IssueCommentEvent
> = async ({ event, ...props }) => {
  LOGGER.debug("Hanlding Issue comment event with action: ", event.action);

  if (event.action === "created") {
    LOGGER.debug("Issue comment created", { issue: event.issue });

    if (!event.installation?.id) {
      LOGGER.debug("No installation id found on event", { event });
      return;
    }

    if (event.issue.pull_request?.url) {
      const { pull_request } = event.issue;
      LOGGER.debug("Issue comment is on a pull request", {
        issue: event.issue,
      });

      const accessToken = await getInstallationAccessToken(
        event.installation.id
      );

      const { id: prId } = await getPullRequestInfo({
        url: event.issue.pull_request.url,
        accessToken: accessToken.token,
      });

      const threadTs = await getThreadTs({
        prId,
        repoId: event.repository.id,
      });

      if (!threadTs) {
        // write error log
        LOGGER.warn("Got a comment event but couldn't find the thread", {
          action: event.action,
          prId,
        });

        return;
      }
    } else {
      LOGGER.debug("Issue comment is NOT on a pull request");
    }
  } else {
    LOGGER.debug("Issue comment action not handled", { action: event.action });
  }
};
