import { IssueCommentEvent } from "@octokit/webhooks-types";
import { Logger } from "../../../logging";
import {
  getInstallationAccessToken,
  getPullRequestInfo,
} from "@domain/github/fetchers";
import { GithubWebhookEventHander } from "../types";
import { getSlackUserName, getThreadTs } from "./shared";

const LOGGER = new Logger("core.github.webhooks.handlers.pullRequest");

export const handleIssueCommentEvent: GithubWebhookEventHander<
  IssueCommentEvent
> = async ({ event, slackClient, ...props }) => {
  LOGGER.debug("Hanlding Issue comment event with action: ", event.action);

  if (event.comment.user.type === "Bot") {
    LOGGER.debug("Issue comment is from a bot--skipping");
    return;
  }

  if (!event.issue.pull_request?.url) {
    LOGGER.debug("Issue comment is NOT on a pull request");
    return;
  }

  if (event.action === "created") {
    LOGGER.debug("Issue comment created", { issue: event.issue });

    LOGGER.debug("Issue comment is on a pull request", {
      issue: event.issue,
    });

    const accessToken = await getInstallationAccessToken(props.installationId);

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

    await slackClient.postComment({
      prId,
      commentBody: event.comment.body,
      commentUrl: undefined,
      threadTs: threadTs,
      slackUsername: await getSlackUserName(event.sender.login, props),
    });
    return;
  } else {
    LOGGER.debug("Issue comment action not handled", { action: event.action });
  }
};
