/**
 * Script to post demo PR messages to Slack for screenshots.
 *
 * Run with: bun packages/domain/scripts/post-demo-messages.ts
 */
require("dotenv").config({ path: ".env.e2e" });

import { PullRequestOpenedEvent } from "@octokit/webhooks-types";
import { SlackClient } from "../slack/SlackClient";

const slackChannelId = process.env.SLACK_CHANNEL_ID;
if (!slackChannelId) {
  throw new Error("SLACK_CHANNEL_ID is not set");
}

const slackAccessToken = process.env.SLACK_ACCESS_TOKEN;
if (!slackAccessToken) {
  throw new Error("SLACK_ACCESS_TOKEN is not set");
}

const slackClient = new SlackClient(slackChannelId, slackAccessToken);

// User data (same avatars as e2e tests)
const users = {
  jim: {
    login: "jim",
    avatar_url: "https://cdn.mos.cms.futurecdn.net/ojTtHYLoiqG2riWm7fB9Gn.jpg",
  },
  michael: {
    login: "michael",
    avatar_url:
      "https://static1.srcdn.com/wordpress/wp-content/uploads/2023/01/steve-carell-as-michael-scott-with-the-cast-of-the-office.jpg?q=50&fit=crop&w=1140&h=&dpr=1.5",
  },
  dwight: {
    login: "dwight",
    avatar_url:
      "https://www.myany.city/sites/default/files/styles/scaled_cropped_medium__260x260/public/field/image/node-related-images/sample-dwight-k-schrute.jpg",
  },
};

// Slack user IDs for mentions
const slackUserIds: Record<string, string> = {
  michael: "U081WKT1AUQ",
  jim: "U07GB8TBX53",
  dwight: "U07J1FWJUQ0",
};

const repository = {
  id: 456,
  node_id: "test",
  name: "test",
  full_name: "Dunder Mifflin",
  private: false,
  owner: {
    login: "dunder-mifflin",
    id: 123,
    node_id: "test",
    avatar_url:
      "https://logos-world.net/wp-content/uploads/2022/02/Dunder-Mifflin-Logo.png",
    gravatar_id: "",
    url: "",
    html_url: "",
    followers_url: "",
    following_url: "",
    gists_url: "",
    starred_url: "",
    subscriptions_url: "",
    organizations_url: "",
    repos_url: "",
    events_url: "",
    received_events_url: "",
    type: "Organization" as const,
    site_admin: false,
  },
  html_url: "",
  description: null,
  fork: false,
  url: "",
  forks_url: "",
  keys_url: "",
  collaborators_url: "",
  teams_url: "",
  hooks_url: "",
  issue_events_url: "",
  events_url: "",
  assignees_url: "",
  branches_url: "",
  tags_url: "",
  blobs_url: "",
  git_tags_url: "",
  git_refs_url: "",
  trees_url: "",
  statuses_url: "",
  languages_url: "",
  stargazers_url: "",
  contributors_url: "",
  subscribers_url: "",
  subscription_url: "",
  commits_url: "",
  git_commits_url: "",
  comments_url: "",
  issue_comment_url: "",
  contents_url: "",
  compare_url: "",
  merges_url: "",
  archive_url: "",
  downloads_url: "",
  issues_url: "",
  pulls_url: "",
  milestones_url: "",
  notifications_url: "",
  labels_url: "",
  releases_url: "",
  deployments_url: "",
  created_at: "",
  updated_at: "",
  pushed_at: "",
  git_url: "",
  ssh_url: "",
  clone_url: "",
  svn_url: "",
  homepage: null,
  size: 0,
  stargazers_count: 0,
  watchers_count: 0,
  language: null,
  has_issues: true,
  has_projects: true,
  has_downloads: true,
  has_wiki: true,
  has_pages: false,
  has_discussions: false,
  forks_count: 0,
  mirror_url: null,
  archived: false,
  disabled: false,
  open_issues_count: 0,
  license: null,
  allow_forking: true,
  is_template: false,
  web_commit_signoff_required: false,
  topics: [],
  visibility: "public" as const,
  forks: 0,
  open_issues: 0,
  watchers: 0,
  default_branch: "main",
};

function createPullRequestUser(user: { login: string; avatar_url: string }) {
  return {
    login: user.login,
    id: 1,
    node_id: "test",
    avatar_url: user.avatar_url,
    gravatar_id: "",
    url: "",
    html_url: "",
    followers_url: "",
    following_url: "",
    gists_url: "",
    starred_url: "",
    subscriptions_url: "",
    organizations_url: "",
    repos_url: "",
    events_url: "",
    received_events_url: "",
    type: "User" as const,
    site_admin: false,
  };
}

function createPrEvent(prData: {
  id: number;
  number: number;
  title: string;
  body: string;
  user: { login: string; avatar_url: string };
  additions: number;
  deletions: number;
  draft: boolean;
  merged: boolean;
  closed_at: string | null;
}): PullRequestOpenedEvent {
  return {
    action: "opened",
    number: prData.number,
    pull_request: {
      id: prData.id,
      node_id: "test",
      number: prData.number,
      state: "open",
      locked: false,
      title: prData.title,
      body: prData.body,
      user: createPullRequestUser(prData.user),
      html_url: `https://github.com/test/test/pull/${prData.number}`,
      diff_url: "",
      patch_url: "",
      issue_url: "",
      commits_url: "",
      review_comments_url: "",
      review_comment_url: "",
      comments_url: "",
      statuses_url: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      closed_at: prData.closed_at,
      merged_at: null,
      merge_commit_sha: null,
      assignee: null,
      assignees: [],
      requested_reviewers: [],
      requested_teams: [],
      labels: [],
      milestone: null,
      draft: prData.draft,
      head: {
        label: "test:feature",
        ref: "feature",
        sha: "abc123",
        user: createPullRequestUser(prData.user),
        repo: repository,
      },
      base: {
        label: "test:main",
        ref: "main",
        sha: "def456",
        user: createPullRequestUser(prData.user),
        repo: repository,
      },
      _links: {
        self: { href: "" },
        html: { href: "" },
        issue: { href: "" },
        comments: { href: "" },
        review_comments: { href: "" },
        review_comment: { href: "" },
        commits: { href: "" },
        statuses: { href: "" },
      },
      author_association: "OWNER" as const,
      auto_merge: null,
      active_lock_reason: null,
      merged: prData.merged,
      mergeable: true,
      rebaseable: true,
      mergeable_state: "clean",
      merged_by: null,
      comments: 0,
      review_comments: 0,
      maintainer_can_modify: false,
      commits: 1,
      additions: prData.additions,
      deletions: prData.deletions,
      changed_files: 5,
    },
    repository,
    sender: createPullRequestUser(prData.user),
  } as unknown as PullRequestOpenedEvent;
}

async function main() {
  console.log("Posting demo messages to Slack...\n");

  // PR #340 by Jim - 2/2 approvals (queued to merge)
  console.log("Posting PR #340 by Jim (2/2 approvals)...");
  const jim340 = await slackClient.postPrReady({
    body: createPrEvent({
      id: 123,
      number: 340,
      title: "Add 'Dundie Awards' recepients to marketing site",
      body: "Adds a new page to the marketing site showcasing the 2024 Dundie Award winners, at `/about/dundie-awards`",
      user: users.jim,
      additions: 432,
      deletions: 12,
      draft: false,
      merged: false,
      closed_at: null,
    }),
    pullRequestItem: {
      id: 123,
      repoId: 456,
      prNumber: 340,
      threadTs: null,
      isDraft: false,
      approvalCount: 2,
      requiredApprovals: 2,
      isQueuedToMerge: true,
      requestedReviewers: [],
      additions: 432,
      deletions: 12,
      authorLogin: "jim",
      authorAvatarUrl: users.jim.avatar_url,
      targetBranch: "main",
      status: "open",
      closedAt: null,
      mergedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    slackUsername: `<@${slackUserIds.jim}>`,
    requiredApprovals: { count: 2 },
  });
  console.log(`  Posted! threadTs: ${jim340?.ts}\n`);

  // PR #341 by Michael (WIP) - 1/2 approvals
  console.log("Posting PR #341 by Michael (WIP, 1/2 approvals)...");
  const michael341 = await slackClient.postPrReady({
    body: createPrEvent({
      id: 456,
      number: 341,
      title: "Update Regional Manager Guidelines",
      body: "Updates the guidelines document with new Scranton branch policies",
      user: users.michael,
      additions: 200,
      deletions: 50,
      draft: true,
      merged: false,
      closed_at: null,
    }),
    pullRequestItem: {
      id: 456,
      repoId: 456,
      prNumber: 341,
      threadTs: null,
      isDraft: true,
      approvalCount: 1,
      requiredApprovals: 2,
      isQueuedToMerge: false,
      requestedReviewers: [],
      additions: 200,
      deletions: 50,
      authorLogin: "michael",
      authorAvatarUrl: users.michael.avatar_url,
      targetBranch: "main",
      status: "open",
      closedAt: null,
      mergedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    slackUsername: `<@${slackUserIds.michael}>`,
    requiredApprovals: { count: 2 },
  });
  console.log(`  Posted! threadTs: ${michael341?.ts}\n`);

  // PR #342 by Dwight - 0/2 approvals
  console.log("Posting PR #342 by Dwight (0/2 approvals)...");
  const dwight342 = await slackClient.postPrReady({
    body: createPrEvent({
      id: 789,
      number: 342,
      title: "Add beet farming integration",
      body: "Integrates Schrute Farms beet inventory with the main system",
      user: users.dwight,
      additions: 100,
      deletions: 25,
      draft: false,
      merged: false,
      closed_at: null,
    }),
    pullRequestItem: {
      id: 789,
      repoId: 456,
      prNumber: 342,
      threadTs: null,
      isDraft: false,
      approvalCount: 0,
      requiredApprovals: 2,
      isQueuedToMerge: false,
      requestedReviewers: [],
      additions: 100,
      deletions: 25,
      authorLogin: "dwight",
      authorAvatarUrl: users.dwight.avatar_url,
      targetBranch: "main",
      status: "open",
      closedAt: null,
      mergedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    slackUsername: `<@${slackUserIds.dwight}>`,
    requiredApprovals: { count: 2 },
  });
  console.log(`  Posted! threadTs: ${dwight342?.ts}\n`);

  console.log("Done!");
}

main().catch(console.error);
