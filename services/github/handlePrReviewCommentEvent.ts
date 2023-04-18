import {
  PullRequestReviewCommentEvent,
  PullRequestReviewEvent,
} from "@octokit/webhooks-types";
import { BaseGithubHanderProps, getSlackUserName, getThreadTs } from "./shared";

export const handlePullRequestCommentEvent = async (
  payload: PullRequestReviewCommentEvent | PullRequestReviewEvent,
  props: BaseGithubHanderProps,
) => {
  if (payload.action === "created" && payload.comment.user.type === "User") {
    const threadTs = await getThreadTs(payload.pull_request.id, props.database);

    if (!threadTs) {
      // write error log
      console.warn("Got a comment event but couldn't find the thread", {
        action: payload.action,
        prId: payload.pull_request.id,
      });

      return;
    }

    await props.slackClient.postComment({
      prId: payload.pull_request.id,
      commentBody: payload.comment.body,
      commentUrl: payload.comment.html_url,
      threadTs: threadTs,
      slackUsername: await getSlackUserName(payload.sender.login, props),
    });
    return;
  }
};
