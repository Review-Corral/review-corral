import { PullRequestStatus } from "@domain/postgres/schema";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  buildPrReminderMessageMock,
  fetchOutstandingPrsForRemindersMock,
  getInstallationAccessTokenMock,
  getPullRequestInfoMock,
  groupPrsByOrgAndSlackMock,
  loggerErrorMock,
  loggerInfoMock,
  slackClientConstructorMock,
  slackPostMessageMock,
  updatePullRequestMock,
} = vi.hoisted(() => ({
  buildPrReminderMessageMock: vi.fn(),
  fetchOutstandingPrsForRemindersMock: vi.fn(),
  getInstallationAccessTokenMock: vi.fn(),
  getPullRequestInfoMock: vi.fn(),
  groupPrsByOrgAndSlackMock: vi.fn(),
  loggerErrorMock: vi.fn(),
  loggerInfoMock: vi.fn(),
  slackClientConstructorMock: vi.fn(),
  slackPostMessageMock: vi.fn(),
  updatePullRequestMock: vi.fn(),
}));

vi.mock("@domain/github/fetchers", () => ({
  getInstallationAccessToken: getInstallationAccessTokenMock,
  getPullRequestInfo: getPullRequestInfoMock,
}));

vi.mock("@domain/logging", () => ({
  Logger: vi.fn().mockImplementation(function MockLogger() {
    return {
      info: loggerInfoMock,
      error: loggerErrorMock,
    };
  }),
}));

vi.mock("@domain/postgres/fetchers/pr-reminders", () => ({
  fetchOutstandingPrsForReminders: fetchOutstandingPrsForRemindersMock,
  groupPrsByOrgAndSlack: groupPrsByOrgAndSlackMock,
}));

vi.mock("@domain/postgres/fetchers/pull-requests", () => ({
  updatePullRequest: updatePullRequestMock,
}));

vi.mock("@domain/slack/prReminderMessage", () => ({
  buildPrReminderMessage: buildPrReminderMessageMock,
}));

vi.mock("@domain/slack/SlackClient", () => ({
  SlackClient: vi.fn().mockImplementation(function MockSlackClient(
    channelId: string,
    slackToken: string,
  ) {
    slackClientConstructorMock(channelId, slackToken);
    return {
      postMessage: slackPostMessageMock,
    };
  }),
}));

import { handler } from "./prReminders";

const scheduledEvent = {
  time: "2026-03-12T15:00:00Z",
} as const;

function makeOutstandingPr({
  prId,
  prNumber = prId,
  repoId = 100,
  repoName = "api",
  orgId = 1,
  orgName = "acme",
  installationId = 77,
  channelId = "C123",
  slackTeamId = "T123",
}: {
  prId: number;
  prNumber?: number;
  repoId?: number;
  repoName?: string;
  orgId?: number;
  orgName?: string;
  installationId?: number;
  channelId?: string;
  slackTeamId?: string;
}) {
  return {
    pr: {
      id: prId,
      prNumber,
      threadTs: "123.456",
      requiredApprovals: 2,
      approvalCount: 0,
      requestedReviewers: ["reviewer-1"],
      additions: 12,
      deletions: 4,
      authorLogin: "alice",
      authorAvatarUrl: "https://example.com/alice.png",
      targetBranch: "main",
      status: PullRequestStatus.OPEN,
      createdAt: new Date("2026-03-10T10:00:00Z"),
    },
    repo: {
      id: repoId,
      name: repoName,
    },
    org: {
      id: orgId,
      name: orgName,
      avatarUrl: "https://example.com/org.png",
      installationId,
    },
    slack: {
      channelId,
      accessToken: "xoxb-slack-token",
      slackTeamId,
    },
  };
}

function makeGroupedReminder(prId: number, overrides?: Partial<ReturnType<typeof makeOutstandingPr>>) {
  const outstanding = {
    ...makeOutstandingPr({ prId }),
    ...overrides,
  };

  return {
    prNumber: outstanding.pr.prNumber,
    prId: outstanding.pr.id,
    repoName: outstanding.repo.name,
    repoId: outstanding.repo.id,
    threadTs: outstanding.pr.threadTs,
    approvalCount: outstanding.pr.approvalCount,
    requiredApprovals: outstanding.pr.requiredApprovals,
    requestedReviewers: outstanding.pr.requestedReviewers,
    additions: outstanding.pr.additions,
    deletions: outstanding.pr.deletions,
    authorLogin: outstanding.pr.authorLogin,
    authorAvatarUrl: outstanding.pr.authorAvatarUrl,
    targetBranch: outstanding.pr.targetBranch,
    orgName: outstanding.org.name,
    orgAvatarUrl: outstanding.org.avatarUrl,
    createdAt: outstanding.pr.createdAt,
  };
}

describe("cron/prReminders", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    fetchOutstandingPrsForRemindersMock.mockResolvedValue([]);
    groupPrsByOrgAndSlackMock.mockReturnValue(new Map());
    getInstallationAccessTokenMock.mockResolvedValue({ token: "gh-install-token" });
    buildPrReminderMessageMock.mockReturnValue({
      text: "Reminder",
      blocks: [{ type: "section", text: { type: "mrkdwn", text: "body" } }],
      attachments: [{ color: "#35373B" }],
    });
    slackPostMessageMock.mockResolvedValue({ ts: "1700000000.000100" });
    updatePullRequestMock.mockResolvedValue(null);
  });

  it("returns early when there are no outstanding PRs", async () => {
    await handler(scheduledEvent as any);

    expect(fetchOutstandingPrsForRemindersMock).toHaveBeenCalledOnce();
    expect(groupPrsByOrgAndSlackMock).not.toHaveBeenCalled();
    expect(getInstallationAccessTokenMock).not.toHaveBeenCalled();
    expect(slackClientConstructorMock).not.toHaveBeenCalled();
    expect(slackPostMessageMock).not.toHaveBeenCalled();
  });

  it("skips reminders for groups above the max PR threshold", async () => {
    const outstandingPrs = Array.from({ length: 11 }, (_, index) =>
      makeOutstandingPr({ prId: index + 1 }),
    );
    const groupedPrs = Array.from({ length: 11 }, (_, index) =>
      makeGroupedReminder(index + 1),
    );

    fetchOutstandingPrsForRemindersMock.mockResolvedValue(outstandingPrs);
    groupPrsByOrgAndSlackMock.mockReturnValue(
      new Map([
        [
          "1-T123",
          {
            orgId: 1,
            orgName: "acme",
            installationId: 77,
            channelId: "C123",
            accessToken: "xoxb-slack-token",
            slackTeamId: "T123",
            prs: groupedPrs,
          },
        ],
      ]),
    );

    await handler(scheduledEvent as any);

    expect(loggerErrorMock).toHaveBeenCalledWith(
      "Too many pending PRs for org/slack group, skipping reminder",
      expect.objectContaining({
        orgId: 1,
        channelId: "C123",
        prCount: 11,
        maxAllowed: 10,
      }),
    );
    expect(getInstallationAccessTokenMock).not.toHaveBeenCalled();
    expect(slackClientConstructorMock).not.toHaveBeenCalled();
    expect(slackPostMessageMock).not.toHaveBeenCalled();
  });

  it("updates closed PRs and sends a reminder only for PRs still open on GitHub", async () => {
    const outstandingPrs = [
      makeOutstandingPr({ prId: 1, prNumber: 101, repoId: 201, repoName: "frontend" }),
      makeOutstandingPr({ prId: 2, prNumber: 102, repoId: 202, repoName: "frontend" }),
      makeOutstandingPr({ prId: 3, prNumber: 103, repoId: 203, repoName: "backend" }),
    ];
    const groupedPrs = [
      makeGroupedReminder(1, outstandingPrs[0]),
      makeGroupedReminder(2, outstandingPrs[1]),
      makeGroupedReminder(3, outstandingPrs[2]),
    ];

    fetchOutstandingPrsForRemindersMock.mockResolvedValue(outstandingPrs);
    groupPrsByOrgAndSlackMock.mockReturnValue(
      new Map([
        [
          "1-T123",
          {
            orgId: 1,
            orgName: "acme",
            installationId: 77,
            channelId: "C123",
            accessToken: "xoxb-slack-token",
            slackTeamId: "T123",
            prs: groupedPrs,
          },
        ],
      ]),
    );
    getPullRequestInfoMock
      .mockResolvedValueOnce({
        state: "open",
        merged_at: null,
        closed_at: null,
      })
      .mockResolvedValueOnce({
        state: "closed",
        merged_at: null,
        closed_at: "2026-03-11T16:30:00Z",
      })
      .mockResolvedValueOnce({
        state: "closed",
        merged_at: "2026-03-11T17:00:00Z",
        closed_at: "2026-03-11T17:00:00Z",
      });

    await handler(scheduledEvent as any);

    expect(getInstallationAccessTokenMock).toHaveBeenCalledWith(77);
    expect(getPullRequestInfoMock).toHaveBeenCalledTimes(3);
    expect(getPullRequestInfoMock).toHaveBeenNthCalledWith(1, {
      url: "https://api.github.com/repos/acme/frontend/pulls/101",
      accessToken: "gh-install-token",
    });
    expect(getPullRequestInfoMock).toHaveBeenNthCalledWith(2, {
      url: "https://api.github.com/repos/acme/frontend/pulls/102",
      accessToken: "gh-install-token",
    });
    expect(getPullRequestInfoMock).toHaveBeenNthCalledWith(3, {
      url: "https://api.github.com/repos/acme/backend/pulls/103",
      accessToken: "gh-install-token",
    });

    expect(updatePullRequestMock).toHaveBeenCalledTimes(2);
    expect(updatePullRequestMock).toHaveBeenNthCalledWith(1, {
      repoId: 202,
      pullRequestId: 2,
      status: PullRequestStatus.CLOSED,
      closedAt: new Date("2026-03-11T16:30:00Z"),
    });
    expect(updatePullRequestMock).toHaveBeenNthCalledWith(2, {
      repoId: 203,
      pullRequestId: 3,
      status: PullRequestStatus.MERGED,
      mergedAt: new Date("2026-03-11T17:00:00Z"),
      closedAt: new Date("2026-03-11T17:00:00Z"),
    });

    expect(buildPrReminderMessageMock).toHaveBeenCalledWith([groupedPrs[0]], "C123");
    expect(slackClientConstructorMock).toHaveBeenCalledWith("C123", "xoxb-slack-token");
    expect(slackPostMessageMock).toHaveBeenCalledWith({
      message: {
        text: "Reminder",
        blocks: [{ type: "section", text: { type: "mrkdwn", text: "body" } }],
        attachments: [{ color: "#35373B" }],
      },
      threadTs: undefined,
    });
  });
});
