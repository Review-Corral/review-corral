import { describe, expect, it, vi } from "vitest";

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

import { type OutstandingPrWithContext, groupPrsByOrgAndSlack } from "./pr-reminders";

const ORG_1 = {
  id: 100,
  name: "org-one",
  avatarUrl: "https://example.com/org1.png",
};

const ORG_2 = {
  id: 200,
  name: "org-two",
  avatarUrl: "https://example.com/org2.png",
};

const SLACK_1 = {
  channelId: "C001",
  accessToken: "xoxb-token-1",
  slackTeamId: "T001",
};

const SLACK_2 = {
  channelId: "C002",
  accessToken: "xoxb-token-2",
  slackTeamId: "T002",
};

function createPrWithContext(
  prId: number,
  prNumber: number,
  repoId: number,
  repoName: string,
  org: typeof ORG_1,
  slack: typeof SLACK_1,
): OutstandingPrWithContext {
  return {
    pr: {
      id: prId,
      prNumber,
      threadTs: `thread-${prId}`,
      requiredApprovals: 2,
      approvalCount: 1,
      requestedReviewers: [],
      additions: 100,
      deletions: 10,
      authorLogin: "author",
      authorAvatarUrl: "https://example.com/author.png",
      targetBranch: "main",
      status: "open",
      createdAt: new Date("2024-01-01"),
    },
    repo: { id: repoId, name: repoName },
    org,
    slack,
  };
}

describe("groupPrsByOrgAndSlack", () => {
  it("should group PRs from different orgs into separate groups", () => {
    const pr1Org1 = createPrWithContext(1, 101, 10, "repo-a", ORG_1, SLACK_1);
    const pr2Org1 = createPrWithContext(2, 102, 10, "repo-a", ORG_1, SLACK_1);
    const pr3Org2 = createPrWithContext(3, 201, 20, "repo-b", ORG_2, SLACK_2);
    const pr4Org2 = createPrWithContext(4, 202, 20, "repo-b", ORG_2, SLACK_2);

    const result = groupPrsByOrgAndSlack([pr1Org1, pr2Org1, pr3Org2, pr4Org2]);

    expect(result.size).toBe(2);

    const org1Group = result.get(`${ORG_1.id}-${SLACK_1.slackTeamId}`);
    const org2Group = result.get(`${ORG_2.id}-${SLACK_2.slackTeamId}`);

    expect(org1Group).toBeDefined();
    expect(org2Group).toBeDefined();

    // Org 1 should only have its own PRs
    expect(org1Group!.orgId).toBe(ORG_1.id);
    expect(org1Group!.channelId).toBe(SLACK_1.channelId);
    expect(org1Group!.prs).toHaveLength(2);
    expect(org1Group!.prs.map((p) => p.prId)).toEqual([1, 2]);

    // Org 2 should only have its own PRs
    expect(org2Group!.orgId).toBe(ORG_2.id);
    expect(org2Group!.channelId).toBe(SLACK_2.channelId);
    expect(org2Group!.prs).toHaveLength(2);
    expect(org2Group!.prs.map((p) => p.prId)).toEqual([3, 4]);
  });

  it("should never include PRs from one org in another org's group", () => {
    const org1Prs = [
      createPrWithContext(1, 101, 10, "repo-a", ORG_1, SLACK_1),
      createPrWithContext(2, 102, 11, "repo-b", ORG_1, SLACK_1),
    ];
    const org2Prs = [
      createPrWithContext(3, 201, 20, "repo-c", ORG_2, SLACK_2),
      createPrWithContext(4, 202, 21, "repo-d", ORG_2, SLACK_2),
    ];

    const result = groupPrsByOrgAndSlack([...org1Prs, ...org2Prs]);

    for (const [key, group] of result.entries()) {
      for (const pr of group.prs) {
        // Every PR in a group must have the same orgName as the group
        expect(pr.orgName).toBe(group.orgName);

        // The org ID in the key must match the group's orgId
        const [keyOrgId] = key.split("-");
        expect(group.orgId).toBe(Number(keyOrgId));
      }
    }
  });

  it("should handle an org with multiple Slack integrations", () => {
    const slackA = { channelId: "C00A", accessToken: "token-a", slackTeamId: "TA" };
    const slackB = { channelId: "C00B", accessToken: "token-b", slackTeamId: "TB" };

    const pr1 = createPrWithContext(1, 101, 10, "repo", ORG_1, slackA);
    const pr2 = createPrWithContext(2, 102, 10, "repo", ORG_1, slackB);

    const result = groupPrsByOrgAndSlack([pr1, pr2]);

    expect(result.size).toBe(2);

    const groupA = result.get(`${ORG_1.id}-${slackA.slackTeamId}`);
    const groupB = result.get(`${ORG_1.id}-${slackB.slackTeamId}`);

    expect(groupA!.channelId).toBe(slackA.channelId);
    expect(groupA!.prs).toHaveLength(1);
    expect(groupA!.prs[0].prId).toBe(1);

    expect(groupB!.channelId).toBe(slackB.channelId);
    expect(groupB!.prs).toHaveLength(1);
    expect(groupB!.prs[0].prId).toBe(2);
  });

  it("should return an empty map when no PRs are provided", () => {
    const result = groupPrsByOrgAndSlack([]);
    expect(result.size).toBe(0);
  });

  it("should preserve all PR fields when grouping", () => {
    const pr = createPrWithContext(42, 123, 10, "my-repo", ORG_1, SLACK_1);
    pr.pr.additions = 500;
    pr.pr.deletions = 50;
    pr.pr.authorLogin = "test-author";
    pr.pr.targetBranch = "develop";

    const result = groupPrsByOrgAndSlack([pr]);
    const group = result.get(`${ORG_1.id}-${SLACK_1.slackTeamId}`)!;

    expect(group.prs[0]).toMatchObject({
      prId: 42,
      prNumber: 123,
      repoName: "my-repo",
      additions: 500,
      deletions: 50,
      authorLogin: "test-author",
      targetBranch: "develop",
      orgName: ORG_1.name,
      orgAvatarUrl: ORG_1.avatarUrl,
    });
  });
});
