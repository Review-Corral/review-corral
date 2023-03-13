import { PullRequestOpenedEvent } from "@octokit/webhooks-types";
import { WebClient } from "@slack/web-api";
import { SupabaseClient } from "@supabase/supabase-js";
import { mock } from "vitest-mock-extended";

import { Db } from "services/db";
import { describe, expect, it, vi } from "vitest";
import { GithubEventHandler } from "./GithubEventHandler";

describe("Github Event Handler tests", () => {
  it("fake test", () => {
    expect(true).toBeTruthy();
  });

  it("should handle a new pull request event", async () => {
    // TODO: can remove?
    vi.mock("./handlers", () => {
      return {
        success: vi.fn(),
        failure: vi.fn(),
      };
    });

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

    const supabaseClient = new SupabaseClient("abc", "123");
    const slackClient = new WebClient("fake-token");
    const datbase = new Db(supabaseClient);

    const handler = new GithubEventHandler(
      datbase,
      slackClient,
      "channelId",
      "slackToken",
      1234,
      "organizationId",
    );

    const handleNewPrSpy = vi.spyOn(handler, "handleNewPr");
    const handleOtherEventSpy = vi.spyOn(handler, "handleOtherEvent");

    const mockPullRequestEvent = mock<PullRequestOpenedEvent>();
    mockPullRequestEvent.action = "opened";
    const mockedPullRequest = mock<PullRequestOpenedEvent["pull_request"]>();
    mockedPullRequest.draft = false;
    mockPullRequestEvent.pull_request = mockedPullRequest;

    await handler.handleEvent(mockPullRequestEvent);

    expect(handleNewPrSpy).toHaveBeenCalledTimes(1);
    expect(handleOtherEventSpy).toHaveBeenCalledTimes(0);
  });
});
