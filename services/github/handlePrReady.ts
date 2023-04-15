import axios from "axios";
import { getInstallationAccessToken } from "services/utils/apiUtils";
import { InstallationAccessResponse } from "types/github-api-types";
import { PullRequestReadyEvent } from "./GithubEventHandler";
import { BasePrEventHandlerProps } from "./shared";

export async function handlePrReady(
  prId: number,
  body: PullRequestReadyEvent,
  baseProps: BasePrEventHandlerProps,
) {
  // If the PR is opened but in draft, just save the PR and don't post it
  if (body.pull_request?.draft === true) {
    // Handle draft phase

    baseProps.database.insertPullRequest({
      prId: prId.toString(),
      isDraft: true,
      threadTs: null,
      organizationId: baseProps.organizationId,
    });
  } else {
    const { threadTs, wasCreated } = await getThreadTsForNewPr(
      prId,
      body,
      baseProps,
    );
    if (threadTs) {
      if (wasCreated) {
        // Get all comments and post them in the thread along witht he opened event
        const accessToken = await getInstallationAccessToken(
          baseProps.installationId,
        );

        await postCommentsForNewPR(
          body,
          accessToken,
          prId,
          threadTs,
          baseProps,
        );
        // Get all requested Reviews and post
        if (body.pull_request.requested_reviewers) {
          body.pull_request.requested_reviewers.map(
            async (requested_reviewer) => {
              // The requested reviewer could be a 'Team' and not a 'User'
              if ("login" in requested_reviewer) {
                await baseProps.slackClient.postMessage({
                  message: {
                    text: `Review request for ${await baseProps.getSlackUserName(
                      requested_reviewer.login,
                    )}`,
                  },
                  prId,
                  threadTs: threadTs,
                });
              }
            },
          );
        }
      } else {
        // TODO: post ready for review message
      }
    } else {
      console.error(
        "Error posting new thread for PR opened message to Slack: Didn't get message response back to thread messages PR ID: ",
        { prId: prId },
      );
    }
  }
}

async function postCommentsForNewPR(
  body: PullRequestReadyEvent,
  accessToken: InstallationAccessResponse,
  prId: number,
  threadTs: string,
  baseProps: BasePrEventHandlerProps,
) {
  try {
    const response = await axios.get(body.pull_request.comments_url, {
      headers: {
        Authorization: `bearer ${accessToken.token}`,
      },
    });

    // TODO: see above todo for better type
    for (const comment of response.data) {
      if (comment.user.type === "User") {
        baseProps.slackClient.postComment({
          prId,
          commentBody: comment.body,
          commentUrl: comment.url,
          threadTs: threadTs,
          slackUsername: await baseProps.getSlackUserName(comment.user.login),
        });
      }
    }
  } catch (error) {
    console.error("Error getting comments: ", error);
  }
}

async function getThreadTsForNewPr(
  prId: number,
  body: PullRequestReadyEvent,
  baseProps: BasePrEventHandlerProps,
): Promise<{
  threadTs?: string;
  wasCreated: boolean;
}> {
  // If the PR was opened
  if (body.action === "opened") {
    return {
      threadTs: await createNewThread(prId, body, baseProps),
      wasCreated: true,
    };
  } else {
    // This should trigger for 'ready_for_review' events
    const existingThreadTs = (
      await baseProps.database.getThreadTs({
        prId: prId.toString(),
      })
    ).data?.thread_ts;

    // If we still couldn't find a thread, then post a new one.
    if (!existingThreadTs) {
      return {
        threadTs: await createNewThread(prId, body, baseProps),
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
  prId: number,
  body: PullRequestReadyEvent,
  baseProps: BasePrEventHandlerProps,
): Promise<string> {
  const response = await baseProps.slackClient.postPrReady(
    prId,
    body,
    await baseProps.getSlackUserName(body.sender.login),
  );

  if (response && response.ts) {
    baseProps.database.insertPullRequest({
      prId: prId.toString(),
      isDraft: false,
      threadTs: response.ts,
      organizationId: baseProps.organizationId,
    });

    return response.ts;
  } else {
    throw new Error(
      `Tried to create new thread for PR Id ${prId} but didn't get a response ts: ` +
        `\nReceieved Response: ${JSON.stringify(response)}`,
    );
  }
}
