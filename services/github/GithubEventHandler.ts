/* eslint-disable no-console */
import {
  PullRequestEvent,
  PullRequestOpenedEvent,
  PullRequestReadyForReviewEvent,
  WebhookEvent,
} from "@octokit/webhooks-types";
import { Db } from "services/db";
import { SlackClient } from "services/slack/SlackClient";
import { handlePrReady } from "./handlePrReady";

export type PullRequestReadyEvent =
  | PullRequestOpenedEvent
  | PullRequestReadyForReviewEvent;

// TODO: remove this comment
export class GithubEventHandler {
  constructor(
    private readonly database: Db,
    private readonly slackClient: SlackClient,
    private readonly installationId: number,
    private readonly organizationId: string,
  ) {}

  async handleEvent(body: WebhookEvent) {
    if ("pull_request" in body) {
      console.log("Pull request in body");
      const prId = body.pull_request.id;

      if (body.action === "opened" || body.action === "ready_for_review") {
        console.log(`Handling ${body.action} PR`);

        handlePrReady(prId, body, {
          database: this.database,
          slackClient: this.slackClient,
          organizationId: this.organizationId,
          getSlackUserName: this.getSlackUserName,
          installationId: this.installationId,
        });
      } else {
        console.log(`Handling different event, '${body.action}'`);
        if ("number" in body) {
          await this.handlePullRequestEvent(body, prId);
        }
      }
    } else {
      console.log(
        `Pull request not in body for action ${
          "action" in body ? body.action : "null"
        }`,
      );
    }
  }

  public async handlePullRequestEvent(body: PullRequestEvent, prId: number) {
    if ("action" in body) {
      const threadTs = await this.getThreadTs(prId);

      if (!threadTs) {
        // No thread found, so log and return
        console.debug(`Got non-created event and didn't find a threadTS`, {
          action: body.action,
          prId: prId,
        });
        return;
      }

      if ("pull_request" in body) {
        switch (body.action) {
          case "converted_to_draft":
            return await this.slackClient.postConvertedToDraft(
              prId,
              body,
              threadTs,
              await this.getSlackUserName(body.sender.login),
            );
          case "closed":
            if (body.pull_request.merged) {
              return await this.slackClient.postPrMerged(
                prId,
                body,
                threadTs,
                await this.getSlackUserName(body.sender.login),
              );
            } else {
              return await this.slackClient.postPrClosed(
                prId,
                body,
                threadTs,
                await this.getSlackUserName(body.sender.login),
              );
            }
          case "review_requested":
            if ("requested_reviewer" in body) {
              return await this.slackClient.postMessage({
                message: {
                  text: `Review request for ${await this.getSlackUserName(
                    body.requested_reviewer.login,
                  )}`,
                },
                prId,
                threadTs: threadTs,
              });
            }

          default:
          // nothing
        }
      }

      // Handle comments
      if ("comment" in body) {
        if (
          ["created", "opened"].includes(body.action) &&
          body.comment.user.type === "User"
        ) {
          await this.slackClient.postComment({
            prId,
            commentBody: body.comment.body,
            commentUrl: body.comment.html_url,
            threadTs: threadTs,
            slackUsername: await this.getSlackUserName(body.sender.login),
          });
          return;
        }
      }
    }
  }

  private async getSlackUserName(githubLogin: string): Promise<string> {
    const { data: slackUserId, error } =
      await this.database.getSlackUserIdFromGithubLogin({
        githubLogin,
        organizationId: this.organizationId,
      });

    if (error) {
      console.warn("Error getting slack user name: ", error);
      return githubLogin;
    }

    if (slackUserId) {
      return `<@${slackUserId.slack_user_id}>`;
    }

    return githubLogin;
  }

  private async getThreadTs(prId: number): Promise<string | undefined> {
    const { data, error } = await this.database.getThreadTs({
      prId: prId.toString(),
    });

    if (error) {
      console.debug("Error getting threadTs: ", error);
    }

    console.debug("Found threadTS: ", { threadTs: data?.thread_ts });

    return data?.thread_ts ?? undefined;
  }
}
