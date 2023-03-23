import axios from "axios";
import { Db } from "services/db";
import { SlackClient } from "services/slack/SlackClient";
import { getInstallationAccessToken } from "services/utils/apiUtils";
import { InstallationAccessResponse } from "types/github-api-types";
import { PullRequestReadyEvent } from "./GithubEventHandler";

export class ReadyHandler {
  constructor(
    readonly database: Db,
    readonly slackClient: SlackClient,
    readonly organizationId: string,
    readonly getSlackUserName: (githubLogin: string) => Promise<string>,
    readonly installationId: number,
  ) {}

  public async handleNewPr(prId: number, body: PullRequestReadyEvent) {
    console.log("hello I'm called!");
    // If the PR is opened but in draft, just save the PR and don't post it
    if (body.pull_request?.draft === true) {
      // Handle draft phase

      this.database.insertPullRequest({
        prId: prId.toString(),
        isDraft: true,
        threadTs: null,
        organizationId: this.organizationId,
      });
    } else {
      const { threadTs, wasCreated } = await this.getThreadTsForNewPr(
        prId,
        body,
      );
      if (threadTs) {
        if (wasCreated) {
          // Get all comments and post them in the thread along witht he opened event
          const accessToken = await getInstallationAccessToken(
            this.installationId,
          );

          await this.postCommentsForNewPR(body, accessToken, prId, threadTs);
          // Get all requested Reviews and post
          if (body.pull_request.requested_reviewers) {
            body.pull_request.requested_reviewers.map(
              async (requested_reviewer) => {
                // The requested reviewer could be a 'Team' and not a 'User'
                if ("login" in requested_reviewer) {
                  await this.slackClient.postMessage({
                    message: {
                      text: `Review request for ${await this.getSlackUserName(
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

  private async postCommentsForNewPR(
    body: PullRequestReadyEvent,
    accessToken: InstallationAccessResponse,
    prId: number,
    threadTs: string,
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
          this.slackClient.postComment({
            prId,
            commentBody: comment.body,
            commentUrl: comment.url,
            threadTs: threadTs,
            slackUsername: await this.getSlackUserName(comment.user.login),
          });
        }
      }
    } catch (error) {
      console.error("Error getting comments: ", error);
    }
  }

  async getThreadTsForNewPr(
    prId: number,
    body: PullRequestReadyEvent,
  ): Promise<{
    threadTs?: string;
    wasCreated: boolean;
  }> {
    // If the PR was opened
    if (body.action === "opened") {
      return {
        threadTs: await this.createNewThread(prId, body),
        wasCreated: true,
      };
    } else {
      // This should trigger for 'ready_for_review' events
      const existingThreadTs = (
        await this.database.getThreadTs({
          prId: prId.toString(),
        })
      ).data?.thread_ts;

      // If we still couldn't find a thread, then post a new one.
      if (!existingThreadTs) {
        return {
          threadTs: await this.createNewThread(prId, body),
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

  async createNewThread(
    prId: number,
    body: PullRequestReadyEvent,
  ): Promise<string> {
    const response = await this.slackClient.postPrReady(
      prId,
      body,
      await this.getSlackUserName(body.sender.login),
    );

    if (response && response.ts) {
      this.database.insertPullRequest({
        prId: prId.toString(),
        isDraft: false,
        threadTs: response.ts,
        organizationId: this.organizationId,
      });

      return response.ts;
    } else {
      throw new Error(
        `Tried to create new thread for PR Id ${prId} but didn't get a response ts: ` +
          `\nReceieved Response: ${JSON.stringify(response)}`,
      );
    }
  }
}
