import { SlackClient } from "@domain/slack/SlackClient";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { handlePullRequestEvent } from "./pullRequest";
import { getSlackUserName } from "./shared";
import { mock } from "vitest-mock-extended";
import { fetchPrItem } from "@domain/dynamodb/fetchers/pullRequests";
import { PullRequestItem } from "@core/dynamodb/entities/types";

vi.mock("sst/node/table", () => ({
  Table: {
    main: {
      tableName: "mock-table-name",
    },
  },
}));

// Mock dependencies
vi.mock("./shared", () => ({
  getSlackUserName: vi.fn(),
}));

vi.mock("@domain/dynamodb/fetchers/pullRequests", () => ({
  fetchPrItem: vi.fn(),
}));

describe("handlePullRequestEvent", () => {
  let mockSlackClient: SlackClient;
  let mockEvent: any;
  let prItem: PullRequestItem;

  beforeEach(() => {
    mockSlackClient = {
      postMessage: vi.fn(),
      updateMainPrMessage: vi.fn(),
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

  it("should call slackClient.updateMainPrMessage when edited", async () => {
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

    expect(mockSlackClient.updateMainPrMessage).toHaveBeenCalledWith({
      body: newMockEvent,
      threadTs: "thread-ts-123",
      slackUsername: "@testuser",
      pullRequestItem: prItem,
    });
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

    expect(mockSlackClient.updateMainPrMessage).not.toHaveBeenCalled();
  });
});
