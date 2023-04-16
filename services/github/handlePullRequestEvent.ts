import { EmitterWebhookEvent } from "@octokit/webhooks";
import {
  PullRequestOpenedEvent,
  PullRequestReadyForReviewEvent,
} from "@octokit/webhooks-types";
import axios from "axios";
import { getInstallationAccessToken } from "services/utils/apiUtils";
import { InstallationAccessResponse } from "types/github-api-types";
import { BaseGithubHanderProps, getSlackUserName } from "./shared";

type PrEventType = EmitterWebhookEvent<"pull_request">;

export type PullRequestEventOpenedOrReadyForReview =
  | PullRequestOpenedEvent
  | PullRequestReadyForReviewEvent;

export const handlePullRequestEvent = async (
  { payload }: PrEventType,
  props: BaseGithubHanderProps,
) => {
  if (payload.action === "opened" || payload.action === "ready_for_review") {
    handleNewPr(payload, props);
  }
};

const handleNewPr = async (
  payload: PullRequestEventOpenedOrReadyForReview,
  props: BaseGithubHanderProps,
) => {
  // If the PR is opened or ready for review but in draft, save the PR in the database
  // but don't post it
  if (payload.pull_request.draft) {
    props.database.insertPullRequest({
      prId: payload.pull_request.id.toString(),
      isDraft: true,
      threadTs: null,
      organizationId: props.organizationId,
    });
  } else {
    const { threadTs, wasCreated } = await getThreadTsForNewPr(payload, props);
    if (threadTs) {
      if (wasCreated) {
        postAllCommentsForNewPrThread(threadTs, payload, props);
      } else {
        // This then means that it was posted before and we just need to post
        // that it's now ready for review
        props.slackClient.postReadyForReview({
          prId: payload.pull_request.id,
          threadTs,
        });
      }
    } else {
      console.error(
        "Error posting new thread for PR opened message to Slack: " +
          "Didn't get message response back to thread messages PR ID: ",
        { prId: payload.pull_request.id },
      );
    }
  }

  async function postAllCommentsForNewPrThread(
    threadTs: string,
    body: PullRequestEventOpenedOrReadyForReview,
    baseProps: BaseGithubHanderProps,
  ) {
    const accessToken = await getInstallationAccessToken(
      baseProps.installationId,
    );

    await postCommentsForNewPR(body, accessToken, threadTs, baseProps);
    // Get all requested Reviews and post
    if (body.pull_request.requested_reviewers) {
      body.pull_request.requested_reviewers.map(async (requested_reviewer) => {
        // The requested reviewer could be a 'Team' and not a 'User'
        if ("login" in requested_reviewer) {
          await baseProps.slackClient.postMessage({
            message: {
              text: `Review request for ${await getSlackUserName(
                requested_reviewer.login,
                baseProps,
              )}`,
            },
            threadTs: threadTs,
          });
        }
      });
    }
  }

  async function getThreadTsForNewPr(
    body: PullRequestEventOpenedOrReadyForReview,
    baseProps: BaseGithubHanderProps,
  ): Promise<{
    threadTs?: string;
    wasCreated: boolean;
  }> {
    // If the PR was opened
    if (body.action === "opened") {
      return {
        threadTs: await createNewThread(body, baseProps),
        wasCreated: true,
      };
    } else {
      // This should trigger for 'ready_for_review' events
      const existingThreadTs = (
        await baseProps.database.getThreadTs({
          prId: body.pull_request.id.toString(),
        })
      ).data?.thread_ts;

      // If we still couldn't find a thread, then post a new one.
      if (!existingThreadTs) {
        return {
          threadTs: await createNewThread(body, baseProps),
          wasCreated: true,
        };
      } else {
        return {
          threadTs: existingThreadTs,
          wasCreated: false,
        };
      }
    }
  }

  async function createNewThread(
    body: PullRequestEventOpenedOrReadyForReview,
    baseProps: BaseGithubHanderProps,
  ): Promise<string> {
    const response = await baseProps.slackClient.postPrReady(
      body,
      await getSlackUserName(body.sender.login, baseProps),
    );

    if (response && response.ts) {
      baseProps.database.insertPullRequest({
        prId: body.pull_request.id.toString(),
        isDraft: false,
        threadTs: response.ts,
        organizationId: baseProps.organizationId,
      });

      return response.ts;
    } else {
      throw new Error(
        `Tried to create new thread for PR Id ${body.pull_request.id.toString()} but didn't get a response ts: ` +
          `\nReceieved Response: ${JSON.stringify(response)}`,
      );
    }
  }

  async function postCommentsForNewPR(
    body: PullRequestEventOpenedOrReadyForReview,
    accessToken: InstallationAccessResponse,
    threadTs: string,
    baseProps: BaseGithubHanderProps,
  ) {
    try {
      const response = await axios.get(body.pull_request.comments_url, {
        headers: {
          Authorization: `bearer ${accessToken.token}`,
        },
      });

      for (const comment of response.data) {
        if (comment.user.type === "User") {
          baseProps.slackClient.postComment({
            prId: body.pull_request.id,
            commentBody: comment.body,
            commentUrl: comment.url,
            threadTs: threadTs,
            slackUsername: await getSlackUserName(
              comment.user.login,
              baseProps,
            ),
          });
        }
      }
    } catch (error) {
      console.error("Error getting comments: ", error);
    }
  }
};
