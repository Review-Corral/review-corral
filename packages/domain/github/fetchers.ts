import { User } from "@core/dynamodb/entities/types";
import { getJwt } from "@core/utils/jwt/createGithubJwt";
import ky from "ky";
import { Logger } from "../logging";
import {
  InstallationAccessTokenResponse,
  InstallationRespositoriesResponse,
  InstallationsData,
  OrgMembers,
  PullRequestInfoResponse,
  RepositoryPullRequestsResponse,
} from "./endpointTypes";

const LOGGER = new Logger("github.fetchers.ts");

const defaultHeaders = {
  "X-GitHub-Api-Version": "2022-11-28",
};

export const getUserInstallations = async (user: User): Promise<InstallationsData> =>
  await ky
    .get("https://api.github.com/user/installations", {
      headers: {
        ...defaultHeaders,
        Authorization: `token ${user.ghAccessToken}`,
      },
    })
    .json<InstallationsData>();

/**
 * Gets the installation access token for a given installation
 */
export const getInstallationAccessToken = async (
  installationId: number,
): Promise<InstallationAccessTokenResponse> => {
  const jwt = await getJwt();
  LOGGER.debug("JWT created", { jwt: jwt.compact() });
  const accessTokenResponse = await ky
    .post(`https://api.github.com/app/installations/${installationId}/access_tokens`, {
      headers: {
        ...defaultHeaders,
        Authorization: `Bearer ${jwt.compact()}`,
      },
    })
    .json<InstallationAccessTokenResponse>();

  return accessTokenResponse;
};

/**
 * Gets the repositories for a given installation. Must use the installation's
 * access token as apposed to the user's access token to retrieve
 */
export const getInstallationRepositories = async ({
  installationId,
  accessToken,
}: {
  installationId: number;
  accessToken?: string;
}): Promise<InstallationRespositoriesResponse> => {
  const installationAccessToken = accessToken
    ? { token: accessToken }
    : await getInstallationAccessToken(installationId);
  return await ky
    .get("https://api.github.com/installation/repositories", {
      headers: {
        ...defaultHeaders,
        Authorization: `Bearer ${installationAccessToken.token}`,
      },
    })
    .json<InstallationRespositoriesResponse>();
};

export const getRepositoryPullRequests = async ({
  orgName,
  repoName,
  accessToken,
}: {
  orgName: string;
  repoName: string;
  accessToken: string;
}): Promise<RepositoryPullRequestsResponse> => {
  return await ky
    .get(`https://api.github.com/repos/${orgName}/${repoName}/pulls`, {
      headers: {
        ...defaultHeaders,
        Authorization: `Bearer ${accessToken}`,
      },
    })
    .json<RepositoryPullRequestsResponse>();
};

/**
 * Gets the pull request info for a given pull request by it's URL
 */
export const getPullRequestInfo = async ({
  url,
  accessToken,
}: {
  url: string;
  accessToken: string;
}): Promise<PullRequestInfoResponse> => {
  return await ky
    .get(url, {
      headers: {
        ...defaultHeaders,
        Authorization: `Bearer ${accessToken}`,
      },
    })
    .json<PullRequestInfoResponse>();
};

export const getOrgMembers = async ({
  orgName,
  accessToken,
}: {
  orgName: string;
  accessToken: string;
}): Promise<OrgMembers> => {
  const members = await ky
    .get(`https://api.github.com/orgs/${orgName}/members`, {
      headers: {
        ...defaultHeaders,
        Authorization: `Bearer ${accessToken}`,
      },
    })
    .json<OrgMembers>();

  return members;
};
