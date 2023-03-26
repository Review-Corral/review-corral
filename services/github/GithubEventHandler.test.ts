import { PullRequestOpenedEvent } from "@octokit/webhooks-types";
import { SupabaseClient } from "@supabase/supabase-js";
import { mock } from "vitest-mock-extended";

import { Db } from "services/db";
import { SlackClient } from "services/slack/SlackClient";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GithubEventHandler } from "./GithubEventHandler";
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

describe("GithubEventHandler", () => {
  let handler: GithubEventHandler;
  let readyHandler: ReadyHandler;

  beforeEach(() => {});

  it("should handle a new pull request event", async () => {
    const supabaseClient = new SupabaseClient("abc", "123");
    const slackClient = new SlackClient("channelId", "slackToken");
    const database = new Db(supabaseClient);

    const organizationId = "organizationId";
    const installationId = 1234;

    readyHandler = new ReadyHandler(
      database,
      slackClient,
      organizationId,
      () => Promise.resolve("slackUserName"),
      installationId,
    );

    handler = new GithubEventHandler(
      database,
      slackClient,
      installationId,
      organizationId,
    );

    const handleOtherEventSpy = vi.spyOn(handler, "handleOtherEvent");

    const mockPullRequestEvent = mock<PullRequestOpenedEvent>();
    mockPullRequestEvent.action = "opened";
    const mockedPullRequest = mock<PullRequestOpenedEvent["pull_request"]>();
    mockedPullRequest.draft = false;
    mockPullRequestEvent.pull_request = mockedPullRequest;

    await handler.handleEvent(mockPullRequestEvent);

    expect(vi.isMockFunction(readyHandler.handleNewPr)).toBe(true);
    expect(readyHandler.handleNewPr).toHaveBeenCalledTimes(1);
  });
});
