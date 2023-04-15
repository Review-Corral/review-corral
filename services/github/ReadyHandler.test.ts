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

  let database: Db;
  let slackClient: SlackClient;
  let readyHandler: ReadyHandler;

  beforeEach(() => {
    database = new Db(new SupabaseClient("abc", "123"));

    slackClient = new SlackClient("channelId", "slackToken");
    readyHandler = new ReadyHandler(
      database,
      slackClient,
      organizationId,
      () => Promise.resolve("slackUserName"),
      installationId,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should call to post a message and insert in database on new PR event", async () => {
    const mockPullRequestEvent = mock<PullRequestOpenedEvent>({
      action: "opened",
    });

    const mockedPullRequest = mock<PullRequestOpenedEvent["pull_request"]>({
      draft: false,
      requested_reviewers: [],
    });
    mockPullRequestEvent.pull_request = mockedPullRequest;

    const mockedChatResponse = mock<ChatPostMessageResponse>({
      ts: "1234",
    });
    (slackClient.postPrReady as Mock).mockResolvedValueOnce(mockedChatResponse);

    await readyHandler.handleNewPr(1, mockPullRequestEvent);

    expect(slackClient.postPrReady).toHaveBeenCalledTimes(1);
    expect(database.insertPullRequest).toHaveBeenCalledTimes(1);
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

    await readyHandler.handleNewPr(prId, mockPullRequestEvent);

    expect(slackClient.postPrReady).toHaveBeenCalledTimes(0);
    expect(database.insertPullRequest).toHaveBeenCalledTimes(1);
    expect(database.insertPullRequest).toHaveBeenCalledWith({
      organizationId,
      prId: prId.toString(),
      isDraft: true,
      threadTs: null,
    });
  });
});
