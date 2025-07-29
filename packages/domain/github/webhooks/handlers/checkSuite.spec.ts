import { PullRequestItem } from "@core/dynamodb/entities/types";
import { fetchPrItem } from "@domain/dynamodb/fetchers/pullRequests";
import { aggregateCheckStatus } from "@domain/github/checkStatus";
import {
  getInstallationAccessToken,
  getPullRequestCheckRuns,
  getPullRequestInfo,
} from "@domain/github/fetchers";
import { SlackClient } from "@domain/slack/SlackClient";
import { CheckSuiteEvent } from "@octokit/webhooks-types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { BaseGithubWebhookEventHanderArgs } from "../types";
import { handleCheckSuiteEvent } from "./checkSuite";
import { getSlackUserName } from "./shared";

// Mock dependencies
vi.mock("@domain/dynamodb/fetchers/pullRequests");
vi.mock("@domain/github/fetchers");
vi.mock("@domain/github/checkStatus");
vi.mock("./shared");

// Mock SST resources
vi.mock("sst", () => ({
  Resource: {
    MainTable: { name: "test-table" },
  },
}));

const mockFetchPrItem = vi.mocked(fetchPrItem);
const mockGetInstallationAccessToken = vi.mocked(getInstallationAccessToken);
const mockGetPullRequestCheckRuns = vi.mocked(getPullRequestCheckRuns);
const mockGetPullRequestInfo = vi.mocked(getPullRequestInfo);
const mockAggregateCheckStatus = vi.mocked(aggregateCheckStatus);
const mockGetSlackUserName = vi.mocked(getSlackUserName);

describe("handleCheckSuiteEvent", () => {
  let mockSlackClient: SlackClient;
  let mockProps: BaseGithubWebhookEventHanderArgs;
  let mockPayload: CheckSuiteEvent;
  let mockPullRequestItem: PullRequestItem;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSlackClient = mock<SlackClient>();
    mockProps = {
      slackClient: mockSlackClient,
      organizationId: 123,
      installationId: 456,
    };

    mockPullRequestItem = mock<PullRequestItem>({
      threadTs: "thread-ts-123",
      requiredApprovals: 2,
    });

    mockPayload = {
      action: "completed",
      check_suite: {
        id: 789,
        head_sha: "abc123",
        pull_requests: [
          {
            id: 101,
            url: "https://api.github.com/repos/test/repo/pulls/1",
          },
        ],
      },
      repository: {
        id: 456,
        name: "repo",
        full_name: "test/repo",
        owner: {
          login: "test",
          avatar_url: "https://github.com/test.png",
        },
      },
      sender: {
        login: "testuser",
      },
    } as CheckSuiteEvent;

    mockFetchPrItem.mockResolvedValue(mockPullRequestItem);
    mockGetSlackUserName.mockResolvedValue("@testuser");
    mockGetInstallationAccessToken.mockResolvedValue({
      token: "access-token",
      expires_at: "2024-01-01T00:00:00Z",
    });
    mockGetPullRequestInfo.mockResolvedValue({
      title: "Test PR",
      number: 1,
      html_url: "https://github.com/test/repo/pull/1",
      body: "Test PR body",
      user: {
        login: "testuser",
        avatar_url: "https://github.com/testuser.png",
      },
      additions: 10,
      deletions: 5,
      base: {
        ref: "main",
      },
      merged: false,
      draft: false,
      closed_at: null,
    } as any);
    mockGetPullRequestCheckRuns.mockResolvedValue({
      total_count: 3,
      check_runs: [],
    });
    mockAggregateCheckStatus.mockReturnValue({
      total: 3,
      pending: 0,
      success: 3,
      failure: 0,
    });
  });

  it("should ignore non-completed check suite actions", async () => {
    const payload = { ...mockPayload, action: "requested" } as CheckSuiteEvent;

    await handleCheckSuiteEvent({
      event: payload,
      ...mockProps,
    });

    expect(mockFetchPrItem).not.toHaveBeenCalled();
    expect(mockSlackClient.updateMainMessage).not.toHaveBeenCalled();
  });

  it("should ignore check suites not associated with PRs", async () => {
    const payload = {
      ...mockPayload,
      check_suite: { ...mockPayload.check_suite, pull_requests: [] },
    } as CheckSuiteEvent;

    await handleCheckSuiteEvent({
      event: payload,
      ...mockProps,
    });

    expect(mockFetchPrItem).not.toHaveBeenCalled();
    expect(mockSlackClient.updateMainMessage).not.toHaveBeenCalled();
  });

  it("should ignore PRs without thread timestamps", async () => {
    mockFetchPrItem.mockResolvedValue(null);

    await handleCheckSuiteEvent({
      event: mockPayload,
      ...mockProps,
    });

    expect(mockSlackClient.updateMainMessage).not.toHaveBeenCalled();
  });

  it("should update main message with check status when check suite completes", async () => {
    await handleCheckSuiteEvent({
      event: mockPayload,
      ...mockProps,
    });

    expect(mockFetchPrItem).toHaveBeenCalledWith({
      pullRequestId: 101,
      repoId: 456,
    });

    expect(mockGetInstallationAccessToken).toHaveBeenCalledWith(456);
    expect(mockGetPullRequestCheckRuns).toHaveBeenCalledWith({
      repoOwner: "test",
      repoName: "repo",
      sha: "abc123",
      accessToken: "access-token",
    });

    expect(mockSlackClient.updateMainMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        threadTs: "thread-ts-123",
        slackUsername: "@testuser",
        checkStatus: {
          total: 3,
          pending: 0,
          success: 3,
          failure: 0,
        },
      }),
      "check-suite-completed",
    );
  });

  it("should handle API errors gracefully and still update message", async () => {
    mockGetPullRequestCheckRuns.mockRejectedValue(new Error("API Error"));

    await handleCheckSuiteEvent({
      event: mockPayload,
      ...mockProps,
    });

    expect(mockSlackClient.updateMainMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        checkStatus: null,
      }),
      "check-suite-completed",
    );
  });
});
