import { beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";

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

vi.mock("@domain/postgres/fetchers/pull-requests", () => ({
  fetchPrItem: vi.fn(),
  updatePullRequest: vi.fn(),
}));

vi.mock("@domain/postgres/fetchers/review-request-dms", () => ({
  findReviewRequestDm: vi.fn(),
}));

vi.mock("@domain/github/fetchers", () => ({
  getInstallationAccessToken: vi.fn(),
  getNumberOfApprovals: vi.fn(),
  getPullRequestInfo: vi.fn(),
}));

vi.mock("./shared", () => ({
  getDmAttachment: vi.fn(),
  getReviewRequestDmAttachment: vi.fn(),
  getSlackUserId: vi.fn(),
  getSlackUserName: vi.fn(),
}));

import {
  getInstallationAccessToken,
  getNumberOfApprovals,
  getPullRequestInfo,
} from "@domain/github/fetchers";
import {
  type PullRequestWithAlias,
  fetchPrItem,
  updatePullRequest,
} from "@domain/postgres/fetchers/pull-requests";
import { findReviewRequestDm } from "@domain/postgres/fetchers/review-request-dms";
import { SlackClient } from "@domain/slack/SlackClient";
import { handlePullRequestReviewEvent } from "./pullRequestReview";
import {
  getDmAttachment,
  getReviewRequestDmAttachment,
  getSlackUserId,
  getSlackUserName,
} from "./shared";

describe("handlePullRequestReviewEvent", () => {
  let mockSlackClient: SlackClient;
  let pullRequestItem: PullRequestWithAlias;
  let reviewEvent: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSlackClient = {
      postDirectMessage: vi.fn(),
      updateDirectMessage: vi.fn(),
      updateMainMessage: vi.fn(),
    } as unknown as SlackClient;

    pullRequestItem = mock<PullRequestWithAlias>({
      id: 123,
      prId: 123,
      repoId: 456,
      threadTs: "thread-ts-123",
      requestedReviewers: ["micthiesen"],
      reviewerStatuses: [
        {
          login: "micthiesen",
          lastReviewState: "commented",
          isCurrentlyRequested: true,
          isReRequested: true,
        },
      ],
      additions: 10,
      deletions: 5,
    });

    reviewEvent = {
      action: "submitted",
      review: {
        state: "commented",
        body: "Looks good overall",
        user: {
          login: "micthiesen",
          type: "User",
        },
      },
      pull_request: {
        id: 123,
        number: 9,
        title: "Test PR",
        html_url: "https://github.com/test/repo/pull/9",
        url: "https://api.github.com/repos/test/repo/pulls/9",
        user: {
          login: "prauthor",
        },
      },
      repository: {
        id: 456,
        full_name: "test/repo",
        owner: {
          avatar_url: "https://github.com/test.png",
        },
      },
      sender: {
        login: "micthiesen",
      },
    };

    vi.mocked(fetchPrItem).mockResolvedValue(pullRequestItem);
    vi.mocked(findReviewRequestDm).mockResolvedValue({
      slackChannelId: "D123",
      slackMessageTs: "123.456",
    } as any);
    vi.mocked(getInstallationAccessToken).mockResolvedValue({
      token: "token",
    } as any);
    vi.mocked(getNumberOfApprovals).mockResolvedValue(0);
    vi.mocked(getPullRequestInfo).mockResolvedValue({
      title: "Test PR",
      number: 9,
      html_url: "https://github.com/test/repo/pull/9",
      body: "PR body",
      user: {
        login: "prauthor",
        avatar_url: "https://github.com/prauthor.png",
      },
      additions: 10,
      deletions: 5,
      base: {
        ref: "main",
        repo: {
          full_name: "test/repo",
          owner: {
            avatar_url: "https://github.com/test.png",
          },
        },
      },
      merged: false,
      draft: false,
      closed_at: null,
    } as any);
    vi.mocked(getSlackUserName).mockResolvedValue("@user");
    vi.mocked(getSlackUserId).mockResolvedValue("U123");
    vi.mocked(getDmAttachment).mockReturnValue({ color: "#fff" } as any);
    vi.mocked(getReviewRequestDmAttachment).mockReturnValue({ color: "#fff" } as any);
  });

  it("should refresh the main message for a commented review", async () => {
    await handlePullRequestReviewEvent({
      event: reviewEvent,
      slackClient: mockSlackClient,
      organizationId: 789,
      installationId: 101112,
    });

    expect(updatePullRequest).toHaveBeenCalledWith({
      pullRequestId: 123,
      repoId: 456,
      approvalCount: 0,
      reviewerStatuses: [
        {
          login: "micthiesen",
          lastReviewState: "commented",
          isCurrentlyRequested: false,
          isReRequested: false,
        },
      ],
    });

    expect(mockSlackClient.updateMainMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        threadTs: "thread-ts-123",
        pullRequestItem: expect.objectContaining({
          approvalCount: 0,
          reviewerStatuses: [
            {
              login: "micthiesen",
              lastReviewState: "commented",
              isCurrentlyRequested: false,
              isReRequested: false,
            },
          ],
        }),
      }),
      "pr-review-submitted",
    );
  });

  it("should keep a dismissed reviewer visible as pending if they are still requested", async () => {
    reviewEvent = {
      ...reviewEvent,
      action: "dismissed",
      review: {
        ...reviewEvent.review,
        state: "approved",
        body: null,
      },
    };

    await handlePullRequestReviewEvent({
      event: reviewEvent,
      slackClient: mockSlackClient,
      organizationId: 789,
      installationId: 101112,
    });

    expect(updatePullRequest).toHaveBeenCalledWith({
      pullRequestId: 123,
      repoId: 456,
      approvalCount: 0,
      reviewerStatuses: [
        {
          login: "micthiesen",
          lastReviewState: "pending",
          isCurrentlyRequested: true,
          isReRequested: false,
        },
      ],
    });

    expect(mockSlackClient.updateMainMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        threadTs: "thread-ts-123",
        pullRequestItem: expect.objectContaining({
          approvalCount: 0,
          reviewerStatuses: [
            {
              login: "micthiesen",
              lastReviewState: "pending",
              isCurrentlyRequested: true,
              isReRequested: false,
            },
          ],
        }),
      }),
      "pr-review-dismissed",
    );

    expect(mockSlackClient.postDirectMessage).not.toHaveBeenCalled();
    expect(mockSlackClient.updateDirectMessage).not.toHaveBeenCalled();
  });
});
