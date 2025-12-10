import { beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";

// Mock SST Resources before any imports that use it
vi.mock("sst", () => ({
  Resource: {
    NEON_DATABASE_URL: {
      value: "postgresql://test:test@localhost:5432/test",
    },
  },
}));

// Mock Postgres client to prevent actual database connections
vi.mock("@domain/postgres/client", () => ({
  db: {},
}));

// Mock dependencies
vi.mock("./shared", () => ({
  getSlackUserName: vi.fn(),
  getSlackUserId: vi.fn(),
  getDmAttachment: vi.fn(),
}));

vi.mock("@domain/postgres/fetchers/pull-requests", () => ({
  fetchPrItem: vi.fn(),
  updatePullRequest: vi.fn(),
  insertPullRequest: vi.fn(),
}));

// Import after mocks are set up
import {
  PullRequestWithAlias,
  fetchPrItem,
  updatePullRequest,
} from "@domain/postgres/fetchers/pull-requests";
import { SlackClient } from "@domain/slack/SlackClient";
import { handlePullRequestEvent } from "./pullRequest";
import { getDmAttachment, getSlackUserId, getSlackUserName } from "./shared";
import { convertPrEventToBaseProps } from "./utils";

describe("handlePullRequestEvent", () => {
  let mockSlackClient: SlackClient;
  let mockEvent: any;
  let prItem: PullRequestWithAlias;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSlackClient = {
      postMessage: vi.fn(),
      updateMainMessage: vi.fn(),
    } as unknown as SlackClient;

    mockEvent = {
      action: "review_request_removed",
      pull_request: {
        id: 123,
        title: "I'm a PR title",
        user: {
          login: "testuser",
        },
      },
      repository: {
        id: 456,
      },
      requested_reviewer: {
        login: "testuser",
      },
    };

    prItem = mock<PullRequestWithAlias>({
      id: 123,
      prId: 123,
      repoId: 456,
      threadTs: "thread-ts-123",
      isDraft: false,
      requiredApprovals: 0,
      approvalCount: 0,
      isQueuedToMerge: false,
      requestedReviewers: [],
    });

    vi.mocked(getSlackUserName).mockResolvedValue("@testuser");
    vi.mocked(getSlackUserId).mockResolvedValue("U123456");
    vi.mocked(getDmAttachment).mockReturnValue({ color: "#0066ff" });
    vi.mocked(fetchPrItem).mockResolvedValue(prItem);
  });

  it("should call slackClient.postDirectMessage when review_request_removed", async () => {
    const mockSlackClientWithDm = {
      ...mockSlackClient,
      postDirectMessage: vi.fn(),
    } as unknown as SlackClient;

    await handlePullRequestEvent({
      event: mockEvent,
      slackClient: mockSlackClientWithDm,
      organizationId: 789,
      installationId: 101112,
    });

    expect(fetchPrItem).toHaveBeenCalledWith({
      pullRequestId: 123,
      repoId: 456,
    });

    expect(getSlackUserId).toHaveBeenCalledWith("testuser", expect.any(Object));

    expect(mockSlackClientWithDm.postDirectMessage).toHaveBeenCalledWith({
      slackUserId: "U123456",
      message: {
        text: "Your review request was removed from this PR",
        attachments: [{ color: "#0066ff" }],
      },
    });
  });

  it("should call slackClient.updateMainMessage when edited", async () => {
    const newMockEvent = {
      ...mockEvent,
      action: "edited",
      changes: {
        title: {
          from: "old-title",
        },
      },
      sender: {
        login: "testuser",
      },
    };
    await handlePullRequestEvent({
      event: newMockEvent,
      slackClient: mockSlackClient,
      organizationId: 789,
      installationId: 101112,
    });

    expect(fetchPrItem).toHaveBeenCalledWith({
      pullRequestId: 123,
      repoId: 456,
    });

    expect(mockSlackClient.updateMainMessage).toHaveBeenCalledWith(
      {
        body: convertPrEventToBaseProps(newMockEvent),
        threadTs: "thread-ts-123",
        slackUsername: "@testuser",
        pullRequestItem: prItem,
        requiredApprovals: null,
      },
      "pr-edited",
    );
  });

  it("should not call slackClient.postUpdatedPullRequest when no changes", async () => {
    const newMockEvent = {
      ...mockEvent,
      action: "edited",
      changes: {
        title: undefined,
      },
      sender: {
        login: "testuser",
      },
    };
    await handlePullRequestEvent({
      event: newMockEvent,
      slackClient: mockSlackClient,
      organizationId: 789,
      installationId: 101112,
    });

    expect(fetchPrItem).toHaveBeenCalledWith({
      pullRequestId: 123,
      repoId: 456,
    });

    expect(mockSlackClient.updateMainMessage).not.toHaveBeenCalled();
  });

  describe("queue events", () => {
    it("should handle enqueued event", async () => {
      const enqueuedEvent = {
        ...mockEvent,
        action: "enqueued",
        sender: {
          login: "testuser",
        },
      };

      await handlePullRequestEvent({
        event: enqueuedEvent,
        slackClient: mockSlackClient,
        organizationId: 789,
        installationId: 101112,
      });

      expect(updatePullRequest).toHaveBeenCalledWith({
        pullRequestId: prItem.id,
        repoId: prItem.repoId,
        isQueuedToMerge: true,
      });

      expect(mockSlackClient.updateMainMessage).toHaveBeenCalledWith(
        {
          body: convertPrEventToBaseProps(enqueuedEvent),
          threadTs: "thread-ts-123",
          slackUsername: "@testuser",
          pullRequestItem: { ...prItem, isQueuedToMerge: true },
          requiredApprovals: null,
        },
        "pr-enqueued",
      );
    });

    it("should handle dequeued event", async () => {
      const dequeuedEvent = {
        ...mockEvent,
        action: "dequeued",
        sender: {
          login: "testuser",
        },
      };

      await handlePullRequestEvent({
        event: dequeuedEvent,
        slackClient: mockSlackClient,
        organizationId: 789,
        installationId: 101112,
      });

      expect(updatePullRequest).toHaveBeenCalledWith({
        pullRequestId: prItem.id,
        repoId: prItem.repoId,
        isQueuedToMerge: false,
      });

      expect(mockSlackClient.updateMainMessage).toHaveBeenCalledWith(
        {
          body: convertPrEventToBaseProps(dequeuedEvent),
          threadTs: "thread-ts-123",
          slackUsername: "@testuser",
          pullRequestItem: { ...prItem, isQueuedToMerge: false },
          requiredApprovals: null,
        },
        "pr-dequeued",
      );
    });
  });

  describe("merge events", () => {
    it("should clear queue status and send DM when PR is merged", async () => {
      const queuedPrItem = mock<PullRequestWithAlias>({
        ...prItem,
        isQueuedToMerge: true,
      });
      vi.mocked(fetchPrItem).mockResolvedValue(queuedPrItem);

      const mockSlackClientWithMerged = {
        ...mockSlackClient,
        postDirectMessage: vi.fn(),
      } as unknown as SlackClient;

      const mergedEvent = {
        ...mockEvent,
        action: "closed",
        pull_request: {
          ...mockEvent.pull_request,
          merged: true,
          title: "I'm a PR title",
          number: 42,
          html_url: "https://github.com/test/repo/pull/42",
        },
        sender: {
          login: "testuser",
        },
      };

      await handlePullRequestEvent({
        event: mergedEvent,
        slackClient: mockSlackClientWithMerged,
        organizationId: 789,
        installationId: 101112,
      });

      expect(updatePullRequest).toHaveBeenCalledWith({
        pullRequestId: queuedPrItem.id,
        repoId: queuedPrItem.repoId,
        isQueuedToMerge: false,
      });

      expect(mockSlackClientWithMerged.postDirectMessage).toHaveBeenCalledWith({
        slackUserId: "U123456",
        message: {
          text: "🟣 Your PR was merged",
          attachments: [{ color: "#0066ff" }],
        },
      });
    });

    it("should handle closed PR and send DM when closed by someone else", async () => {
      vi.mocked(getSlackUserId).mockImplementation(async (login) => {
        if (login === "testuser") return "U123456";
        if (login === "otheruser") return "U654321";
        return null;
      });
      vi.mocked(getSlackUserName).mockImplementation(async (login) => {
        if (login === "testuser") return "<@U123456>";
        if (login === "otheruser") return "<@U654321>";
        return login;
      });

      const mockSlackClientWithClosed = {
        ...mockSlackClient,
        postPrClosed: vi.fn(),
        postDirectMessage: vi.fn(),
      } as unknown as SlackClient;

      const closedEvent = {
        ...mockEvent,
        action: "closed",
        pull_request: {
          ...mockEvent.pull_request,
          merged: false,
          title: "I'm a PR title",
          number: 42,
          html_url: "https://github.com/test/repo/pull/42",
        },
        sender: {
          login: "otheruser",
        },
      };

      await handlePullRequestEvent({
        event: closedEvent,
        slackClient: mockSlackClientWithClosed,
        organizationId: 789,
        installationId: 101112,
      });

      expect(updatePullRequest).not.toHaveBeenCalled();

      expect(mockSlackClientWithClosed.postPrClosed).toHaveBeenCalledWith(
        {
          body: closedEvent,
          threadTs: "thread-ts-123",
          slackUsername: "<@U123456>",
          pullRequestItem: prItem,
          requiredApprovals: null,
        },
        "<@U654321>",
      );
    });
  });

  describe("review_requested event", () => {
    beforeEach(() => {
      mockEvent = {
        action: "review_requested",
        pull_request: {
          id: 123,
          title: "Test PR",
          user: {
            login: "prauthor",
          },
          requested_reviewers: [
            {
              login: "newreviewer",
            },
          ],
        },
        repository: {
          id: 456,
        },
        requested_reviewer: {
          login: "newreviewer",
        },
      };
    });

    it("should send DM and update main message when reviewer is added", async () => {
      const mockSlackClientWithDm = {
        ...mockSlackClient,
        postDirectMessage: vi.fn(),
        updateMainMessage: vi.fn(),
      } as unknown as SlackClient;

      // Mock updatePullRequest to return the updated item
      const updatedPrItem = {
        ...prItem,
        requestedReviewers: ["newreviewer"],
      };
      vi.mocked(updatePullRequest).mockResolvedValueOnce(updatedPrItem);

      await handlePullRequestEvent({
        event: mockEvent,
        slackClient: mockSlackClientWithDm,
        organizationId: 789,
        installationId: 101112,
      });

      // Should send DM
      expect(mockSlackClientWithDm.postDirectMessage).toHaveBeenCalledWith({
        slackUserId: "U123456",
        message: {
          text: "🔍 You've been requested to review",
          attachments: expect.any(Array),
        },
      });

      // Should update main message
      expect(mockSlackClientWithDm.updateMainMessage).toHaveBeenCalledWith(
        {
          body: expect.objectContaining({
            pull_request: expect.objectContaining({
              title: "Test PR",
            }),
          }),
          threadTs: "thread-ts-123",
          slackUsername: "@testuser",
          pullRequestItem: expect.objectContaining({
            requestedReviewers: ["newreviewer"],
          }),
          requiredApprovals: null,
        },
        "review-requested",
      );

      // Should update database with reviewer logins
      expect(updatePullRequest).toHaveBeenCalledWith({
        pullRequestId: prItem.id,
        repoId: prItem.repoId,
        requestedReviewers: ["newreviewer"],
      });
    });
  });

  describe("review_request_removed event", () => {
    beforeEach(() => {
      mockEvent = {
        action: "review_request_removed",
        pull_request: {
          id: 123,
          title: "Test PR",
          user: {
            login: "prauthor",
          },
          requested_reviewers: [],
        },
        repository: {
          id: 456,
        },
        requested_reviewer: {
          login: "removedreviewer",
        },
      };
    });

    it("should send DM and update main message when reviewer is removed", async () => {
      const mockSlackClientWithDm = {
        ...mockSlackClient,
        postDirectMessage: vi.fn(),
        updateMainMessage: vi.fn(),
      } as unknown as SlackClient;

      // Mock updatePullRequest to return the updated item with empty reviewers
      const updatedPrItem = {
        ...prItem,
        requestedReviewers: [],
      };
      vi.mocked(updatePullRequest).mockResolvedValueOnce(updatedPrItem);

      await handlePullRequestEvent({
        event: mockEvent,
        slackClient: mockSlackClientWithDm,
        organizationId: 789,
        installationId: 101112,
      });

      // Should send DM
      expect(mockSlackClientWithDm.postDirectMessage).toHaveBeenCalledWith({
        slackUserId: "U123456",
        message: {
          text: "Your review request was removed from this PR",
          attachments: expect.any(Array),
        },
      });

      // Should update main message with empty reviewers
      expect(mockSlackClientWithDm.updateMainMessage).toHaveBeenCalledWith(
        {
          body: expect.objectContaining({
            pull_request: expect.objectContaining({
              title: "Test PR",
            }),
          }),
          threadTs: "thread-ts-123",
          slackUsername: "@testuser",
          pullRequestItem: expect.objectContaining({
            requestedReviewers: [],
          }),
          requiredApprovals: null,
        },
        "review-request-removed",
      );

      // Should update database with empty reviewer list
      expect(updatePullRequest).toHaveBeenCalledWith({
        pullRequestId: prItem.id,
        repoId: prItem.repoId,
        requestedReviewers: [],
      });
    });
  });
});
