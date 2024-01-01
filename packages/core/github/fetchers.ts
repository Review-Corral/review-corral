import ky from "ky";
import { User } from "../db/types";
import { Logger } from "../logging";
import { getJwt } from "../utils/jwt/createGithubJwt";
import {
  InstallationAccessTokenResponse,
  InstallationRespositoriesResponse,
  InstallationsData,
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
  return await ky
    .get("https://api.github.com/installation/repositories", {
      headers: {
        ...defaultHeaders,
        Authorization: `Bearer ${installationAccessToken.token}`,
      },
    })
    .json<InstallationRespositoriesResponse>();
};
