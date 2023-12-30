import ky from "ky";
import { User } from "../db/types";
import { InstallationsData } from "./endpointTypes";

const defaultHeaders = {
  "X-GitHub-Api-Version": "2022-11-28",
};

export const getUserInstallations = async (user: User) =>
  await ky
    .get("https://api.github.com/user/installations", {
      headers: {
        ...defaultHeaders,
        Authorization: `token ${user.ghAccessToken}`,
      },
    })
    .json<InstallationsData>();

export const getInstallationAccessToken = async () => {
  await ky.post(
    "https://api.github.com/app/installations/${installationId}/access_tokens"
  );
};

/**
 * Gets the repositories for a given installation. Must use the installation's
 * access token as apposed to the user's access token to retrieve
 */
export const getInstallationRepositories = async (
  installationAccessToken: string
) =>
  await ky
    .get("https://api.github.com/installation/repositoriess", {
      headers: {
        ...defaultHeaders,
        Authorization: `token ${installationAccessToken}`,
      },
    })
    .json();
