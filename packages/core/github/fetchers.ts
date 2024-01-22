import ky from "ky";
import { Organization, User } from "../db/types";
import { Logger } from "../logging";
import { getJwt } from "../utils/jwt/createGithubJwt";
import {
  InstallationAccessTokenResponse,
  InstallationRespositoriesResponse,
  InstallationsData,
  OrganizationMembersResponse,
} from "./endpointTypes";

const LOGGER = new Logger("github.fetchers.ts");

const defaultHeaders = {
  "X-GitHub-Api-Version": "2022-11-28",
};

export const getUserInstallations = async (
  user: User
): Promise<InstallationsData> =>
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
  installationId: number
): Promise<InstallationAccessTokenResponse> => {
  const jwt = await getJwt();
  LOGGER.debug("JWT created", { jwt: jwt.compact() });
  const accessTokenResponse = await ky
    .post(
      `https://api.github.com/app/installations/${installationId}/access_tokens`,
      {
        headers: {
          ...defaultHeaders,
          Authorization: `Bearer ${jwt.compact()}`,
        },
      }
    )
    .json<InstallationAccessTokenResponse>();

  LOGGER.debug("Access token response", { accessTokenResponse });
  return accessTokenResponse;
};

/**
 * Gets the repositories for a given installation. Must use the installation's
 * access token as apposed to the user's access token to retrieve
 */
export const getInstallationRepositories = async (
  installationId: number
): Promise<InstallationRespositoriesResponse> => {
  const installationAccessToken = await getInstallationAccessToken(
    installationId
  );
  return await ghInstallationQuery<InstallationRespositoriesResponse>({
    url: "https://api.github.com/installation/repositories",
    installationId,
  });
};

export async function getInstallationMembers(organization: Organization) {
  return await ghInstallationQuery<OrganizationMembersResponse>({
    url: `https://api.github.com/orgs/${organization.accountName}/members?per_page=100`,
    installationId: organization.installationId,
  });
}

async function ghInstallationQuery<TData>({
  installationId,
  url,
}: {
  installationId: number;
  url: string;
}) {
  const installationAccessToken = await getInstallationAccessToken(
    installationId
  );
  return await ky
    .get(url, {
      headers: {
        ...defaultHeaders,
        Authorization: `Bearer ${installationAccessToken.token}`,
      },
    })
    .json<TData>();
}
