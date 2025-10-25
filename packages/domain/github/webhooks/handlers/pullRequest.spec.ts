import { PullRequestItem } from "@core/dynamodb/entities/types";
import { fetchPrItem, updatePullRequest } from "@domain/dynamodb/fetchers/pullRequests";
import { SlackClient } from "@domain/slack/SlackClient";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { handlePullRequestEvent } from "./pullRequest";
import { getSlackUserName } from "./shared";
import { convertPrEventToBaseProps } from "./utils";

vi.mock("sst", () => ({
  Resource: {
    MainTable: {
      name: "test-table",
    },
  },
}));

// Mock dependencies
vi.mock("./shared", () => ({
  getSlackUserName: vi.fn(),
}));

vi.mock("@domain/dynamodb/fetchers/pullRequests", () => ({
  fetchPrItem: vi.fn(),
  updatePullRequest: vi.fn(),
}));

describe("handlePullRequestEvent", () => {
  let mockSlackClient: SlackClient;
  let mockEvent: any;
  let prItem: PullRequestItem;

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

    prItem = mock<PullRequestItem>({
      threadTs: "thread-ts-123",
    });

    vi.mocked(getSlackUserName).mockResolvedValue("@testuser");
    vi.mocked(fetchPrItem).mockResolvedValue(prItem);
  });

  it("should call slackClient.postMessage when review_request_removed", async () => {
    await handlePullRequestEvent({
      event: mockEvent,
      slackClient: mockSlackClient,
      organizationId: 789,
      installationId: 101112,
    });

    expect(fetchPrItem).toHaveBeenCalledWith({
      pullRequestId: 123,
      repoId: 456,
    });

    expect(getSlackUserName).toHaveBeenCalledWith("testuser", expect.any(Object));

    expect(mockSlackClient.postMessage).toHaveBeenCalledWith({
      message: {
        text: "Review request for @testuser removed",
      },
      threadTs: "thread-ts-123",
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
        pullRequestId: prItem.prId,
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
        pullRequestId: prItem.prId,
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
    it("should clear queue status when PR is merged", async () => {
      const queuedPrItem = mock<PullRequestItem>({
        ...prItem,
        isQueuedToMerge: true,
      });
      vi.mocked(fetchPrItem).mockResolvedValue(queuedPrItem);

      const mockSlackClientWithMerged = {
        ...mockSlackClient,
        postPrMerged: vi.fn(),
      } as unknown as SlackClient;

      const mergedEvent = {
        ...mockEvent,
        action: "closed",
        pull_request: {
          ...mockEvent.pull_request,
          merged: true,
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
        pullRequestId: queuedPrItem.prId,
        repoId: queuedPrItem.repoId,
        isQueuedToMerge: false,
      });

      expect(mockSlackClientWithMerged.postPrMerged).toHaveBeenCalledWith(
        {
          body: mergedEvent,
          threadTs: "thread-ts-123",
          slackUsername: "@testuser",
          pullRequestItem: { ...queuedPrItem, isQueuedToMerge: false },
          requiredApprovals: null,
        },
        "@testuser",
      );
    });

    it("should handle closed PR without clearing queue status when not merged", async () => {
      const mockSlackClientWithClosed = {
        ...mockSlackClient,
        postPrClosed: vi.fn(),
      } as unknown as SlackClient;

      const closedEvent = {
        ...mockEvent,
        action: "closed",
        pull_request: {
          ...mockEvent.pull_request,
          merged: false,
        },
        sender: {
          login: "testuser",
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
          slackUsername: "@testuser",
          pullRequestItem: prItem,
          requiredApprovals: null,
        },
        "@testuser",
      );
    });
  });
});
