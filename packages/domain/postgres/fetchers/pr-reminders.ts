import { and, eq, lt, sql } from "drizzle-orm";
import { db } from "../client";
import {
  type Organization,
  type PullRequest,
  PullRequestStatus,
  type Repository,
  type SlackIntegration,
  organizations,
  pullRequests,
  repositories,
  slackIntegrations,
} from "../schema";

/**
 * PR data with org/slack context for reminder messages
 */
export type OutstandingPrWithContext = {
  pr: Pick<
    PullRequest,
    | "id"
    | "prNumber"
    | "threadTs"
    | "requiredApprovals"
    | "approvalCount"
    | "requestedReviewers"
    | "additions"
    | "deletions"
    | "authorLogin"
    | "authorAvatarUrl"
    | "targetBranch"
    | "status"
    | "createdAt"
  >;
  repo: Pick<Repository, "id" | "name">;
  org: Pick<Organization, "id" | "name" | "avatarUrl">;
  slack: Pick<SlackIntegration, "channelId" | "accessToken" | "slackTeamId">;
};

/**
 * PR reminder data grouped by organization and Slack integration
 */
export type PrReminder = Pick<
  PullRequest,
  | "prNumber"
  | "threadTs"
  | "approvalCount"
  | "requiredApprovals"
  | "requestedReviewers"
  | "additions"
  | "deletions"
  | "authorLogin"
  | "authorAvatarUrl"
  | "targetBranch"
  | "createdAt"
> & {
  prId: number;
  repoName: string;
  orgName: string;
  orgAvatarUrl: string;
};

export type OrgSlackReminders = Pick<
  SlackIntegration,
  "channelId" | "accessToken" | "slackTeamId"
> & {
  orgId: number;
  orgName: string;
  prs: PrReminder[];
};

/**
 * Fetches all PRs that need review reminders:
 * - Not in draft status
 * - From enabled repositories
 * - Created more than 4 hours ago
 * - approvalCount < requiredApprovals
 * - From organizations with Slack integrations
 */
export async function fetchOutstandingPrsForReminders(): Promise<
  OutstandingPrWithContext[]
> {
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

  const results = await db
    .select({
      pr: {
        id: pullRequests.id,
        prNumber: pullRequests.prNumber,
        threadTs: pullRequests.threadTs,
        requiredApprovals: pullRequests.requiredApprovals,
        approvalCount: pullRequests.approvalCount,
        requestedReviewers: pullRequests.requestedReviewers,
        additions: pullRequests.additions,
        deletions: pullRequests.deletions,
        authorLogin: pullRequests.authorLogin,
        authorAvatarUrl: pullRequests.authorAvatarUrl,
        targetBranch: pullRequests.targetBranch,
        status: pullRequests.status,
        createdAt: pullRequests.createdAt,
      },
      repo: {
        id: repositories.id,
        name: repositories.name,
      },
      org: {
        id: organizations.id,
        name: organizations.name,
        avatarUrl: organizations.avatarUrl,
      },
      slack: {
        channelId: slackIntegrations.channelId,
        accessToken: slackIntegrations.accessToken,
        slackTeamId: slackIntegrations.slackTeamId,
      },
    })
    .from(pullRequests)
    .innerJoin(repositories, eq(pullRequests.repoId, repositories.id))
    .innerJoin(organizations, eq(repositories.orgId, organizations.id))
    .innerJoin(slackIntegrations, eq(organizations.id, slackIntegrations.orgId))
    .where(
      and(
        eq(pullRequests.isDraft, false),
        eq(pullRequests.status, PullRequestStatus.OPEN),
        eq(repositories.isEnabled, true),
        lt(pullRequests.createdAt, fourHoursAgo),
        sql`${pullRequests.approvalCount} < ${pullRequests.requiredApprovals}`,
      ),
    );

  return results;
}

/**
 * Groups PRs by organization and Slack integration for efficient posting.
 * Key is `orgId-slackTeamId` to handle orgs with multiple Slack integrations.
 */
export function groupPrsByOrgAndSlack(
  prs: OutstandingPrWithContext[],
): Map<string, OrgSlackReminders> {
  const grouped = new Map<string, OrgSlackReminders>();

  for (const item of prs) {
    const key = `${item.org.id}-${item.slack.slackTeamId}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        orgId: item.org.id,
        orgName: item.org.name,
        channelId: item.slack.channelId,
        accessToken: item.slack.accessToken,
        slackTeamId: item.slack.slackTeamId,
        prs: [],
      });
    }

    grouped.get(key)!.prs.push({
      prNumber: item.pr.prNumber,
      prId: item.pr.id,
      repoName: item.repo.name,
      threadTs: item.pr.threadTs,
      approvalCount: item.pr.approvalCount,
      requiredApprovals: item.pr.requiredApprovals,
      requestedReviewers: item.pr.requestedReviewers,
      additions: item.pr.additions,
      deletions: item.pr.deletions,
      authorLogin: item.pr.authorLogin,
      authorAvatarUrl: item.pr.authorAvatarUrl,
      targetBranch: item.pr.targetBranch,
      orgName: item.org.name,
      orgAvatarUrl: item.org.avatarUrl,
      createdAt: item.pr.createdAt,
    });
  }

  return grouped;
}
