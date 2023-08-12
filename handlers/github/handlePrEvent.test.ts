import {
  PullRequestOpenedEvent,
  PullRequestReadyForReviewEvent,
} from "@octokit/webhooks-types";
import { ChatPostMessageResponse } from "@slack/web-api";
import { SupabaseClient } from "@supabase/supabase-js";
import { Db, PullRequestRow } from "services/db";
import { SlackClient } from "services/slack/SlackClient";
import { getInstallationAccessToken } from "services/utils/apiUtils";
import { Mock, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { handlePullRequestEvent } from "./handlePrEvent";
import { BaseGithubHanderProps } from "./shared";

vi.mock("@supabase/supabase-js", () => {
  const SupabaseClient = vi.fn(() => ({
    from: vi.fn((arg: string) => ({
      select: vi.fn((arg: string) => ({})),
    })),
  }));
  return { SupabaseClient };
});

vi.mock("services/db", () => {
  const Db = vi.fn();
  Db.prototype.getPullRequest = vi.fn((arg: unknown) => ({
    data: null,
    error: null,
  }));
  Db.prototype.insertPullRequest = vi.fn(() => {});
  Db.prototype.updatePullRequest = vi.fn(() => {});

  return { Db };
});

vi.mock("@slack/web-api", () => {
  const WebClient = vi.fn(() => {});
  return { WebClient };
});

vi.mock("./shared", () => ({
  getSlackUserName: vi.fn(() => "slackUserName"),
}));

vi.mock("services/utils/apiUtils", () => {
  return {
    getInstallationAccessToken: vi.fn(() => "access-token"),
  };
});

vi.mock("services/slack/SlackClient", () => {
  const SlackClient = vi.fn();
  SlackClient.prototype.postMessage = vi.fn(() => {});
  SlackClient.prototype.postPrReady = vi.fn(() => {});
  SlackClient.prototype.postReadyForReview = vi.fn(() => {});
  SlackClient.prototype.createNewThread = vi.fn(() => {});
  return { SlackClient };
});

describe("handlePrEvent", () => {
  const organizationId = "organizationId";
  const installationId = 1234;

  let database: Db;
  let slackClient: SlackClient;
  let baseProps: BaseGithubHanderProps;

  beforeEach(() => {
    database = new Db(new SupabaseClient("abc", "123"));

    slackClient = new SlackClient("channelId", "slackToken");
    baseProps = {
      database,
      slackClient,
      organizationId,
      installationId,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should call to post a message and insert in database on new PR event", async () => {
    const mockPullRequestEvent = mock<PullRequestOpenedEvent>({
      action: "opened",
    });

    const prId = 1234;

    const mockedPullRequest = mock<PullRequestOpenedEvent["pull_request"]>({
      id: prId,
      draft: false,
      requested_reviewers: [],
    });
    mockPullRequestEvent.pull_request = mockedPullRequest;

    const threadTs = "1234";
    const mockedChatResponse = mock<ChatPostMessageResponse>({
      ts: threadTs,
    });
    (slackClient.postPrReady as Mock).mockResolvedValueOnce(mockedChatResponse);

    await handlePullRequestEvent(mockPullRequestEvent, baseProps);

    expect(slackClient.postPrReady).toHaveBeenCalledTimes(1);
    expect(database.insertPullRequest).toHaveBeenCalledTimes(1);
    expect(database.insertPullRequest).toHaveBeenCalledWith({
      organization_id: organizationId,
      pr_id: prId.toString(),
      draft: false,
      thread_ts: threadTs,
    });
  });

  it("should NOT call to post a message but insert in database on new draft PR event", async () => {
    const mockPullRequestEvent = mock<PullRequestOpenedEvent>({
      action: "opened",
    });

    const prId = 1234;

    const mockedPullRequest = mock<PullRequestOpenedEvent["pull_request"]>({
      id: prId,
      draft: true,
      requested_reviewers: [],
    });
    mockPullRequestEvent.pull_request = mockedPullRequest;

    await handlePullRequestEvent(mockPullRequestEvent, baseProps);

    expect(slackClient.postPrReady).toHaveBeenCalledTimes(0);
    expect(database.insertPullRequest).toHaveBeenCalledTimes(1);
    expect(database.insertPullRequest).toHaveBeenCalledWith({
      organization_id: organizationId,
      pr_id: prId.toString(),
      draft: true,
      thread_ts: null,
    });
  });

  it("should get existing thread TS if one exists and post ready for review message", async () => {
    const mockPullRequestEvent = mock<PullRequestReadyForReviewEvent>({
      action: "ready_for_review",
    });

    const prId = 1234;
    const threadTs = "11111";

    (database.getPullRequest as Mock).mockResolvedValueOnce({
      data: mock<PullRequestRow>({ thread_ts: threadTs }),
    });

    const mockedPullRequest = mock<
      PullRequestReadyForReviewEvent["pull_request"]
    >({
      id: prId,
      draft: false,
      requested_reviewers: [],
    });
    mockPullRequestEvent.pull_request = mockedPullRequest;

    await handlePullRequestEvent(mockPullRequestEvent, baseProps);

    expect(slackClient.postPrReady).toHaveBeenCalledTimes(0);
    expect(database.insertPullRequest).toHaveBeenCalledTimes(0);
    expect(getInstallationAccessToken).toHaveBeenCalledTimes(0);
    expect(slackClient.postReadyForReview).toHaveBeenCalledTimes(1);
    expect(slackClient.postReadyForReview).toHaveBeenLastCalledWith({
      body: mockPullRequestEvent,
      threadTs: threadTs,
      slackUsername: "slackUserName",
    });
  });

  it("should update record with thread_ts if pull request record exists but not thread_ts", async () => {
    const mockPullRequestEvent = mock<PullRequestReadyForReviewEvent>({
      action: "ready_for_review",
    });

    const prId = 1234;

    const threadTs = "11111";

    // Simulate a record already existing in the database but without a thread_ts
    (database.getPullRequest as Mock).mockResolvedValueOnce({
      data: mock<ChatPostMessageResponse>({
        thread_ts: null,
      }),
    });

    (slackClient.postPrReady as Mock).mockResolvedValueOnce(
      mock<PullRequestRow>({
        pr_id: prId.toString(),
        thread_ts: threadTs,
      }),
    );

    const mockedPullRequest = mock<
      PullRequestReadyForReviewEvent["pull_request"]
    >({
      id: prId,
      draft: false,
      requested_reviewers: [],
    });
    mockPullRequestEvent.pull_request = mockedPullRequest;

    await handlePullRequestEvent(mockPullRequestEvent, baseProps);

    expect(database.insertPullRequest).toHaveBeenCalledTimes(0);
    expect(database.updatePullRequest).toHaveBeenCalledTimes(1);
    expect(getInstallationAccessToken).toHaveBeenCalledTimes(1);
    expect(slackClient.postPrReady).toHaveBeenCalledTimes(1);
    expect(slackClient.postReadyForReview).toHaveBeenCalledTimes(0);
    expect(slackClient.postPrReady).toHaveBeenLastCalledWith(
      mockPullRequestEvent,
      "slackUserName",
    );
  });
});
