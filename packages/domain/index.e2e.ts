require("dotenv").config({ path: ".env.e2e" });
import {
  Organization,
  PullRequestItem,
  Repository,
  SlackIntegration,
} from "@core/dynamodb/entities/types";
import {
  IssueCommentEvent,
  PullRequestClosedEvent,
  PullRequestConvertedToDraftEvent,
  PullRequestOpenedEvent,
  PullRequestReviewRequestedEvent,
  PullRequestReviewSubmittedEvent,
} from "@octokit/webhooks-types";
import { describe, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { fetchOrganizationById } from "./dynamodb/fetchers/organizations";
import { fetchPrItem, insertPullRequest } from "./dynamodb/fetchers/pullRequests";
import { safeFetchRepository } from "./dynamodb/fetchers/repositories";
import { getSlackInstallationsForOrganization } from "./dynamodb/fetchers/slack";
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
import { getSlackUserName } from "./github/webhooks/handlers/shared";
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
});

vi.mock("@domain/github/webhooks/handlers/shared", () => {
  return {
    getSlackUserName: vi.fn(),
  };
});

vi.mock("@domain/dynamodb/fetchers/pullRequests", () => {
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
vi.mocked(fetchPrItem).mockResolvedValue(
  mock<PullRequestItem>({
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

type TestPullRequestData = {
  id: number;
  draft: boolean;
  merged: boolean;
  number: number;
  additions: number;
  deletions: number;
  user: {
    login: string;
    avatar_url: string;
  };
  closed_at: undefined | null;
  title: string;
  body: string;
  html_url: string;
  requested_reviewers: any[];
  base?: {
    ref: string;
  };
};

const baseInfo = {
  repo: {
    full_name: "Dunder Mifflin",
    owner: {
      avatar_url:
        "https://logos-world.net/wp-content/uploads/2022/02/Dunder-Mifflin-Logo.png",
    },
  },
  ref: "main",
};

describe("chained e2e events", () => {
  it("message chain in progress", { timeout: 1000 * 60 * 5 }, async () => {
    const basePrData: TestPullRequestData = {
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
      base: {
        ref: "main",
      },
    };

    const events = [
      {
        event: mock<PullRequestOpenedEvent>({
          action: "opened",
          pull_request: basePrData,
          repository: repositoryMock,
        }),
        eventName: "pull_request",
      },
      () => {
        vi.mocked(fetchPrItem).mockResolvedValue(
          mock<PullRequestItem>({
            threadTs: THREAD_TS,
            requiredApprovals: 2,
          }),
        );
      },
      () => {
        vi.mocked(getPullRequestInfo).mockResolvedValue(
          mock<PullRequestInfoResponse>({
            ...basePrData,
            ...baseInfo,
          }),
        );
      },
      {
        event: mock<PullRequestReviewRequestedEvent>({
          action: "review_requested",
          requested_reviewer: users.jim,
          repository: repositoryMock,
          pull_request: basePrData,
        }),
        eventName: "pull_request",
      },
      () => {
        vi.mocked(getNumberOfApprovals).mockResolvedValue(1);
      },
      // async () => {
      //   await new Promise((resolve) => setTimeout(resolve, 1000 * 60 * 2));
      // },
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
            ...basePrData,
          }),
          repository: repositoryMock,
        }),
        eventName: "pull_request_review",
      },
      // async () => {
      //   await new Promise((resolve) => setTimeout(resolve, 1000 * 60 * 2));
      // },
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
            ...basePrData,
          }),
          repository: repositoryMock,
        }),
        eventName: "pull_request_review",
      },
    ];

    await runEvents(events);
  });

  it("message chain merged", { timeout: 1000 * 60 * 5 }, async () => {
    const prData: TestPullRequestData = {
      id: 339,
      draft: false,
      merged: false,
      number: 339,
      additions: 1233,
      deletions: 33,
      user: users.jim,
      closed_at: undefined,
      title: "Updating dependencies",
      body: "Updates all the dependencies to the latest and greatest",
      html_url: "https://github.com/test/test/pull/2",
      requested_reviewers: [],
      base: {
        ref: "main",
      },
    };

    const events = [
      {
        event: mock<PullRequestOpenedEvent>({
          action: "opened",
          pull_request: prData,
          repository: repositoryMock,
        }),
        eventName: "pull_request",
      },
      () => {
        vi.mocked(fetchPrItem).mockResolvedValue(
          mock<PullRequestItem>({
            threadTs: THREAD_TS,
            requiredApprovals: 2,
          }),
        );
      },
      () => {
        vi.mocked(getPullRequestInfo).mockResolvedValue(
          mock<PullRequestInfoResponse>({
            ...prData,
            ...baseInfo,
          }),
        );
      },
      {
        event: mock<PullRequestReviewRequestedEvent>({
          action: "review_requested",
          requested_reviewer: users.michael,
          repository: repositoryMock,
          pull_request: prData,
        }),
        eventName: "pull_request",
      },
      {
        event: mock<PullRequestReviewRequestedEvent>({
          action: "review_requested",
          requested_reviewer: users.dwight,
          repository: repositoryMock,
          pull_request: prData,
        }),
        eventName: "pull_request",
      },
      {
        event: mock<PullRequestReviewSubmittedEvent>({
          action: "submitted",
          sender: users.dwight,
          review: mock<PullRequestReviewSubmittedEvent["review"]>({
            id: 123,
            body: "",
            user: users.dwight,
            state: "approved",
          }),
          pull_request: prData,
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
            body: "",
            state: "approved",
          }),
          pull_request: prData,
          repository: repositoryMock,
        }),
        eventName: "pull_request_review",
      },
      () => {
        vi.mocked(getNumberOfApprovals).mockResolvedValue(2);
      },
      () => {
        vi.mocked(fetchPrItem).mockResolvedValue(
          mock<PullRequestItem>({
            threadTs: THREAD_TS,
            requiredApprovals: 2,
            approvalCount: 2,
          }),
        );
      },
      {
        event: mock<PullRequestClosedEvent>({
          action: "closed",
          sender: users.jim,
          pull_request: mock<PullRequestClosedEvent["pull_request"]>({
            ...prData,
            closed_at: undefined,
            state: "closed",
            merged: true,
          }),
          repository: repositoryMock,
        }),
        eventName: "pull_request",
      },
    ];

    await runEvents(events);
  });

  it("message chain DRAFT", { timeout: 1000 * 60 * 5 }, async () => {
    const prData = {
      id: 338,
      draft: false,
      merged: false,
      number: 338,
      additions: 892,
      deletions: 8,
      user: users.dwight,
      closed_at: undefined,
      title: "Adding productivity tracker",
      body: "In order to make sure each employee is being productive, adding a productivity tracker within our app",
      html_url: "https://github.com/test/test/pull/2",
      requested_reviewers: [],
      base: {
        ref: "internal-preview",
      },
    };
    const pullRequestMock = mock<PullRequestOpenedEvent["pull_request"]>({
      ...prData,
      base: mock<PullRequestOpenedEvent["pull_request"]["base"]>({
        ref: "main",
      }),
    });

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
          mock<PullRequestItem>({
            threadTs: THREAD_TS,
            requiredApprovals: 2,
            approvalCount: 0,
          }),
        );
      },
      () => {
        vi.mocked(getPullRequestInfo).mockResolvedValue(
          mock<PullRequestInfoResponse>({
            ...prData,
            ...baseInfo,
          }),
        );
      },
      {
        event: mock<PullRequestConvertedToDraftEvent>({
          action: "converted_to_draft",
          sender: users.dwight,
          pull_request: mock<PullRequestConvertedToDraftEvent["pull_request"]>({
            ...prData,
            draft: true,
            merged: false,
            user: users.dwight,
          }),
          repository: repositoryMock,
        }),
        eventName: "pull_request",
      },
    ];

    await runEvents(events);
  });
});

const runEvents = async (events: any[]) => {
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
};
