require("dotenv").config({ path: ".env.e2e" });
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { GithubWebhookBody, handleGithubWebhookEvent } from "./github/webhooks";
import { safeFetchRepository } from "./dynamodb/fetchers/repositories";
import {
  Organization,
  Repository,
  SlackIntegration,
} from "@core/dynamodb/entities/types";
import { fetchOrganizationById } from "./dynamodb/fetchers/organizations";
import { getSlackInstallationsForOrganization } from "./dynamodb/fetchers/slack";
import { PullRequestOpenedEvent } from "@octokit/webhooks-types";
import { getSlackUserName } from "./github/webhooks/handlers/shared";

const mockedOrg = mock<Organization>({
  orgId: 123,
});

const mockRepo = mock<Repository>({
  orgId: mockedOrg.orgId,
  repoId: 456,
  isEnabled: true,
});

const slackChannelId = process.env.SLACK_CHANNEL_ID;
if (!slackChannelId) {
  throw new Error("SLACK_CHANNEL_ID is not set");
}

const slackAccessToken = process.env.SLACK_ACCESS_TOKEN;
if (!slackAccessToken) {
  throw new Error("SLACK_ACCESS_TOKEN is not set");
}

const mockedSlackIntegration = mock<SlackIntegration>({
  channelId: slackChannelId,
  accessToken: slackAccessToken,
});

describe("end-to-end tests", () => {
  beforeEach(() => {
    vi.mock("@domain/github/webhooks/handlers/shared", () => {
      return {
        getSlackUserName: vi.fn(),
        getThreadTs: vi.fn(),
      };
    });

    vi.mocked(getSlackUserName).mockResolvedValue("<@U07GB8TBX53>");

    vi.mock("@domain/dynamodb/client", () => {
      return {
        Db: vi.fn(),
      };
    });
    vi.mock("@domain/dynamodb/fetchers/repositories", () => {
      return {
        safeFetchRepository: vi.fn(),
      };
    });

    vi.mocked(safeFetchRepository).mockResolvedValue(mockRepo);

    vi.mock("@domain/dynamodb/fetchers/organizations", () => {
      return {
        fetchOrganizationById: vi.fn(),
      };
    });

    vi.mocked(fetchOrganizationById).mockResolvedValue(mockedOrg);

    // todo: return mocked org

    vi.mock("@domain/dynamodb/fetchers/slack", () => {
      return {
        getSlackInstallationsForOrganization: vi.fn(),
      };
    });

    vi.mocked(getSlackInstallationsForOrganization).mockResolvedValue([
      mockedSlackIntegration,
    ]);
  });

  it("should post messages to slack", async () => {
    const prOpenedMessage = mock<PullRequestOpenedEvent>({
      action: "opened",
      pull_request: mock<PullRequestOpenedEvent["pull_request"]>({
        id: 123,
        draft: false,
        number: 1,
        title: "Test PR",
        body: "Test PR body",
        html_url: "https://github.com/test/test/pull/1",
        additions: 432,
        deletions: 123,
        user: mock<PullRequestOpenedEvent["pull_request"]["user"]>({
          login: "jim",
          avatar_url: "https://cdn.mos.cms.futurecdn.net/ojTtHYLoiqG2riWm7fB9Gn.jpg",
        }),
        base: mock<PullRequestOpenedEvent["pull_request"]["base"]>({
          ref: "abc123",
        }),
      }),
      repository: mock<PullRequestOpenedEvent["repository"]>({
        id: mockRepo.repoId,
        full_name: "Dunder Mifflin",
        owner: {
          id: mockedOrg.orgId,
          avatar_url:
            "https://logos-world.net/wp-content/uploads/2022/02/Dunder-Mifflin-Logo.png",
        },
      }),
    });

    await handleGithubWebhookEvent({
      event: prOpenedMessage as any,
      eventName: "pull_request",
    });
  });
});
