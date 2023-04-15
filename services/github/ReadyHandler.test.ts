import { PullRequestOpenedEvent } from "@octokit/webhooks-types";
import { ChatPostMessageResponse } from "@slack/web-api";
import { SupabaseClient } from "@supabase/supabase-js";
import { Db } from "services/db";
import { SlackClient } from "services/slack/SlackClient";
import { Mock, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { ReadyHandler } from "./ReadyHandler";

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
  Db.prototype.getThreadTs = vi.fn((arg: unknown) => ({
    data: null,
    error: null,
  }));
  Db.prototype.insertPullRequest = vi.fn(() => {});

  return { Db };
});

vi.mock("@slack/web-api", () => {
  const WebClient = vi.fn(() => {});
  return { WebClient };
});

vi.mock("services/utils/apiUtils", () => {
  return {
    getInstallationAccessToken: vi.fn(() => "access-token"),
  };
});

vi.mock("services/slack/SlackClient", () => {
  const SlackClient = vi.fn();
  SlackClient.prototype.postMessage = vi.fn(() => {});
  SlackClient.prototype.postPrReady = vi.fn(() => {});
  SlackClient.prototype.createNewThread = vi.fn(() => {});
  return { SlackClient };
});

describe("ReadyHandler", () => {
  const organizationId = "organizationId";
  const installationId = 1234;

  let slackClient: SlackClient;

  beforeEach(() => {
    slackClient = new SlackClient("channelId", "slackToken");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should handle a new pull request event", async () => {
    const mockPullRequestEvent = mock<PullRequestOpenedEvent>();
    mockPullRequestEvent.action = "opened";
    const mockedPullRequest = mock<PullRequestOpenedEvent["pull_request"]>();
    mockedPullRequest.draft = false;
    mockedPullRequest.requested_reviewers = [];
    mockPullRequestEvent.pull_request = mockedPullRequest;

    const supabaseClient = new SupabaseClient("abc", "123");
    const database = new Db(supabaseClient);

    const readyHandler = new ReadyHandler(
      database,
      slackClient,
      organizationId,
      () => Promise.resolve("slackUserName"),
      installationId,
    );

    const mockedChatResponse = mock<ChatPostMessageResponse>();
    mockedChatResponse.ts = "1234";
    (slackClient.postPrReady as Mock).mockResolvedValueOnce(mockedChatResponse);

    await readyHandler.handleNewPr(1, mockPullRequestEvent);

    expect(slackClient.postPrReady).toHaveBeenCalledTimes(1);
    expect(database.insertPullRequest).toHaveBeenCalledTimes(1);
  });
});
