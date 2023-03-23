/* eslint-disable no-console */
import {
  PullRequestOpenedEvent,
  PullRequestReadyForReviewEvent,
  WebhookEvent,
} from "@octokit/webhooks-types";
import { ChatPostMessageResponse } from "@slack/web-api";
import { Db } from "services/db";
import { SlackClient } from "services/slack/SlackClient";
import { ReadyHandler } from "./ReadyHandler";

export type PullRequestReadyEvent =
  | PullRequestOpenedEvent
  | PullRequestReadyForReviewEvent;

// TODO: remove this comment
export class GithubEventHandler {
  readonly slackClient: SlackClient;

  constructor(
    private readonly database: Db,
    channelId: string,
    slackToken: string,
    private readonly installationId: number,
    private readonly organizationId: string,
  ) {
    this.slackClient = new SlackClient(channelId, slackToken);
  }

  async handleEvent(body: WebhookEvent) {
    console.info("hello!");
    if ("pull_request" in body) {
      console.log("Pull request in body");
      const prId = body.pull_request.id;

      if (body.action === "opened" || body.action === "ready_for_review") {
        console.log(`Handling ${body.action} PR`);
        await new ReadyHandler(
          this.database,
          this.slackClient,
          this.organizationId,
          this.getSlackUserName,
          this.installationId,
        ).handleNewPr(prId, body);
      } else {
        console.log(`Handling different event, '${body.action}'`);
        await this.handleOtherEvent(body, prId);
      }
    } else {
      console.log(
        `Pull request not in body for action ${
          "action" in body ? body.action : "null"
        }`,
      );
    }
  }

  public async handleOtherEvent(body: WebhookEvent, prId: number) {
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

      if (body.action === "deleted") {
        // Ingore, this is probably a comment or review that was deleted
        return;
      }

      if (body.action === "submitted" && "review" in body) {
        if (body.review.state === "commented" && body.review.body === null) {
          // This means they left a comment on the PR, not an actual review comment
          return;
        }
        await this.slackClient.postReview(
          body.pull_request.id,
          body.review,
          body.sender.login,
          threadTs,
          await this.getSlackUserName(body.sender.login),
        );
        return;
      }

      if (
        (body.action === "opened" || body.action === "created") &&
        "comment" in body &&
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

      if ("pull_request" in body) {
        if (body.action === "closed") {
          if (body.pull_request.merged) {
            await this.slackClient.postPrMerged(
              prId,
              body,
              threadTs,
              await this.getSlackUserName(body.sender.login),
            );
          } else {
            await this.slackClient.postPrClosed(
              prId,
              body,
              threadTs,
              await this.getSlackUserName(body.sender.login),
            );
          }
        } else {
          // TODO: Improve this block

          if (body.action === "synchronize") {
            return;
          }

          if (
            body.action === "review_requested" &&
            "requested_reviewer" in body
          ) {
            await this.slackClient.postMessage({
              message: {
                text: `Review request for ${await this.getSlackUserName(
                  body.requested_reviewer.login,
                )}`,
              },
              prId,
              threadTs: threadTs,
            });
          } else if (body.action === "ready_for_review") {
            await this.slackClient.postReadyForReview(
              prId,
              threadTs,
              await this.getSlackUserName(body.sender.login),
            );
          } else {
            // Event we're not handling currently
            console.info("Got unsupported event: ", { action: body.action });
          }
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

  private async saveThreadTs(message: ChatPostMessageResponse, prId: number) {
    if (!message.message?.ts) {
      console.error(
        "Error saving thread ts: No message.message.ts is undefined",
      );
      return;
    }

    const { error } = await this.database.insertPullRequest({
      prId: prId.toString(),
      isDraft: false,
      threadTs: message.message.ts,
      organizationId: this.organizationId,
    });

    if (error) {
      console.error("Error saving thread ts: ", error);
    }
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
