import ky from "ky";
import { useUser } from "src/utils/useUser";
import { ApiHandler } from "sst/node/api";
import {
  associateOrganizationWithUser,
  fetchOrganizationByAccountId,
  fetchUsersOrganizations,
  insertOrganizationAndAssociateUser,
  updateOrganizationInstallationId,
} from "../../../core/db/fetchers/organizations";
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

  const organizations: Organization[] = [];

  // The organizations a user is currently mapped to via the m2m table
  const usersOrganizations = await fetchUsersOrganizations(user.id);
  const usersOrganizationsIds = usersOrganizations.map((org) => org.id);

  for (const installation of installations.installations) {
    // Try to see if we find an organization with the same id (account id)
    // as the installation's account_id
    if (!installation.account?.login) {
      LOGGER.warn("Installation found with no account info", { installation });
      continue;
    }

    const organization = await fetchOrganizationByAccountId(
      installation.account.id
    );

    if (organization) {
      LOGGER.debug("Found organization for installation", { organization });
      // We should update the installation ID if it's different
      if (organization.installationId !== installation.id) {
        updateOrganizationInstallationId({
          id: organization.id,
          installationId: installation.id,
        });
      }

      // If the user isn't part of the existing organization (m2m), then add them to
      // it. this can happen if someone else installed the app into an organization
      // that the user is part of.
      if (!usersOrganizationsIds.includes(organization.id)) {
        LOGGER.info(
          "User is not part of organization. Associating user with organization..."
        );
        associateOrganizationWithUser(organization, user);
      }

      organizations.push(organization);
    } else {
      LOGGER.info("No organization found for installation. Inserting...");
      const newOrg = await insertOrganizationAndAssociateUser(
        {
          id: installation.account.id,
          accountName: installation.account.login,
          avatarUrl: installation.account.avatar_url,
          installationId: installation.id,
          organizationType: installation.account.type,
        },
        user
      );
      organizations.push(newOrg);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify(organizations),
  };
});
