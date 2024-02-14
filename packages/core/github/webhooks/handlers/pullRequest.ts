import {
  PullRequestConvertedToDraftEvent,
  PullRequestEvent,
} from "@octokit/webhooks-types";
import ky from "ky";
import {
  fetchPullRequestById,
  insertPullRequest,
  updatePullRequest,
} from "../../../db/fetchers/pullRequests";
import { PullRequest } from "../../../dynamodb/entities/types";
import { Logger } from "../../../logging";
import { PullRequestEventOpenedOrReadyForReview } from "../../../slack/SlackClient";
import { PullRequestReviewCommentsResponse } from "../../endpointTypes";
import { getInstallationAccessToken } from "../../fetchers";
import {
  BaseGithubWebhookEventHanderArgs,
  GithubWebhookEventHander,
} from "../types";
import { getSlackUserName, getThreadTs } from "./shared";

const LOGGER = new Logger("core.github.webhooks.handlers.pullRequest");

export const handlePullRequestEvent: GithubWebhookEventHander<
  PullRequestEvent
> = async ({ event, ...props }) => {
  const payload = event;

  LOGGER.debug("Hanlding PR event with action: ", event.action);
  if (event.action === "opened" || payload.action === "ready_for_review") {
    return await handleNewPr(
      // TODO: can we avoid this dangerous cast?
      payload as PullRequestEventOpenedOrReadyForReview,
      props
    );
  } else {
    const threadTs = await getThreadTs(payload.pull_request.id);

    if (!threadTs) {
      // No thread found, so log and return
      LOGGER.debug(`Got non-created event and didn't find a threadTS`, {
        action: payload.action,
        prId: payload.pull_request.id,
      });
      return;
    }

    switch (payload.action) {
      case "converted_to_draft":
        return await handleConvertedToDraft(threadTs, payload, props);
      case "closed":
        if (payload.pull_request.merged) {
          await props.slackClient.postPrMerged(
            payload,
            threadTs,
            await getSlackUserName(payload.sender.login, props)
          );
          return;
        } else {
          await props.slackClient.postPrClosed(
            payload,
            threadTs,
            await getSlackUserName(payload.sender.login, props)
          );
          return;
        }
      case "review_requested":
        if ("requested_reviewer" in payload) {
          await props.slackClient.postMessage({
            message: {
              text: `Review request for ${await getSlackUserName(
                payload.requested_reviewer.login,
                props
              )}`,
            },
            threadTs: threadTs,
          });
        }
        return;
      default:
        LOGGER.debug(`Got unhandled pull_request event`, {
          action: payload.action,
          prId: payload.pull_request.id,
        });
    }
  }
};

const handleConvertedToDraft = async (
  threadTs: string,
  event: PullRequestConvertedToDraftEvent,
  props: BaseGithubWebhookEventHanderArgs
) => {
  await props.slackClient.postConvertedToDraft(
    event,
    threadTs,
    await getSlackUserName(event.sender.login, props)
  );
};

const handleNewPr = async (
  payload: PullRequestEventOpenedOrReadyForReview,
  props: BaseGithubWebhookEventHanderArgs
) => {
  LOGGER.debug("Handling new PR");
  // If the PR is opened or ready for review but in draft, save the PR in the database
  // but don't post it
  if (payload.pull_request.draft) {
    LOGGER.debug("Handling draft PR");
    await insertPullRequest({
      prId: payload.pull_request.id,
      isDraft: true,
      threadTs: undefined,
      repoId: payload.repository.id,
    });
  } else {
    const { threadTs, wasCreated } = await getThreadTsForNewPr(payload, props);

    LOGGER.debug("Pull request is not draft", {
      threadTs,
      wasCreated,
      prId: payload.pull_request.id,
    });

    if (threadTs) {
      if (wasCreated) {
        await postAllCommentsForNewPrThread(threadTs, payload, props);
      } else {
        // This then means that it was posted before and we just need to post
        // that it's now ready for review
        await props.slackClient.postReadyForReview({
          body: payload,
          threadTs,
          slackUsername: await getSlackUserName(
            payload.pull_request.user.login,
            props
          ),
        });
      }
    } else {
      LOGGER.error(
        "Error posting new thread for PR opened message to Slack: " +
          "Didn't get message response back to thread messages PR ID: ",
        { prId: payload.pull_request.id }
      );
    }
  }

  async function postAllCommentsForNewPrThread(
    threadTs: string,
    body: PullRequestEventOpenedOrReadyForReview,
    baseProps: BaseGithubWebhookEventHanderArgs
  ) {
    const accessToken = await getInstallationAccessToken(
      baseProps.installationId
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
                baseProps
              )}`,
            },
            threadTs: threadTs,
          });
        }
      });
    }
  }

  /**
   * Only to be used for 'new' PRs where it will try and find the threadTs
   * in the database if one exists (this will happen if it started out as a draft), or
   * create a new one if it doesn't exist.
   */
  async function getThreadTsForNewPr(
    body: PullRequestEventOpenedOrReadyForReview,
    baseProps: BaseGithubWebhookEventHanderArgs
  ): Promise<{
    threadTs?: string;
    wasCreated: boolean;
  }> {
    // If the PR was opened
    if (body.action === "opened") {
      LOGGER.debug("PR was opened, creating new thread...");
      return {
        threadTs: await createNewThread({
          existingPullRequest: undefined,
          body,
          baseProps,
        }),
        wasCreated: true,
      };
    } else {
      LOGGER.debug("PR was not opened, trying to find existing thread...");
      // This should trigger for 'ready_for_review' events
      const existingPullRequest = await fetchPullRequestById({
        pullRequestId: body.pull_request.id,
        repoId: body.pull_request.id,
      });

      // If we still couldn't find a thread, then post a new one.
      if (!existingPullRequest?.threadTs) {
        LOGGER.debug("Couldn't find existing thread, creating new thread...");
        return {
          threadTs: await createNewThread({
            existingPullRequest,
            body,
            baseProps,
          }),
          wasCreated: true,
        };
      } else {
        LOGGER.debug("Found existing thread");
        return {
          threadTs: existingPullRequest.threadTs,
          wasCreated: false,
        };
      }
    }
  }

  async function createNewThread({
    existingPullRequest,
    body,
    baseProps,
  }: {
    existingPullRequest: PullRequest | undefined;
    body: PullRequestEventOpenedOrReadyForReview;
    baseProps: BaseGithubWebhookEventHanderArgs;
  }): Promise<string> {
    try {
      const response = await baseProps.slackClient.postPrReady(
        body,
        await getSlackUserName(body.sender.login, baseProps)
      );

      if (response && response.ts) {
        LOGGER.debug(
          "Succesfully created new threadTs. About to update database",
          {
            prId: body.pull_request.id,
            organizationId: baseProps.organizationId,
            existingPrId: existingPullRequest?.prId,
            threadTs: response.ts,
          }
        );
        if (existingPullRequest) {
          LOGGER.debug(
            `Updating existing PR record of id ${existingPullRequest.prId}}`
          );
          await updatePullRequest({
            pullRequestId: existingPullRequest.prId,
            repoId: body.repository.id,
            isDraft: body.pull_request.draft,
            threadTs: response.ts,
          });
        } else {
          LOGGER.debug(`Creating new PR record`);
          await insertPullRequest({
            prId: body.pull_request.id,
            repoId: body.repository.id,
            isDraft: body.pull_request.draft,
            threadTs: response.ts,
          });
        }

        return response.ts;
      } else {
        throw new Error(
          `Tried to create new thread for PR Id ${body.pull_request.id.toString()} but didn't get a response ts: ` +
            `\nReceieved Response: ${JSON.stringify(response)}`
        );
      }
    } catch (error) {
      throw new Error("Error creating new thread for PR: " + error);
    }
  }

  async function postCommentsForNewPR(
    body: PullRequestEventOpenedOrReadyForReview,
    accessToken: Awaited<ReturnType<typeof getInstallationAccessToken>>,
    threadTs: string,
    baseProps: BaseGithubWebhookEventHanderArgs
  ) {
    try {
      const response = await ky
        .get(body.pull_request.comments_url, {
          headers: {
            Authorization: `bearer ${accessToken.token}`,
          },
        })
        .json<PullRequestReviewCommentsResponse>();

      for (const comment of response) {
        if (comment.user.type === "User") {
          await baseProps.slackClient.postComment({
            prId: body.pull_request.id,
            commentBody: comment.body,
            commentUrl: comment.url,
            threadTs: threadTs,
            slackUsername: await getSlackUserName(
              comment.user.login,
              baseProps
            ),
          });
        }
      }
    } catch (error) {
      LOGGER.error("Error getting comments", {
        error,
        prId: body.pull_request.id,
        installationId: baseProps.installationId,
        organizationId: baseProps.organizationId,
      });
    }
  }
};
