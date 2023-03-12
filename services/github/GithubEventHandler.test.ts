import { WebClient } from "@slack/web-api";
import { SupabaseClient } from "@supabase/supabase-js";
import { OwnerOrUserOrSender, Repository } from "types/github-event-types";
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

    const user: OwnerOrUserOrSender = {
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
      type: "type",
      site_admin: false,
    };

    const repo: Repository = {
      // finish all the properties
      id: 123,
      node_id: "node-id",
      name: "name",
      full_name: "full_name",
      private: false,
      owner: user,
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
      hooks_url: "hooks_url",
      svn_url: "svn_url",
      homepage: "homepage",
      language: "language",
      forks_count: 123,
      stargazers_count: 123,
      watchers_count: 123,
      size: 123,
      default_branch: "default_branch",
      open_issues_count: 123,
      is_template: false,
      topics: ["topic1", "topic2"],
      has_issues: false,
      has_projects: false,
      has_wiki: false,
      has_pages: false,
      has_downloads: false,
      archived: false,
      disabled: false,
      visibility: "visibility",
      pushed_at: "pushed_at",
      created_at: "created_at",
    };

    handler.handleEvent({
      action: "opened",
      number: 123,
      pull_request: {
        url: "test-pr-url",
        id: 123,
        node_id: "node-id",
        html_url: "html_url",
        diff_url: "diff_url",
        patch_url: "patch_url",
        issue_url: "issue_url",
        number: 1,
        state: "state",
        locked: false,
        title: "test-pr-title",
        user: user,
        created_at: "created_at",
        updated_at: "updated_at",
        closed_at: "closed_at",
        merged_at: undefined,
        merge_commit_sha: "merge_commit_sha",
        draft: false,
        commits_url: "commits_url",
        review_comments_url: "review_comments_url",
        review_comment_url: "review_comment_url",
        comments_url: "comments_url",
        statuses_url: "statuses_url",
      },
      repository: repo,
    });

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
