import { PullRequestOpenedEvent } from "@octokit/webhooks-types";
import { WebClient } from "@slack/web-api";
import { SupabaseClient } from "@supabase/supabase-js";

import { describe, expect, it, vi } from "vitest";
import { GithubEventHandler } from "./GithubEventHandler";

describe("Github Event Handler tests", () => {
  it("fake test", () => {
    expect(true).toBeTruthy();
  });

  it("should handle a pull request event", () => {
    vi.mock("./handlers", () => {
      return {
        success: vi.fn(),
        failure: vi.fn(),
      };
    });

    vi.mock("@supabase/supabase-js", () => {
      const SupabaseClient = vi.fn(() => {});
      return { SupabaseClient };
    });

    vi.mock("@slack/web-api", () => {
      const WebClient = vi.fn(() => {});
      return { WebClient };
    });

    const supabaseClient = new SupabaseClient("abc", "123");
    const slackClient = new WebClient("fake-token");

    const handler = new GithubEventHandler(
      supabaseClient,
      slackClient,
      "channelId",
      "slackToken",
      1234,
      "organizationId",
    );

    const spy = vi.spyOn(handler, "handleNewPr");

    const user: PullRequestOpenedEvent["sender"] = {
      login: "test-pr-user",
      id: 123,
      node_id: "node-id",
      avatar_url: "avatar_url",
      gravatar_id: "gravatar_id",
      url: "url",
      html_url: "html_url",
      followers_url: "followers_url",
      following_url: "following_url",
      gists_url: "gists_url",
      starred_url: "starred_url",
      subscriptions_url: "subscriptions_url",
      organizations_url: "organizations_url",
      repos_url: "repos_url",
      events_url: "events_url",
      received_events_url: "received_events_url",
      site_admin: false,
      type: "User",
    };

    const repository: PullRequestOpenedEvent["repository"] = {
      id: 123,
      node_id: "node-id",
      name: "test-repo",
      owner: user,
      web_commit_signoff_required: false,
      full_name: "test-repo",
      private: false,
      html_url: "html_url",
      description: "description",
      fork: false,
      url: "url",
      archive_url: "archive_url",
      assignees_url: "assignees_url",
      blobs_url: "blobs_url",
      branches_url: "branches_url",
      collaborators_url: "collaborators_url",
      comments_url: "comments_url",
      commits_url: "commits_url",
      compare_url: "compare_url",
      contents_url: "contents_url",
      contributors_url: "contributors_url",
      deployments_url: "deployments_url",
      downloads_url: "downloads_url",
      events_url: "events_url",
      forks_url: "forks_url",
      git_commits_url: "git_commits_url",
      git_refs_url: "git_refs_url",
      git_tags_url: "git_tags_url",
      git_url: "git_url",
      hooks_url: "hooks_url",
      issue_comment_url: "issue_comment_url",
      issue_events_url: "issue_events_url",
      issues_url: "issues_url",
      keys_url: "keys_url",
      labels_url: "labels_url",
      languages_url: "languages_url",
      merges_url: "merges_url",
      milestones_url: "milestones_url",
      notifications_url: "notifications_url",
      pulls_url: "pulls_url",
      releases_url: "releases_url",
      ssh_url: "ssh_url",
      stargazers_url: "stargazers_url",
      statuses_url: "statuses_url",
      subscribers_url: "subscribers_url",
      subscription_url: "subscription_url",
      tags_url: "tags_url",
      teams_url: "teams_url",
      trees_url: "trees_url",
      clone_url: "clone_url",
      mirror_url: "mirror_url",
      svn_url: "svn_url",
      homepage: "homepage",
      language: "language",
      forks_count: 0,
      stargazers_count: 0,
      watchers_count: 0,
      size: 0,
      default_branch: "default_branch",
      open_issues_count: 0,
      is_template: false,
      topics: [],
      has_issues: false,
      has_projects: false,
      has_wiki: false,
      has_pages: false,
      has_downloads: false,
      archived: false,
      disabled: false,
      visibility: "public",
      pushed_at: "pushed_at",
      created_at: "created_at",
      updated_at: "updated_at",
      license: null,
      forks: 0,
      open_issues: 0,
      watchers: 0,
      allow_forking: true,
    };

    const pullRequest: PullRequestOpenedEvent["pull_request"] = {
      url: "test-pr-url",
      id: 123,
      node_id: "node-id",
      html_url: "html_url",
      diff_url: "diff_url",
      patch_url: "patch_url",
      issue_url: "issue_url",
      closed_at: null,
      merged_at: null,
      mergeable: null,
      mergeable_state: "mergeable_state",
      merged: false,
      author_association: "COLLABORATOR",
      comments: 0,
      commits: 0,
      deletions: 0,
      additions: 0,
      changed_files: 0,
      merged_by: null,
      rebaseable: null,
      maintainer_can_modify: false,
      review_comments: 0,
      auto_merge: null,
      number: 1,
      locked: false,
      title: "test-pr-title",
      user: user,
      created_at: "created_at",
      updated_at: "updated_at",
      merge_commit_sha: "merge_commit_sha",
      draft: false,
      commits_url: "commits_url",
      review_comments_url: "review_comments_url",
      review_comment_url: "review_comment_url",
      comments_url: "comments_url",
      statuses_url: "statuses_url",
      state: "open",
      body: "This is the body of the PR",
      labels: [],
      milestone: null,
      active_lock_reason: null,
      assignee: null,
      assignees: [],
      requested_reviewers: [],
      requested_teams: [],
      head: {
        label: "head-label",
        ref: "head-ref",
        sha: "head-sha",
        user: user,
        repo: repository,
      },
      base: {
        label: "base-label",
        ref: "base-ref",
        sha: "base-sha",
        user: user,
        repo: repository,
      },
      _links: {
        self: {
          href: "self-href",
        },
        html: {
          href: "html-href",
        },
        issue: {
          href: "issue-href",
        },
        comments: {
          href: "comments-href",
        },
        review_comments: {
          href: "review_comments-href",
        },
        review_comment: {
          href: "review_comment-href",
        },
        commits: {
          href: "commits-href",
        },
        statuses: {
          href: "statuses-href",
        },
      },
    };

    const event: PullRequestOpenedEvent = {
      action: "opened",
      number: 1,
      sender: user,
      pull_request: pullRequest,
      repository,
    };

    handler.handleEvent(event);

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
