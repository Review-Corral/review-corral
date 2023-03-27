import { PullRequestOpenedEvent } from "@octokit/webhooks-types";
import { SupabaseClient } from "@supabase/supabase-js";
import { Db } from "services/db";
import { SlackClient } from "services/slack/SlackClient";
import { afterEach, beforeEach, describe, it, vi } from "vitest";
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
  const Db = vi.fn(() => ({
    getThreadTs: vi.fn((arg: unknown) => ({
      data: null,
      error: null,
    })),
  }));
  return { Db };
});

vi.mock("@slack/web-api", () => {
  const WebClient = vi.fn(() => {});
  return { WebClient };
});

vi.mock("./ReadyHandler", () => {
  const ReadyHandler = vi.fn();

  ReadyHandler.prototype.handleNewPr = vi.fn(() => {
    console.log("hey called from the mock!");
  });

  return { ReadyHandler };
});

vi.mock("./SlackClient", () => {
  const SlackClient = vi.fn(() => ({
    postMessage: vi.fn(() => {}),
  }));

  return { SlackClient };
});

describe("ReadyHandler", () => {
  const organizationId = "organizationId";
  const installationId = 1234;

  let readyHandler: ReadyHandler;
  let slackClient: SlackClient;

  beforeEach(() => {
    const supabaseClient = new SupabaseClient("abc", "123");
    const database = new Db(supabaseClient);

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

  it("should handle a new pull request event", async () => {
    const mockPullRequestEvent = mock<PullRequestOpenedEvent>();
    mockPullRequestEvent.action = "opened";
    const mockedPullRequest = mock<PullRequestOpenedEvent["pull_request"]>();
    mockedPullRequest.draft = false;
    mockPullRequestEvent.pull_request = mockedPullRequest;

    await readyHandler.handleNewPr(1, mockPullRequestEvent);

    expect(slackClient.postMessage).toHaveBeenCalledTimes(1);
  });
});
