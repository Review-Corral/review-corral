import { PullRequestOpenedEvent } from "@octokit/webhooks-types";
import { SupabaseClient } from "@supabase/supabase-js";
import { mock } from "vitest-mock-extended";

import { Db } from "services/db";
import { SlackClient } from "services/slack/SlackClient";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GithubEventHandler } from "./GithubEventHandler";
import { handlePrReady } from "./handlePrReady";

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

vi.mock("./handlePrReady", () => {
  return {
    handlePrReady: vi.fn(),
  };
});

vi.mock("./SlackClient", () => {
  const SlackClient = vi.fn(() => ({
    postMessage: vi.fn(() => {}),
  }));

  return { SlackClient };
});

describe("GithubEventHandler", () => {
  const organizationId = "organizationId";
  const installationId = 1234;

  let handler: GithubEventHandler;

  beforeEach(() => {
    const supabaseClient = new SupabaseClient("abc", "123");
    const slackClient = new SlackClient("channelId", "slackToken");
    const database = new Db(supabaseClient);

    handler = new GithubEventHandler(
      database,
      slackClient,
      installationId,
      organizationId,
    );
  });

  it("should handle a new pull request event", async () => {
    const handleOtherEventSpy = vi.spyOn(handler, "handleOtherEvent");

    const mockPullRequestEvent = mock<PullRequestOpenedEvent>({
      action: "opened",
    });

    const mockedPullRequest = mock<PullRequestOpenedEvent["pull_request"]>({
      draft: false,
    });
    mockPullRequestEvent.pull_request = mockedPullRequest;

    await handler.handleEvent(mockPullRequestEvent);

    expect(handlePrReady).toHaveBeenCalledTimes(1);
    expect(handleOtherEventSpy).toHaveBeenCalledTimes(0);
  });
});
