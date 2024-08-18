require("dotenv").config({ path: ".env.e2e" });
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { GithubWebhookBody } from "./github/webhooks";
import { safeFetchRepository } from "./dynamodb/fetchers/repositories";
import {
  Organization,
  Repository,
  SlackIntegration,
} from "@core/dynamodb/entities/types";
import { fetchOrganizationById } from "./dynamodb/fetchers/organizations";
import { getSlackInstallationsForOrganization } from "./dynamodb/fetchers/slack";

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

  it("should post messages to slack", () => {
    const prOpenedMessage = mock<GithubWebhookBody>({
      action: "opened",
    });
  });
});
