import {
  getDmAttachment,
  getSlackUserId,
  getSlackUserName,
} from "@domain/github/webhooks/handlers/shared";
import ky from "ky";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { postCommentsForNewPR } from "./getCommentsForPr";

vi.mock("ky", () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock("@domain/github/webhooks/handlers/pullRequest", () => ({
  LOGGER: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@domain/github/webhooks/handlers/shared", () => ({
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

describe("postCommentsForNewPR", () => {
  const postDirectMessage = vi.fn();
  const body = {
    pull_request: {
      id: 123,
      title: "Add convert metrics config",
      number: 4805,
      html_url: "https://github.com/Understory-Tech/client-app/pull/4805",
      comments_url:
        "https://api.github.com/repos/Understory-Tech/client-app/pulls/4805/comments",
      user: {
        login: "Alex",
      },
    },
  };
  const accessToken = { token: "github-token" };
  const baseProps = {
    organizationId: 789,
    installationId: 101112,
    slackClient: {
      postDirectMessage,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSlackUserId).mockResolvedValue("U_AUTHOR");
    vi.mocked(getSlackUserName).mockImplementation(async (githubLogin) => {
      return `<@${githubLogin}>`;
    });
    vi.mocked(getDmAttachment).mockReturnValue({ color: "gray" });
  });

  it("does not DM the PR author for their own existing review comment", async () => {
    mockReviewComments([
      {
        user: {
          type: "User",
          login: "alex",
        },
        body: "Graphite stack comment",
      },
    ]);

    await postCommentsForNewPR(body as any, accessToken as any, baseProps as any);

    expect(postDirectMessage).not.toHaveBeenCalled();
    expect(getSlackUserId).not.toHaveBeenCalled();
  });

  it("DMs the PR author for another user's existing review comment", async () => {
    mockReviewComments([
      {
        user: {
          type: "User",
          login: "reviewer",
        },
        body: "Looks good",
      },
    ]);

    await postCommentsForNewPR(body as any, accessToken as any, baseProps as any);

    expect(postDirectMessage).toHaveBeenCalledWith({
      slackUserId: "U_AUTHOR",
      message: expect.objectContaining({
        text: "💬 <@reviewer> commented on your PR",
      }),
    });
  });

  function mockReviewComments(comments: unknown[]) {
    vi.mocked(ky.get).mockReturnValue({
      json: vi.fn().mockResolvedValue(comments),
    } as never);
  }
});
