import ky from "ky";
import { useUser } from "src/utils/useUser";
import { ApiHandler } from "sst/node/api";
import { Organization } from "../../../core/db/types";
import { InstallationsData } from "../../../core/github/endpointTypes";
import { Logger } from "../../../core/logging";

const LOGGER = new Logger("functions:installations");

export const getInstallations = ApiHandler(async (event, context) => {
  const { user, error } = await useUser();

  if (!user) {
    LOGGER.error("No user found in session", { error });
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized" }),
    };
  }

  // Installations appear to have effectively a 1:1 mapping with organizations
  const installations = await ky
    .get("https://api.github.com/user/installations", {
      headers: {
        Authorization: `token ${user.ghAccessToken}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    })
    .json<InstallationsData>();

  LOGGER.debug("Installations fetch response: ", { installations });

  const organizations: Organization[] = await getOrganizations(
    user,
    installations
  );

  return {
    statusCode: 200,
    body: JSON.stringify(organizations),
  };
});
