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
import {
  IssueCommentCreatedEvent,
  IssueCommentEvent,
  PullRequestClosedEvent,
  PullRequestOpenedEvent,
  PullRequestReviewCommentCreatedEvent,
  PullRequestReviewCommentEvent,
  PullRequestReviewSubmittedEvent,
} from "@octokit/webhooks-types";
import { getSlackUserName, getThreadTs } from "./github/webhooks/handlers/shared";
import { getInstallationAccessToken, getPullRequestInfo } from "./github/fetchers";
import {
  InstallationAccessTokenResponse,
  PullRequestInfoResponse,
} from "./github/endpointTypes";
import { BaseGithubWebhookEventHanderArgs } from "./github/webhooks/types";

// To get this, run the test bellow to open a new PR and then look in the logs for the
// posted TS
const THREAD_TS = "1729134112.776569";

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

vi.mock("@domain/github/webhooks/handlers/shared", () => {
  return {
    getSlackUserName: vi.fn(),
    getThreadTs: vi.fn(),
  };
});

async function getSlackUserNameMocked(
  githubLogin: string,
  _props: Pick<BaseGithubWebhookEventHanderArgs, "organizationId">,
): Promise<string> {
  if (githubLogin === "jim") {
    return "<@U07GB8TBX53>";
  } else if (githubLogin === "dwight") {
    return "<@U07J1FWJUQ0>";
  } else {
    console.error(`getSlackUserNameMocked not implemented for ${githubLogin}`);
  }

  return githubLogin;
}

vi.mocked(getSlackUserName).mockImplementation(getSlackUserNameMocked);
vi.mocked(getThreadTs).mockResolvedValue(THREAD_TS);

vi.mock("@domain/dynamodb/client", () => {
  return {
    Db: vi.fn(),
  };
});
vi.mock("@domain/github/fetchers", () => {
  return {
    getInstallationAccessToken: vi.fn(),
    getPullRequestInfo: vi.fn(),
  };
});
const mockedInstallationAccessToken = mock<InstallationAccessTokenResponse>({
  token: "test",
  expires_at: "test",
});
vi.mocked(getInstallationAccessToken).mockResolvedValue(mockedInstallationAccessToken);

vi.mocked(getPullRequestInfo).mockResolvedValue(
  mock<PullRequestInfoResponse>({
    id: 123,
  }),
);

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

/**
 * These 'tests' aren't actually meant to pass. They're just used to invoke the code
 * with some minimal data and see it in Slack.
 */
describe("end-to-end tests", () => {
  beforeEach(() => {});
  const repositoryMock = mock<PullRequestOpenedEvent["repository"]>({
    id: mockRepo.repoId,
    full_name: "Dunder Mifflin",
    owner: {
      id: mockedOrg.orgId,
      avatar_url:
        "https://logos-world.net/wp-content/uploads/2022/02/Dunder-Mifflin-Logo.png",
    },
  });

  const users = {
    jim: mock<IssueCommentEvent["comment"]["user"]>({
      login: "jim",
      avatar_url: "https://cdn.mos.cms.futurecdn.net/ojTtHYLoiqG2riWm7fB9Gn.jpg",
    }),
    dwight: mock<IssueCommentEvent["comment"]["user"]>({
      login: "dwight",
      avatar_url:
        "https://www.myany.city/sites/default/files/styles/scaled_cropped_medium__260x260/public/field/image/node-related-images/sample-dwight-k-schrute.jpg",
    }),
  } as const;

  const basePrData = {
    id: 123,
    draft: false,
    number: 1,
    title: "Test PR",
    body: "Test PR body",
    html_url: "https://github.com/test/test/pull/1",
  };

  const pullRequestMock = mock<PullRequestOpenedEvent["pull_request"]>({
    ...basePrData,
    additions: 432,
    deletions: 123,
    user: users.jim,
    base: mock<PullRequestOpenedEvent["pull_request"]["base"]>({
      ref: "main",
    }),
  });

  it("should post messages to slack", async () => {
    const prOpenedMessage = mock<PullRequestOpenedEvent>({
      action: "opened",
      pull_request: pullRequestMock,
      repository: repositoryMock,
    });

    await handleGithubWebhookEvent({
      event: prOpenedMessage as any,
      eventName: "pull_request",
    });
  });

  it("should post a message when the PR has been replied to", async () => {
    const prOpenedMessage = mock<IssueCommentCreatedEvent>({
      action: "created",
      sender: users.dwight,
      comment: mock<IssueCommentCreatedEvent["comment"]>({
        id: 123,
        body: "Hey, this is a reply!",
      }),
      issue: mock<IssueCommentCreatedEvent["issue"]>({
        pull_request: mock<IssueCommentCreatedEvent["issue"]["pull_request"]>({
          ...basePrData,
        }),
      }),
      repository: repositoryMock,
    });

    await handleGithubWebhookEvent({
      event: prOpenedMessage as any,
      eventName: "issue_comment",
    });
  });

  it("should post a review comment", async () => {
    const prOpenedMessage = mock<PullRequestReviewCommentCreatedEvent>({
      action: "created",
      comment: mock<PullRequestReviewCommentCreatedEvent["comment"]>({
        html_url: "https://github.com/test/test/pull/1",
        id: 123,
        body: "This looks interesting!",
        user: users.jim,
      }),
      pull_request: mock<PullRequestReviewCommentCreatedEvent["pull_request"]>({
        id: 123,
      }),
      repository: repositoryMock,
    });

    await handleGithubWebhookEvent({
      event: prOpenedMessage as any,
      eventName: "pull_request_review_comment",
    });
  });

  it("should post requested changes", async () => {
    const prOpenedMessage = mock<PullRequestReviewSubmittedEvent>({
      action: "submitted",
      review: mock<PullRequestReviewSubmittedEvent["review"]>({
        id: 123,
        body: "Looks good overall, but a couple of things need to be changed",
        user: mock<PullRequestReviewSubmittedEvent["review"]["user"]>({
          type: "User",
          login: "jim",
          avatar_url: "https://cdn.mos.cms.futurecdn.net/ojTtHYLoiqG2riWm7fB9Gn.jpg",
        }),
        state: "changes_requested",
      }),
      pull_request: mock<PullRequestReviewSubmittedEvent["pull_request"]>({
        id: 123,
      }),
      repository: repositoryMock,
    });

    await handleGithubWebhookEvent({
      event: prOpenedMessage as any,
      eventName: "pull_request_review",
    });
  });

  it("should post pull request approved", async () => {
    const prOpenedMessage = mock<PullRequestReviewSubmittedEvent>({
      action: "submitted",
      review: mock<PullRequestReviewSubmittedEvent["review"]>({
        id: 123,
        body: "Looks good to me!",
        user: mock<PullRequestReviewSubmittedEvent["review"]["user"]>({
          type: "User",
          login: "jim",
          avatar_url: "https://cdn.mos.cms.futurecdn.net/ojTtHYLoiqG2riWm7fB9Gn.jpg",
        }),
        state: "approved",
      }),
      pull_request: mock<PullRequestReviewSubmittedEvent["pull_request"]>({
        id: 123,
      }),
      repository: repositoryMock,
    });

    await handleGithubWebhookEvent({
      event: prOpenedMessage as any,
      eventName: "pull_request_review",
    });
  });

  it("should post pull request merged", async () => {
    const prOpenedMessage = mock<PullRequestClosedEvent>({
      action: "closed",
      pull_request: mock<PullRequestClosedEvent["pull_request"]>({
        ...basePrData,
        additions: 432,
        deletions: 123,
        user: mock<PullRequestOpenedEvent["pull_request"]["user"]>({
          login: "jim",
          avatar_url: "https://cdn.mos.cms.futurecdn.net/ojTtHYLoiqG2riWm7fB9Gn.jpg",
        }),
        base: mock<PullRequestOpenedEvent["pull_request"]["base"]>({
          ref: "main",
        }),
        merged: true,
      }),
      repository: repositoryMock,
    });

    await handleGithubWebhookEvent({
      event: prOpenedMessage as any,
      eventName: "pull_request",
    });
  });

  it("should post pull request closed", async () => {
    const prOpenedMessage = mock<PullRequestClosedEvent>({
      action: "closed",
      pull_request: mock<PullRequestClosedEvent["pull_request"]>({
        ...basePrData,
        additions: 432,
        deletions: 123,
        user: mock<PullRequestOpenedEvent["pull_request"]["user"]>({
          login: "jim",
          avatar_url: "https://cdn.mos.cms.futurecdn.net/ojTtHYLoiqG2riWm7fB9Gn.jpg",
        }),
        base: mock<PullRequestOpenedEvent["pull_request"]["base"]>({
          ref: "main",
        }),
        merged: false,
      }),
      repository: repositoryMock,
    });

    await handleGithubWebhookEvent({
      event: prOpenedMessage as any,
      eventName: "pull_request",
    });
  });
});
