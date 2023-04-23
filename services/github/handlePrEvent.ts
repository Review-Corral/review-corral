import {
  PullRequestConvertedToDraftEvent,
  PullRequestEvent,
  PullRequestOpenedEvent,
  PullRequestReadyForReviewEvent,
} from "@octokit/webhooks-types";
import axios from "axios";
import { PullRequestRow } from "services/db";
import { getInstallationAccessToken } from "services/utils/apiUtils";
import { InstallationAccessResponse } from "types/github-api-types";
import { BaseGithubHanderProps, getSlackUserName, getThreadTs } from "./shared";

export type PullRequestEventOpenedOrReadyForReview =
  | PullRequestOpenedEvent
  | PullRequestReadyForReviewEvent;

export const handlePullRequestEvent = async (
  payload: PullRequestEvent,
  props: BaseGithubHanderProps,
): Promise<void> => {
  console.log("Hanlding PR event with action: ", payload.action);
  if (payload.action === "opened" || payload.action === "ready_for_review") {
    return await handleNewPr(payload, props);
  } else {
    const threadTs = await getThreadTs(payload.pull_request.id, props.database);

    if (!threadTs) {
      // No thread found, so log and return
      console.debug(`Got non-created event and didn't find a threadTS`, {
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
            await getSlackUserName(payload.sender.login, props),
          );
          return;
        } else {
          await props.slackClient.postPrClosed(
            payload,
            threadTs,
            await getSlackUserName(payload.sender.login, props),
          );
          return;
        }
      case "review_requested":
        if ("requested_reviewer" in payload) {
          await props.slackClient.postMessage({
            message: {
              text: `Review request for ${await getSlackUserName(
                payload.requested_reviewer.login,
                props,
              )}`,
            },
            threadTs: threadTs,
          });
        }
        return;
      default:
        console.debug(`Got unhandled pull_request event`, {
          action: payload.action,
          prId: payload.pull_request.id,
        });
    }
  }
};

const handleConvertedToDraft = async (
  threadTs: string,
  event: PullRequestConvertedToDraftEvent,
  props: BaseGithubHanderProps,
) => {
  await props.slackClient.postConvertedToDraft(
    event,
    threadTs,
    await getSlackUserName(event.sender.login, props),
  );
};

const handleNewPr = async (
  payload: PullRequestEventOpenedOrReadyForReview,
  props: BaseGithubHanderProps,
) => {
  console.log("Handling new PR");
  // If the PR is opened or ready for review but in draft, save the PR in the database
  // but don't post it
  if (payload.pull_request.draft) {
    console.log("Handling draft PR");
    await props.database.insertPullRequest({
      prId: payload.pull_request.id.toString(),
      isDraft: true,
      threadTs: null,
      organizationId: props.organizationId,
    });
  } else {
    console.log("Pull request is not draft");
    const { threadTs, wasCreated } = await getThreadTsForNewPr(payload, props);

    console.log("Got threadTs: ", threadTs, " and wasCreated: ", wasCreated);

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
            props,
          ),
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

  /**
   * Only to be used for 'new' PRs where it will try and find the thread_ts
   * in the database if one exists (this will happen if it started out as a draft), or
   * create a new one if it doesn't exist.
   */
  async function getThreadTsForNewPr(
    body: PullRequestEventOpenedOrReadyForReview,
    baseProps: BaseGithubHanderProps,
  ): Promise<{
    threadTs?: string;
    wasCreated: boolean;
  }> {
    // If the PR was opened
    if (body.action === "opened") {
      console.log("PR was opened, creating new thread...");
      return {
        threadTs: await createNewThread({
          existingPullRequest: null,
          body,
          baseProps,
        }),
        wasCreated: true,
      };
    } else {
      console.log("PR was not opened, trying to find existing thread...");
      // This should trigger for 'ready_for_review' events
      const existingPullRequest = (
        await baseProps.database.getPullRequest({
          prId: body.pull_request.id.toString(),
        })
      ).data;

      // If we still couldn't find a thread, then post a new one.
      if (!existingPullRequest?.thread_ts) {
        console.log("Couldn't find existing thread, creating new thread...");
        return {
          threadTs: await createNewThread({
            existingPullRequest,
            body,
            baseProps,
          }),
          wasCreated: true,
        };
      } else {
        console.log("Found existing thread");
        return {
          threadTs: existingPullRequest.thread_ts,
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
    existingPullRequest: PullRequestRow | null;
    body: PullRequestEventOpenedOrReadyForReview;
    baseProps: BaseGithubHanderProps;
  }): Promise<string> {
    try {
      const response = await baseProps.slackClient.postPrReady(
        body,
        await getSlackUserName(body.sender.login, baseProps),
      );

      if (response && response.ts) {
        console.debug(
          "Succesfully created new thread_ts. About to update database",
          {
            prId: body.pull_request.id,
            organizationId: baseProps.organizationId,
            existingPrId: existingPullRequest?.pr_id,
            threadTs: response.ts,
          },
        );
        if (existingPullRequest) {
          console.debug(
            `Updating existing PR record of id ${existingPullRequest.pr_id}}`,
          );
          await baseProps.database.updatePullRequest({
            prId: existingPullRequest?.pr_id,
            isDraft: body.pull_request.draft,
            threadTs: response.ts,
            organizationId: baseProps.organizationId,
          });
        } else {
          console.debug(`Creating new  PR record`);
          await baseProps.database.insertPullRequest({
            prId: body.pull_request.id.toString(),
            isDraft: body.pull_request.draft,
            threadTs: response.ts,
            organizationId: baseProps.organizationId,
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
      throw new Error("Error creating new thread for PR: " + error);
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
          await baseProps.slackClient.postComment({
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
