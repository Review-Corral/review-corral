import { postCommentsForNewPR } from "@domain/selectors/pullRequests/getCommentsForPr";
import { tryGetPrRequiredApprovalsCount } from "@domain/selectors/pullRequests/getRequiredApprovals";
import {
  PullRequestConvertedToDraftEvent,
  PullRequestEditedEvent,
  PullRequestEvent,
} from "@octokit/webhooks-types";
import { Logger } from "../../../logging";
import {
  fetchPrItem,
  insertPullRequest,
  updatePullRequest,
} from "../../../postgres/fetchers/pull-requests";
import { type PullRequest } from "../../../postgres/schema";
import { PullRequestEventOpenedOrReadyForReview } from "../../../slack/SlackClient";
import { getInstallationAccessToken } from "../../fetchers";
import { BaseGithubWebhookEventHanderArgs, GithubWebhookEventHander } from "../types";
import { getSlackUserId, getSlackUserName } from "./shared";
import { convertPrEventToBaseProps } from "./utils";

export const LOGGER = new Logger("core.github.webhooks.handlers.pullRequest");

export const handlePullRequestEvent: GithubWebhookEventHander<
  PullRequestEvent
> = async ({ event: payload, ...props }) => {
  LOGGER.debug("Hanlding PR event with action: ", payload.action);

  const pullRequestItem = await fetchPrItem({
    pullRequestId: payload.pull_request.id,
    repoId: payload.repository.id,
  });

  if (payload.action === "opened" || payload.action === "ready_for_review") {
    return await handleNewPr(payload, props, pullRequestItem);
  } else {
    if (!pullRequestItem?.threadTs) {
      // No thread found, so log and return
      LOGGER.debug(`Got non-created event and didn't find a threadTS`, {
        action: payload.action,
        prId: payload.pull_request.id,
      });
      return;
    }

    switch (payload.action) {
      case "converted_to_draft":
        return await handleConvertedToDraft(
          pullRequestItem.threadTs,
          payload,
          props,
          pullRequestItem,
        );
      case "closed":
        if (payload.pull_request.merged) {
          // Clear queue status when PR is merged
          await updatePullRequest({
            pullRequestId: pullRequestItem.id,
            repoId: pullRequestItem.repoId,
            isQueuedToMerge: false,
          });

          await props.slackClient.postPrMerged(
            {
              body: payload,
              threadTs: pullRequestItem.threadTs,
              slackUsername: await getSlackUserName(
                payload.pull_request.user.login,
                props,
              ),
              pullRequestItem: { ...pullRequestItem, isQueuedToMerge: false },
              // Default to getting this from the PR item
              requiredApprovals: null,
            },
            await getSlackUserName(payload.sender.login, props),
          );

          // Send DM to PR author
          const authorSlackId = await getSlackUserId(
            payload.pull_request.user.login,
            props,
          );
          if (authorSlackId) {
            await props.slackClient.postDirectMessage({
              slackUserId: authorSlackId,
              message: {
                text: `✅ Your PR was merged: <${payload.pull_request.html_url}|${payload.repository.full_name}#${payload.pull_request.number}: ${payload.pull_request.title}>`,
              },
            });
          }
          return;
        } else {
          await props.slackClient.postPrClosed(
            {
              body: payload,
              threadTs: pullRequestItem.threadTs,
              slackUsername: await getSlackUserName(
                payload.pull_request.user.login,
                props,
              ),
              pullRequestItem,
              // Default to getting this from the PR item
              requiredApprovals: null,
            },
            await getSlackUserName(payload.sender.login, props),
          );

          // Send DM to PR author
          const authorSlackId = await getSlackUserId(
            payload.pull_request.user.login,
            props,
          );
          if (authorSlackId) {
            await props.slackClient.postDirectMessage({
              slackUserId: authorSlackId,
              message: {
                text: `❌ Your PR was closed: <${payload.pull_request.html_url}|${payload.repository.full_name}#${payload.pull_request.number}: ${payload.pull_request.title}>`,
              },
            });
          }
          return;
        }
      case "review_requested":
        if ("requested_reviewer" in payload) {
          const reviewerSlackId = await getSlackUserId(
            payload.requested_reviewer.login,
            props,
          );
          if (reviewerSlackId) {
            await props.slackClient.postDirectMessage({
              slackUserId: reviewerSlackId,
              message: {
                text: `🔍 You've been requested to review: <${payload.pull_request.html_url}|${payload.repository.full_name}#${payload.pull_request.number}: ${payload.pull_request.title}>`,
              },
            });
          }
        }
        return;
      case "review_request_removed":
        if ("requested_reviewer" in payload) {
          await props.slackClient.postMessage({
            message: {
              text: `Review request for ${await getSlackUserName(
                payload.requested_reviewer.login,
                props,
              )} removed`,
            },
            threadTs: pullRequestItem.threadTs,
          });
        }
        return;
      case "edited":
        return await handleEdited(
          pullRequestItem.threadTs,
          payload,
          props,
          pullRequestItem,
        );
      case "enqueued":
        return await handleQueueStatusChange(
          pullRequestItem.threadTs,
          payload,
          props,
          pullRequestItem,
          true,
        );
      case "dequeued":
        return await handleQueueStatusChange(
          pullRequestItem.threadTs,
          payload,
          props,
          pullRequestItem,
          false,
        );
      default:
        LOGGER.debug("Got unhandled pull_request event", {
          action: payload.action,
          prId: payload.pull_request.id,
        });
    }
  }
};

const handleConvertedToDraft = async (
  threadTs: string,
  event: PullRequestConvertedToDraftEvent,
  props: BaseGithubWebhookEventHanderArgs,
  pullRequestItem: PullRequest,
) => {
  await props.slackClient.postConvertedToDraft({
    body: event,
    threadTs,
    slackUsername: await getSlackUserName(event.sender.login, props),
    pullRequestItem,
    // Default to getting this from the PR item
    requiredApprovals: null,
  });
};

const handleEdited = async (
  threadTs: string,
  event: PullRequestEditedEvent,
  props: BaseGithubWebhookEventHanderArgs,
  pullRequestItem: PullRequest,
) => {
  LOGGER.info("Handling edited PR event", {
    changes: event.changes,
    prId: event.pull_request.id,
  });

  if (!event.changes.base && !event.changes.title && !event.changes.body) {
    LOGGER.info("No changes to base, title, or body, skipping update", {
      changes: event.changes,
      prId: event.pull_request.id,
    });
    return;
  }

  await props.slackClient.updateMainMessage(
    {
      body: convertPrEventToBaseProps(event),
      threadTs,
      slackUsername: await getSlackUserName(event.pull_request.user.login, props),
      pullRequestItem,
      requiredApprovals: null,
    },
    "pr-edited",
  );
};

const handleQueueStatusChange = async (
  threadTs: string,
  event: PullRequestEvent,
  props: BaseGithubWebhookEventHanderArgs,
  pullRequestItem: PullRequest,
  isEnqueued: boolean,
) => {
  const action = isEnqueued ? "enqueued" : "dequeued";
  LOGGER.info(`Handling PR ${action} event`, {
    prId: event.pull_request.id,
  });

  // Update the database to mark PR queue status
  await updatePullRequest({
    pullRequestId: pullRequestItem.id,
    repoId: pullRequestItem.repoId,
    isQueuedToMerge: isEnqueued,
  });

  // Update the main message to show/hide queued status
  await props.slackClient.updateMainMessage(
    {
      body: convertPrEventToBaseProps(event),
      threadTs,
      slackUsername: await getSlackUserName(event.pull_request.user.login, props),
      pullRequestItem: { ...pullRequestItem, isQueuedToMerge: isEnqueued },
      requiredApprovals: null,
    },
    `pr-${action}`,
  );
};

const handleNewPr = async (
  payload: PullRequestEventOpenedOrReadyForReview,
  props: BaseGithubWebhookEventHanderArgs,
  pullRequestItem: PullRequest | null,
) => {
  LOGGER.debug("Handling new PR");
  // If the PR is opened or ready for review but in draft, save the PR in the database
  // but don't post it
  if (payload.pull_request.draft) {
    LOGGER.debug("Handling draft PR");
    await insertPullRequest({
      id: payload.pull_request.id,
      repoId: payload.repository.id,
      prNumber: payload.pull_request.number,
      isDraft: true,
      threadTs: null,
    });
  } else {
    const { threadTs, wasCreated } = await getThreadTsForNewPr(
      payload,
      props,
      pullRequestItem,
    );

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
          body: convertPrEventToBaseProps(payload),
          threadTs,
          slackUsername: await getSlackUserName(payload.pull_request.user.login, props),
          pullRequestItem,
          // enforce using the one from the PR item since this should have already been
          // set
          requiredApprovals: null,
        });
      }
    } else {
      LOGGER.error(
        "Error posting new thread for PR opened message to Slack: " +
          "Didn't get message response back to thread messages PR ID: ",
        { prId: payload.pull_request.id },
      );
    }
  }

  async function postAllCommentsForNewPrThread(
    threadTs: string,
    body: PullRequestEventOpenedOrReadyForReview,
    baseProps: BaseGithubWebhookEventHanderArgs,
  ) {
    const accessToken = await getInstallationAccessToken(baseProps.installationId);

    await postCommentsForNewPR(body, accessToken, threadTs, baseProps);

    // Send DMs to all requested reviewers
    if (body.pull_request.requested_reviewers) {
      body.pull_request.requested_reviewers.map(async (requested_reviewer) => {
        // The requested reviewer could be a 'Team' and not a 'User'
        if ("login" in requested_reviewer) {
          const reviewerSlackId = await getSlackUserId(
            requested_reviewer.login,
            baseProps,
          );
          if (reviewerSlackId) {
            await baseProps.slackClient.postDirectMessage({
              slackUserId: reviewerSlackId,
              message: {
                text: `🔍 You've been requested to review: <${body.pull_request.html_url}|${body.repository.full_name}#${body.pull_request.number}: ${body.pull_request.title}>`,
              },
            });
          }
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
    baseProps: BaseGithubWebhookEventHanderArgs,
    pullRequestItem: PullRequest | null,
  ): Promise<{
    threadTs?: string;
    wasCreated: boolean;
  }> {
    // If the PR was opened
    if (body.action === "opened") {
      LOGGER.debug("PR was opened, creating new thread...");

      return {
        threadTs: await createNewThread({
          existingPullRequest: null,
          body,
          baseProps,
        }),
        wasCreated: true,
      };
    } else {
      // This should trigger for 'ready_for_review' events

      LOGGER.debug("PR was not opened, trying to find existing thread...");

      // If we still couldn't find a thread, then post a new one.
      // This will happen when a PR was started as a draft but this event is it being
      // opened
      if (!pullRequestItem?.threadTs) {
        LOGGER.debug("Couldn't find existing thread, creating new thread...");
        return {
          threadTs: await createNewThread({
            existingPullRequest: pullRequestItem,
            body,
            baseProps,
          }),
          wasCreated: true,
        };
      } else {
        LOGGER.debug("Found existing thread");
        return {
          threadTs: pullRequestItem.threadTs,
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
    existingPullRequest: PullRequest | null;
    body: PullRequestEventOpenedOrReadyForReview;
    baseProps: BaseGithubWebhookEventHanderArgs;
  }): Promise<string> {
    try {
      const requiredApprovals = await tryGetPrRequiredApprovalsCount({
        repository: body.repository,
        pullRequest: body.pull_request,
        baseProps,
      });

      LOGGER.debug("Got required approvals count", {
        requiredApprovals,
      });

      const response = await baseProps.slackClient.postPrReady({
        body,
        pullRequestItem: existingPullRequest,
        slackUsername: await getSlackUserName(body.pull_request.user.login, baseProps),
        requiredApprovals,
      });

      if (response?.ts) {
        LOGGER.debug("Succesfully created new threadTs. About to update database", {
          prId: body.pull_request.id,
          organizationId: baseProps.organizationId,
          existingPrId: existingPullRequest?.id,
          threadTs: response.ts,
        });
        if (existingPullRequest) {
          LOGGER.debug(`Updating existing PR record of id ${existingPullRequest.id}}`);
          await updatePullRequest({
            pullRequestId: existingPullRequest.id,
            repoId: body.repository.id,
            isDraft: body.pull_request.draft,
            requiredApprovals:
              requiredApprovals?.count ?? existingPullRequest.requiredApprovals,
            threadTs: response.ts,
          });
        } else {
          LOGGER.debug("Creating new PR record");
          await insertPullRequest({
            id: body.pull_request.id,
            repoId: body.repository.id,
            prNumber: body.pull_request.number,
            requiredApprovals: requiredApprovals?.count ?? 0,
            threadTs: response.ts,
          });
        }

        return response.ts;
      } else {
        throw new Error(
          `Tried to create new thread for PR Id ${body.pull_request.id.toString()} but didn't get a response ts: ` +
            `\nReceieved Response: ${JSON.stringify(response)}`,
        );
      }
    } catch (error) {
      throw new Error(`Error creating new thread for PR: ${error}`);
    }
  }
};
