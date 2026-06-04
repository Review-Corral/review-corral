import {
  getInstallationAccessToken,
  getPullRequestInfo,
} from "@domain/github/fetchers";
import {
  addPrCommentParticipant,
  getPrCommentParticipants,
} from "@domain/postgres/fetchers/pr-comment-participants";
import { fetchPrItem } from "@domain/postgres/fetchers/pull-requests";
import { SlackClient } from "@domain/slack/SlackClient";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleIssueCommentEvent } from "./issueComment";
import { getDmAttachment, getSlackUserId, getSlackUserName } from "./shared";

vi.mock("sst", () => ({
  Resource: {
    NEON_DATABASE_URL: {
      value: "postgresql://test:test@localhost:5432/test",
    },
  },
}));

vi.mock("@domain/postgres/client", () => ({
  db: {},
}));

vi.mock("@domain/github/fetchers", () => ({
  getInstallationAccessToken: vi.fn(),
  getPullRequestInfo: vi.fn(),
}));

vi.mock("@domain/postgres/fetchers/pr-comment-participants", () => ({
  addPrCommentParticipant: vi.fn(),
  getPrCommentParticipants: vi.fn(),
}));

vi.mock("@domain/postgres/fetchers/pull-requests", () => ({
  fetchPrItem: vi.fn(),
}));

vi.mock("./shared", () => ({
  areSameGithubUser: (
    firstLogin: string | null | undefined,
    secondLogin: string | null | undefined,
  ) =>
    !!firstLogin &&
    !!secondLogin &&
    firstLogin.toLowerCase() === secondLogin.toLowerCase(),
  extractMentions: (commentBody: string) =>
    Array.from(commentBody.matchAll(/@([a-zA-Z0-9_-]+)/g), (match) => match[1]),
  getDmAttachment: vi.fn(),
  getSlackUserId: vi.fn(),
  getSlackUserName: vi.fn(),
}));

describe("handleIssueCommentEvent", () => {
  let slackClient: SlackClient;
  let event: any;

  beforeEach(() => {
    vi.clearAllMocks();

    slackClient = {
      postDirectMessage: vi.fn(),
    } as unknown as SlackClient;

    event = {
      action: "created",
      sender: {
        login: "alex",
      },
      comment: {
        body: "Overview page comment",
        html_url: "https://github.com/test/repo/pull/123#issuecomment-1",
        user: {
          type: "User",
          login: "alex",
        },
      },
      issue: {
        title: "Test PR",
        number: 123,
        pull_request: {
          url: "https://api.github.com/repos/test/repo/pulls/123",
        },
      },
      repository: {
        id: 456,
      },
    };

    vi.mocked(getInstallationAccessToken).mockResolvedValue({
      token: "github-token",
    } as any);
    vi.mocked(getPullRequestInfo).mockResolvedValue({
      id: 123,
      html_url: "https://github.com/test/repo/pull/123",
      user: {
        login: "Alex",
      },
    } as any);
    vi.mocked(fetchPrItem).mockResolvedValue({ id: 123, repoId: 456 } as any);
    vi.mocked(getPrCommentParticipants).mockResolvedValue([]);
    vi.mocked(getSlackUserId).mockResolvedValue("U_AUTHOR");
    vi.mocked(getSlackUserName).mockImplementation(async (githubLogin) => {
      return `<@${githubLogin}>`;
    });
    vi.mocked(getDmAttachment).mockReturnValue({ color: "gray" });
  });

  it("does not DM the PR author for their own PR overview comment", async () => {
    await handleIssueCommentEvent({
      event,
      slackClient,
      organizationId: 789,
      installationId: 101112,
    });

    expect(slackClient.postDirectMessage).not.toHaveBeenCalled();
    expect(getSlackUserId).not.toHaveBeenCalled();
    expect(addPrCommentParticipant).toHaveBeenCalledWith({
      prId: 123,
      githubUsername: "alex",
    });
  });

  it("DMs the PR author for another user's PR overview comment", async () => {
    event = {
      ...event,
      sender: {
        login: "reviewer",
      },
      comment: {
        ...event.comment,
        user: {
          type: "User",
          login: "reviewer",
        },
      },
    };

    await handleIssueCommentEvent({
      event,
      slackClient,
      organizationId: 789,
      installationId: 101112,
    });

    expect(slackClient.postDirectMessage).toHaveBeenCalledWith({
      slackUserId: "U_AUTHOR",
      message: expect.objectContaining({
        text: "💬 <@reviewer> commented on your PR",
      }),
    });
  });
});
