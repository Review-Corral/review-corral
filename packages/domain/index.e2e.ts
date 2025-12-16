require("dotenv").config({ path: ".env.e2e" });
import { vi } from "vitest";

// Mock SST Resources before any imports that use it
vi.mock("sst", () => ({
  Resource: {
    NEON_DATABASE_URL: {
      value: "postgresql://test:test@localhost:5432/test",
    },
  },
}));

// Mock Postgres client to prevent actual database connections
vi.mock("@domain/postgres/client", () => ({
  db: {},
}));

import {
  Organization,
  Repository,
  SlackIntegration,
} from "@domain/postgres/schema";
import { PullRequestWithAlias } from "@domain/postgres/fetchers/pull-requests";
import {
  IssueCommentCreatedEvent,
  IssueCommentEvent,
  PullRequestClosedEvent,
  PullRequestOpenedEvent,
  PullRequestReviewCommentCreatedEvent,
  PullRequestReviewRequestedEvent,
  PullRequestReviewSubmittedEvent,
} from "@octokit/webhooks-types";
import { describe, it } from "vitest";
import { mock } from "vitest-mock-extended";
import { getOrganization } from "./postgres/fetchers/organizations";
import {
  fetchPrItem,
  insertPullRequest,
} from "./postgres/fetchers/pull-requests";
import { safeFetchRepository } from "./postgres/fetchers/repositories";
import { getSlackInstallationsForOrganization } from "./postgres/fetchers/slack-integrations";
import {
  InstallationAccessTokenResponse,
  PullRequestInfoResponse,
} from "./github/endpointTypes";
import {
  getInstallationAccessToken,
  getNumberOfApprovals,
  getPullRequestInfo,
} from "./github/fetchers";
import { handleGithubWebhookEvent } from "./github/webhooks";
import {
  extractMentions,
  getDmAttachment,
  getSlackUserId,
  getSlackUserName,
} from "./github/webhooks/handlers/shared";
import { getPrCommentParticipants } from "./postgres/fetchers/pr-comment-participants";
import { getReviewThreadParticipants } from "./postgres/fetchers/review-thread-participants";
import { BaseGithubWebhookEventHanderArgs } from "./github/webhooks/types";
import { postCommentsForNewPR } from "./selectors/pullRequests/getCommentsForPr";
import { tryGetPrRequiredApprovalsCount } from "./selectors/pullRequests/getRequiredApprovals";

// To get this, run the test bellow to open a new PR and then look in the logs for the
// posted TS
let THREAD_TS = "1731871427.369019";

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
  scopes: "chat:write,channels:history,commands,users:read,chat:write.public,channels:join,im:write",
});

vi.mock("@domain/github/webhooks/handlers/shared", () => {
  return {
    getSlackUserName: vi.fn(),
    getSlackUserId: vi.fn(),
    getDmAttachment: vi.fn(),
    extractMentions: vi.fn(),
  };
});

vi.mock("@domain/postgres/fetchers/pr-comment-participants", () => {
  return {
    getPrCommentParticipants: vi.fn(),
    addPrCommentParticipant: vi.fn(),
  };
});

vi.mock("@domain/postgres/fetchers/review-thread-participants", () => {
  return {
    getReviewThreadParticipants: vi.fn(),
    addReviewThreadParticipant: vi.fn(),
  };
});

vi.mock("@domain/postgres/fetchers/pull-requests", () => {
  return {
    fetchPrItem: vi.fn(),
    insertPullRequest: vi.fn(),
    updatePullRequest: vi.fn(),
  };
});
vi.mocked(insertPullRequest).mockImplementation((args) => {
  // Save the threadTs so it will be used by other calls
  if (args.threadTs) {
    THREAD_TS = args.threadTs;
  }

  // Typing is weird here
  return Promise.resolve(args as any);
});

vi.mocked(getSlackUserName).mockImplementation(getSlackUserNameMocked);
vi.mocked(getSlackUserId).mockImplementation(async (githubLogin) => {
  switch (githubLogin) {
    case "michael":
      return "U081WKT1AUQ";
    case "jim":
      return "U07GB8TBX53";
    case "dwight":
      return "U07J1FWJUQ0";
    default:
      return null;
  }
});
vi.mocked(getDmAttachment).mockReturnValue({
  color: "#fff",
  blocks: [],
});
vi.mocked(extractMentions).mockReturnValue([]);
vi.mocked(getPrCommentParticipants).mockResolvedValue([]);
vi.mocked(getReviewThreadParticipants).mockResolvedValue([]);
vi.mocked(fetchPrItem).mockResolvedValue(
  mock<PullRequestWithAlias>({
    threadTs: THREAD_TS,
  }),
);

vi.mock("@domain/selectors/pullRequests/getCommentsForPr", () => {
  return {
    postCommentsForNewPR: vi.fn(),
  };
});
vi.mocked(postCommentsForNewPR).mockResolvedValue();

vi.mock("@domain/dynamodb/client", () => {
  return {
    Db: vi.fn(),
  };
});
vi.mock("@domain/github/fetchers", () => {
  return {
    getInstallationAccessToken: vi.fn(),
    getPullRequestInfo: vi.fn(),
    getNumberOfApprovals: vi.fn(),
  };
});
const mockedInstallationAccessToken = mock<InstallationAccessTokenResponse>({
  token: "test",
  expires_at: "test",
});
vi.mocked(getInstallationAccessToken).mockResolvedValue(mockedInstallationAccessToken);

vi.mock("@domain/postgres/fetchers/repositories", () => {
  return {
    safeFetchRepository: vi.fn(),
  };
});
vi.mocked(safeFetchRepository).mockResolvedValue(mockRepo);

vi.mock("@domain/postgres/fetchers/organizations", () => {
  return {
    getOrganization: vi.fn(),
  };
});
vi.mocked(getOrganization).mockResolvedValue(mockedOrg);

vi.mock("@domain/postgres/fetchers/slack-integrations", () => {
  return {
    getSlackInstallationsForOrganization: vi.fn(),
    updateLastChecked: vi.fn(),
  };
});
vi.mocked(getSlackInstallationsForOrganization).mockResolvedValue([
  mockedSlackIntegration,
]);

vi.mock("@domain/selectors/pullRequests/getRequiredApprovals", () => {
  return {
    tryGetPrRequiredApprovalsCount: vi.fn(),
  };
});
vi.mocked(tryGetPrRequiredApprovalsCount).mockResolvedValue({ count: 2 });

async function getSlackUserNameMocked(
  githubLogin: string,
  _props: Pick<BaseGithubWebhookEventHanderArgs, "organizationId">,
): Promise<string> {
  switch (githubLogin) {
    case "michael":
      return "<@U081WKT1AUQ>";
    case "jim":
      return "<@U07GB8TBX53>";
    case "dwight":
      return "<@U07J1FWJUQ0>";
    default:
      console.error(`getSlackUserNameMocked not implemented for ${githubLogin}`);
  }

  return githubLogin;
}

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
  michael: mock<IssueCommentEvent["comment"]["user"]>({
    login: "michael",
    avatar_url:
      "https://static1.srcdn.com/wordpress/wp-content/uploads/2023/01/steve-carell-as-michael-scott-with-the-cast-of-the-office.jpg?q=50&fit=crop&w=1140&h=&dpr=1.5",
  }),
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
  merged: false,
  closed_at: null,
  number: 340,
  additions: 432,
  deletions: 12,
  user: users.michael,
  title: "Add 'Dundie Awards' recepients to marketing site",
  body: "Adds a new page to the marketing site showcasing the 2024 Dundie Award winners, at `/about/dundie-awards`",
  html_url: "https://github.com/test/test/pull/340",
  requested_reviewers: [],
};

const pullRequestMock = mock<PullRequestOpenedEvent["pull_request"]>({
  ...basePrData,
  base: mock<PullRequestOpenedEvent["pull_request"]["base"]>({
    ref: "main",
  }),
});

vi.mocked(getPullRequestInfo).mockResolvedValue(
  mock<PullRequestInfoResponse>({
    ...basePrData,
    base: {
      repo: {
        full_name: "Dunder Mifflin",
        owner: {
          avatar_url:
            "https://logos-world.net/wp-content/uploads/2022/02/Dunder-Mifflin-Logo.png",
        },
      },
      ref: "main",
    },
  }),
);

describe("chained e2e events", () => {
  it("message chain", { timeout: 1000 * 60 * 5 }, async () => {
    const events = [
      {
        event: mock<PullRequestOpenedEvent>({
          action: "opened",
          pull_request: pullRequestMock,
          repository: repositoryMock,
        }),
        eventName: "pull_request",
      },
      () => {
        vi.mocked(fetchPrItem).mockResolvedValue(
          mock<PullRequestWithAlias>({
            threadTs: THREAD_TS,
            requiredApprovals: 2,
          }),
        );
      },
      {
        event: mock<PullRequestReviewRequestedEvent>({
          action: "review_requested",
          requested_reviewer: users.jim,
          repository: repositoryMock,
          pull_request: pullRequestMock,
        }),
        eventName: "pull_request",
      },
      () => {
        vi.mocked(getNumberOfApprovals).mockResolvedValue(1);
      },
      {
        event: mock<PullRequestReviewSubmittedEvent>({
          action: "submitted",
          sender: users.jim,
          review: mock<PullRequestReviewSubmittedEvent["review"]>({
            id: 123,
            body: "I don't think we should do this...",
            user: users.michael,
            state: "commented",
          }),
          pull_request: mock<PullRequestReviewSubmittedEvent["pull_request"]>({
            id: pullRequestMock.id,
          }),
          repository: repositoryMock,
        }),
        eventName: "pull_request_review",
      },
      {
        event: mock<PullRequestReviewSubmittedEvent>({
          action: "submitted",
          sender: users.dwight,
          review: mock<PullRequestReviewSubmittedEvent["review"]>({
            id: 123,
            body: "Yes!",
            user: users.dwight,
            state: "approved",
          }),
          pull_request: mock<PullRequestReviewSubmittedEvent["pull_request"]>({
            id: 123,
            user: users.michael,
          }),
          repository: repositoryMock,
        }),
        eventName: "pull_request_review",
      },
    ];

    for (const event of events) {
      if (typeof event === "function") {
        await event();
      } else {
        console.log("threadTs", THREAD_TS);
        await handleGithubWebhookEvent({
          event: event.event as any,
          eventName: event.eventName,
        });
      }
    }
  });
});

/**
 * These 'tests' aren't actually meant to pass. They're just used to invoke the code
 * with some minimal data and see it in Slack.
 */
describe("end-to-end tests", () => {
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
        id: 1,
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
    vi.mocked(getNumberOfApprovals).mockResolvedValue(1);

    const reviewCommentMessage = mock<PullRequestReviewCommentCreatedEvent>({
      action: "created",
      sender: users.jim,
      comment: mock<PullRequestReviewCommentCreatedEvent["comment"]>({
        html_url: "https://github.com/test/test/pull/1",
        id: 2,
        body: "Can I be removed from this list?",
        user: users.jim,
      }),
      pull_request: mock<PullRequestReviewCommentCreatedEvent["pull_request"]>({
        id: 2,
      }),
      repository: repositoryMock,
    });

    await handleGithubWebhookEvent({
      event: reviewCommentMessage as any,
      eventName: "pull_request_review_comment",
    });
  });

  it("should post requested changes", async () => {
    const prOpenedMessage = mock<PullRequestReviewSubmittedEvent>({
      action: "submitted",
      sender: users.jim,
      review: mock<PullRequestReviewSubmittedEvent["review"]>({
        id: 123,
        body: "Can I be removed from this list please?",
        user: users.jim,
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
        body: "Yes!",
        user: users.dwight,
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
        closed_at: "2024-11-17T15:00:00Z",
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
        closed_at: "2024-11-17T15:00:00Z",
      }),
      repository: repositoryMock,
    });

    await handleGithubWebhookEvent({
      event: prOpenedMessage as any,
      eventName: "pull_request",
    });
  });
});
