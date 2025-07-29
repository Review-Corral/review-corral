import { Endpoints } from "@octokit/types";

export type UserResponse = Endpoints["GET /user"]["response"]["data"];

export type InstallationAccessTokenResponse =
  Endpoints["POST /app/installations/{installation_id}/access_tokens"]["response"]["data"];

export type InstallationRespositoriesResponse =
  Endpoints["GET /installation/repositories"]["response"]["data"];

export type RepositoryPullRequestsResponse =
  Endpoints["GET /repos/{owner}/{repo}/pulls"]["response"]["data"];

export type PullRequestInfoResponse =
  Endpoints["GET /repos/{owner}/{repo}/pulls/{pull_number}"]["response"]["data"];

export type OrgMembers = Endpoints["GET /orgs/{org}/members"]["response"]["data"];

export type PullRequestReviewCommentsResponse =
  Endpoints["GET /repos/{owner}/{repo}/pulls/{pull_number}/comments"]["response"]["data"];

export type PullRequestReviewsResponse =
  Endpoints["GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews"]["response"]["data"];

export type BranchProtectionResponse =
  Endpoints["GET /repos/{owner}/{repo}/branches/{branch}/protection"]["response"]["data"];

export type PullRequestCheckRunsResponse =
  Endpoints["GET /repos/{owner}/{repo}/commits/{ref}/check-runs"]["response"]["data"];

// For some of these types, I'm manually creating the types instead of using Octokit
// because it's currently giving me the wrong result even though it was just installed
// at the day of writing.
// Getting the types from here:
// https://docs.github.com/en/rest/apps/installations?apiVersion=2022-11-28

/**
 * Represents an account in the installation.
 */
export type Account = {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: "Organization" | "User";
  site_admin: boolean;
};

/**
 * Represents the permissions in the installation.
 */
export type Permission = {
  checks: string;
  metadata: string;
  contents: string;
};

/**
 * Represents an installation.
 */
export type Installation = {
  id: number;
  account: Account;
  access_tokens_url: string;
  repositories_url: string;
  html_url: string;
  app_id: number;
  target_id: number;
  target_type: string;
  permissions: Permission;
  events: string[];
  single_file_name: string;
  has_multiple_single_files: boolean;
  single_file_paths: string[];
  repository_selection: string;
  created_at: string;
  updated_at: string;
  app_slug: string;
  suspended_at: null | string;
  suspended_by: null | string;
};

/**
 * Represents the entire structure of the installations data.
 */
export type InstallationsData = {
  total_count: number;
  installations: Installation[];
};
