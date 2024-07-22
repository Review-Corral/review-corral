import { describe, it, expect, vi, beforeEach } from "vitest";
import { handlePullRequestEvent } from "./pullRequest";
import { SlackClient } from "@domain/slack/SlackClient";
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
    } as unknown as SlackClient;

    mockEvent = {
      action: "review_request_removed",
      pull_request: {
        id: 123,
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
});
