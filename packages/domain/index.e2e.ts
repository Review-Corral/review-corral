require("dotenv").config({ path: ".env.e2e" });
import {
  Organization,
  Repository,
  SlackIntegration,
} from "./postgres/schema";
import { RepositoryWithAlias } from "./postgres/fetchers/repositories";
import {
  IssueCommentCreatedEvent,
  IssueCommentEvent,
  PullRequestClosedEvent,
  PullRequestOpenedEvent,
  PullRequestReviewCommentCreatedEvent,
  PullRequestReviewRequestedEvent,
  PullRequestReviewSubmittedEvent,
} from "@octokit/webhooks-types";
import { describe, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import {
  fetchPrItem,
  insertPullRequest,
  PullRequestWithAlias,
  updatePullRequest,
} from "./postgres/fetchers/pull-requests";
import { getOrganization } from "./postgres/fetchers/organizations";
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
import { getSlackUserId, getSlackUserName } from "./github/webhooks/handlers/shared";
import { BaseGithubWebhookEventHanderArgs } from "./github/webhooks/types";
import {
  addPrCommentParticipant,
  getPrCommentParticipants,
} from "./postgres/fetchers/pr-comment-participants";
import {
  addReviewThreadParticipant,
  getReviewThreadParticipants,
} from "./postgres/fetchers/review-thread-participants";
import { postCommentsForNewPR } from "./selectors/pullRequests/getCommentsForPr";
import { tryGetPrRequiredApprovalsCount } from "./selectors/pullRequests/getRequiredApprovals";

// To get this, run the test bellow to open a new PR and then look in the logs for the
// posted TS
let THREAD_TS = "1731871427.369019";

const mockedOrg = mock<Organization>({
  id: 123,
  installationId: 789,
});

const mockRepo = mock<RepositoryWithAlias>({
  id: 456,
  orgId: mockedOrg.id,
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
  scopes: "chat:write,im:write,users:read",
});

vi.mock("@domain/github/webhooks/handlers/shared", async (importOriginal) => {
  const original = await importOriginal<
    typeof import("./github/webhooks/handlers/shared")
  >();
  return {
    ...original,
    getSlackUserName: vi.fn(),
    getSlackUserId: vi.fn(),
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
vi.mocked(getSlackUserId).mockImplementation(getSlackUserIdMocked);
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
vi.mock("@domain/postgres/client", () => {
  return {
    db: vi.fn(),
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

vi.mock("@domain/postgres/fetchers/pr-comment-participants", () => {
  return {
    getPrCommentParticipants: vi.fn(),
    addPrCommentParticipant: vi.fn(),
  };
});
vi.mocked(getPrCommentParticipants).mockResolvedValue(["michael", "dwight"]);
vi.mocked(addPrCommentParticipant).mockResolvedValue();

vi.mock("@domain/postgres/fetchers/review-thread-participants", () => {
  return {
    getReviewThreadParticipants: vi.fn(),
    addReviewThreadParticipant: vi.fn(),
  };
});
vi.mocked(getReviewThreadParticipants).mockResolvedValue(["michael", "dwight"]);
vi.mocked(addReviewThreadParticipant).mockResolvedValue();

// Map of GitHub usernames to Slack user IDs. These IDs are used for both:
// 1. Formatting Slack mentions in channel messages (e.g., <@U081WKT1AUQ>)
// 2. Sending DMs to users during e2e tests
// To add a new user, find their Slack user ID in the Slack workspace
const slackUserIds: Record<string, string> = {
  michael: "U081WKT1AUQ",
  jim: "U07GB8TBX53",
  dwight: "U07J1FWJUQ0",
};

async function getSlackUserNameMocked(
  githubLogin: string,
  _props: Pick<BaseGithubWebhookEventHanderArgs, "organizationId">,
): Promise<string> {
  const slackId = slackUserIds[githubLogin];
  if (slackId) {
    return `<@${slackId}>`;
  }

  console.error(`getSlackUserNameMocked not implemented for ${githubLogin}`);
  return githubLogin;
}

async function getSlackUserIdMocked(
  githubLogin: string,
  _props: Pick<BaseGithubWebhookEventHanderArgs, "organizationId">,
): Promise<string | null> {
  const slackId = slackUserIds[githubLogin];
  if (slackId) {
    return slackId;
  }

  console.error(`getSlackUserIdMocked not implemented for ${githubLogin}`);
  return null;
}

const repositoryMock = mock<PullRequestOpenedEvent["repository"]>({
  id: mockRepo.repoId,
  full_name: "Dunder Mifflin",
  owner: {
    id: mockedOrg.id,
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
  user: users.jim,
  title: "Add 'Dundie Awards' recepients to marketing site",
  body: "Adds a new page to the marketing site showcasing the 2024 Dundie Award winners, at `/about/dundie-awards`",
  html_url: "https://github.com/test/test/pull/340",
  url: "https://api.github.com/repos/test/test/pulls/340",
  requested_reviewers: [],
};

// Michael's PR (id: 456) - WIP/draft PR
const michaelPrData = {
  id: 456,
  draft: true,
  merged: false,
  closed_at: null,
  number: 341,
  additions: 200,
  deletions: 50,
  user: users.michael,
  title: "Update Regional Manager Guidelines",
  body: "Updates the guidelines document with new Scranton branch policies",
  html_url: "https://github.com/test/test/pull/341",
  url: "https://api.github.com/repos/test/test/pulls/341",
  requested_reviewers: [],
};

// Dwight's PR (id: 789) - for closed scenario
const dwightPrData = {
  id: 789,
  draft: false,
  merged: false,
  closed_at: null,
  number: 342,
  additions: 100,
  deletions: 25,
  user: users.dwight,
  title: "Add beet farming integration",
  body: "Integrates Schrute Farms beet inventory with the main system",
  html_url: "https://github.com/test/test/pull/342",
  url: "https://api.github.com/repos/test/test/pulls/342",
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
          requested_reviewer: users.michael,
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
            id: 124,
            body: "Yes!",
            user: users.dwight,
            state: "approved",
          }),
          pull_request: mock<PullRequestReviewSubmittedEvent["pull_request"]>({
            id: 123,
            user: users.jim,
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
  it("should post three PRs with different approval states", async () => {
    // Track thread timestamps for each PR
    const threadTsMap: Record<number, string> = {};

    vi.mocked(tryGetPrRequiredApprovalsCount).mockResolvedValue({ count: 2 });

    // Smart insertPullRequest mock that tracks threadTs by PR id
    vi.mocked(insertPullRequest).mockImplementation((args) => {
      if (args.threadTs && args.id) {
        threadTsMap[args.id] = args.threadTs;
      }
      return Promise.resolve(args as any);
    });

    // Smart fetchPrItem mock that returns correct threadTs for each PR
    vi.mocked(fetchPrItem).mockImplementation(async ({ pullRequestId }) => {
      return mock<PullRequestWithAlias>({
        threadTs: threadTsMap[pullRequestId] || "",
        requiredApprovals: 2,
      });
    });

    // Smart getPullRequestInfo mock that returns correct PR data based on URL
    vi.mocked(getPullRequestInfo).mockImplementation(async ({ url }) => {
      const baseResponse = {
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
      };

      if (url.includes("341")) {
        return mock<PullRequestInfoResponse>({ ...michaelPrData, ...baseResponse });
      }
      if (url.includes("342")) {
        return mock<PullRequestInfoResponse>({ ...dwightPrData, ...baseResponse });
      }
      // Default to Jim's PR #340
      return mock<PullRequestInfoResponse>({ ...basePrData, ...baseResponse });
    });

    // === PR #340 by Jim - will end up with 2/2 approvals ===
    vi.mocked(getNumberOfApprovals).mockResolvedValue(0);

    await handleGithubWebhookEvent({
      event: mock<PullRequestOpenedEvent>({
        action: "opened",
        pull_request: mock<PullRequestOpenedEvent["pull_request"]>({
          ...basePrData,
          base: mock<PullRequestOpenedEvent["pull_request"]["base"]>({
            ref: "main",
          }),
        }),
        repository: repositoryMock,
      }) as any,
      eventName: "pull_request",
    });

    // First approval for Jim's PR
    vi.mocked(getNumberOfApprovals).mockResolvedValue(1);
    await handleGithubWebhookEvent({
      event: mock<PullRequestReviewSubmittedEvent>({
        action: "submitted",
        sender: users.michael,
        review: mock<PullRequestReviewSubmittedEvent["review"]>({
          id: 1001,
          body: "Looks good!",
          user: users.michael,
          state: "approved",
        }),
        pull_request: mock<PullRequestReviewSubmittedEvent["pull_request"]>({
          id: basePrData.id,
          user: users.jim,
        }),
        repository: repositoryMock,
      }) as any,
      eventName: "pull_request_review",
    });

    // Second approval for Jim's PR - now 2/2
    vi.mocked(getNumberOfApprovals).mockResolvedValue(2);
    await handleGithubWebhookEvent({
      event: mock<PullRequestReviewSubmittedEvent>({
        action: "submitted",
        sender: users.dwight,
        review: mock<PullRequestReviewSubmittedEvent["review"]>({
          id: 1002,
          body: "LGTM!",
          user: users.dwight,
          state: "approved",
        }),
        pull_request: mock<PullRequestReviewSubmittedEvent["pull_request"]>({
          id: basePrData.id,
          user: users.jim,
        }),
        repository: repositoryMock,
      }) as any,
      eventName: "pull_request_review",
    });

    // === PR #341 by Michael (WIP) - will end up with 1/2 approvals ===
    vi.mocked(getNumberOfApprovals).mockResolvedValue(0);

    await handleGithubWebhookEvent({
      event: mock<PullRequestOpenedEvent>({
        action: "opened",
        pull_request: mock<PullRequestOpenedEvent["pull_request"]>({
          ...michaelPrData,
          base: mock<PullRequestOpenedEvent["pull_request"]["base"]>({
            ref: "main",
          }),
        }),
        repository: repositoryMock,
      }) as any,
      eventName: "pull_request",
    });

    // One approval for Michael's PR - 1/2
    vi.mocked(getNumberOfApprovals).mockResolvedValue(1);
    await handleGithubWebhookEvent({
      event: mock<PullRequestReviewSubmittedEvent>({
        action: "submitted",
        sender: users.jim,
        review: mock<PullRequestReviewSubmittedEvent["review"]>({
          id: 1003,
          body: "Nice work!",
          user: users.jim,
          state: "approved",
        }),
        pull_request: mock<PullRequestReviewSubmittedEvent["pull_request"]>({
          id: michaelPrData.id,
          user: users.michael,
        }),
        repository: repositoryMock,
      }) as any,
      eventName: "pull_request_review",
    });

    // === PR #342 by Dwight - stays at 0/2 approvals ===
    vi.mocked(getNumberOfApprovals).mockResolvedValue(0);

    await handleGithubWebhookEvent({
      event: mock<PullRequestOpenedEvent>({
        action: "opened",
        pull_request: mock<PullRequestOpenedEvent["pull_request"]>({
          ...dwightPrData,
          base: mock<PullRequestOpenedEvent["pull_request"]["base"]>({
            ref: "main",
          }),
        }),
        repository: repositoryMock,
      }) as any,
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

  it("should post a DM when mentioned in a comment", async () => {
    // Dwight mentions Jim in a comment - Jim should get a DM
    const commentWithMention = mock<IssueCommentCreatedEvent>({
      action: "created",
      sender: users.dwight,
      comment: mock<IssueCommentCreatedEvent["comment"]>({
        id: 2,
        body: "Hey @jim, can you take a look at this section? I think we need your input.",
        html_url: "https://github.com/test/test/pull/340#issuecomment-2",
      }),
      issue: mock<IssueCommentCreatedEvent["issue"]>({
        title: basePrData.title,
        number: basePrData.number,
        pull_request: mock<IssueCommentCreatedEvent["issue"]["pull_request"]>({
          ...basePrData,
          url: "https://api.github.com/repos/test/test/pulls/340",
        }),
      }),
      repository: repositoryMock,
    });

    await handleGithubWebhookEvent({
      event: commentWithMention as any,
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
    const prMergedEvent = mock<PullRequestClosedEvent>({
      action: "closed",
      pull_request: mock<PullRequestClosedEvent["pull_request"]>({
        ...michaelPrData,
        base: mock<PullRequestOpenedEvent["pull_request"]["base"]>({
          ref: "main",
        }),
        merged: true,
        closed_at: "2024-11-17T15:00:00Z",
      }),
      repository: repositoryMock,
    });

    await handleGithubWebhookEvent({
      event: prMergedEvent as any,
      eventName: "pull_request",
    });
  });

  it("should post pull request closed", async () => {
    // Michael closes Dwight's PR - Dwight should get a DM
    const prClosedEvent = mock<PullRequestClosedEvent>({
      action: "closed",
      sender: users.michael,
      pull_request: mock<PullRequestClosedEvent["pull_request"]>({
        ...dwightPrData,
        base: mock<PullRequestOpenedEvent["pull_request"]["base"]>({
          ref: "main",
        }),
        merged: false,
        closed_at: "2024-11-17T15:00:00Z",
      }),
      repository: repositoryMock,
    });

    await handleGithubWebhookEvent({
      event: prClosedEvent as any,
      eventName: "pull_request",
    });
  });

  it("should DM Jim when his PR is merged", async () => {
    // Jim's PR gets merged - Jim should get a DM
    const prMergedEvent = mock<PullRequestClosedEvent>({
      action: "closed",
      pull_request: mock<PullRequestClosedEvent["pull_request"]>({
        ...basePrData,
        base: mock<PullRequestOpenedEvent["pull_request"]["base"]>({
          ref: "main",
        }),
        merged: true,
        closed_at: "2024-11-17T15:00:00Z",
      }),
      repository: repositoryMock,
    });

    await handleGithubWebhookEvent({
      event: prMergedEvent as any,
      eventName: "pull_request",
    });
  });

  it("should DM Jim when requested to review Dwight's PR", async () => {
    // Jim is requested to review Dwight's PR - Jim should get a DM
    const reviewRequestedEvent = mock<PullRequestReviewRequestedEvent>({
      action: "review_requested",
      requested_reviewer: users.jim,
      pull_request: mock<PullRequestReviewRequestedEvent["pull_request"]>({
        ...dwightPrData,
        base: mock<PullRequestOpenedEvent["pull_request"]["base"]>({
          ref: "main",
        }),
      }),
      repository: repositoryMock,
    });

    await handleGithubWebhookEvent({
      event: reviewRequestedEvent as any,
      eventName: "pull_request",
    });
  });
});
