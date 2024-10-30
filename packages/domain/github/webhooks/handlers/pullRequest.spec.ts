import { SlackClient } from "@domain/slack/SlackClient";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { handlePullRequestEvent } from "./pullRequest";
import { getSlackUserName, getThreadTs } from "./shared";

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
  getThreadTs: vi.fn(),
}));

describe("handlePullRequestEvent", () => {
  let mockSlackClient: SlackClient;
  let mockEvent: any;

  beforeEach(() => {
    mockSlackClient = {
      postMessage: vi.fn(),
      postUpdatedPullRequest: vi.fn(),
    } as unknown as SlackClient;

    mockEvent = {
      action: "review_request_removed",
      pull_request: {
        id: 123,
        title: "I'm a PR title",
      },
      repository: {
        id: 456,
      },
      requested_reviewer: {
        login: "testuser",
      },
    };

    vi.mocked(getSlackUserName).mockResolvedValue("@testuser");
    vi.mocked(getThreadTs).mockResolvedValue("thread-ts-123");
  });

  it("should call slackClient.postMessage when review_request_removed", async () => {
    await handlePullRequestEvent({
      event: mockEvent,
      slackClient: mockSlackClient,
      organizationId: 789,
      installationId: 101112,
    });

    expect(getThreadTs).toHaveBeenCalledWith({
      prId: 123,
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

  it("should call slackClient.postUpdatedPullRequest when edited", async () => {
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

    expect(getThreadTs).toHaveBeenCalledWith({
      prId: 123,
      repoId: 456,
    });

    expect(mockSlackClient.postUpdatedPullRequest).toHaveBeenCalledWith({
      body: newMockEvent,
      threadTs: "thread-ts-123",
      slackUsername: "@testuser",
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

    expect(getThreadTs).toHaveBeenCalledWith({
      prId: 123,
      repoId: 456,
    });

    expect(mockSlackClient.postUpdatedPullRequest).not.toHaveBeenCalled();
  });
});
