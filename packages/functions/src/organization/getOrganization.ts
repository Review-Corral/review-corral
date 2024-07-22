import { Member, Organization } from "@core/dynamodb/entities/types";
import {
  addOrganizationMembers,
  getOrganizationMembers as fetchOrgMembers,
} from "@domain/dynamodb/fetchers/members";
import { fetchOrganizationById } from "@domain/dynamodb/fetchers/organizations";
import { OrgMembers } from "@domain/github/endpointTypes";
import { getInstallationAccessToken, getOrgMembers } from "@domain/github/fetchers";
import { Logger } from "@domain/logging";
import { useUser } from "src/utils/useUser";
import { ApiHandler } from "sst/node/api";
import * as z from "zod";

const LOGGER = new Logger("organization:getOrganization");

const getRepositoriesForOrganizationSchena = z.object({
  organizationId: z.string(),
});

export const handler = ApiHandler(async (event, _context) => {
  const { organizationId } = getRepositoriesForOrganizationSchena.parse(
    event.pathParameters,
  );
  const { user, error } = await useUser();

  if (!user) {
    LOGGER.error("No user found in session", { error });
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized" }),
    };
  }

  const organization = await fetchOrganizationById(Number(organizationId));

  if (!organization) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "Organization not found" }),
    };
  }

  if (organization.type === "Organization") {
    await syncOrgMembers(organization);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(organization),
  };
});

/**
 * Sync the members in Github into the database
 */
const syncOrgMembers = async (organization: Organization) => {
  LOGGER.info("Syncing members for organization", {
    organizationId: organization.orgId,
  });

  const accessToken = await getInstallationAccessToken(organization.installationId);

  LOGGER.debug("Got installation access token", {
    organizationId: organization.orgId,
    orgName: organization.name,
    isToken: !!accessToken,
  });

  // Load the organizations members
  const members = await getOrgMembers({
    orgName: organization.name,
    accessToken: accessToken.token,
  });

  const dbMembers = await fetchOrgMembers(organization.orgId);

  const { toAdd } = reduceOrgMembers(members, dbMembers);

  if (toAdd.length > 0) {
    LOGGER.info("Adding members to database", {
      organizationId: organization.orgId,
      existingMembers: dbMembers.length,
      toAdd: toAdd,
    });

    await addOrganizationMembers(organization.orgId, toAdd);
  }
};

const reduceOrgMembers = (ghMembers: OrgMembers, dbMembers: Member[]) => {
  const dbMembersMap = dbMembers.reduce(
    (acc, m) => {
      acc[m.memberId] = m;
      return acc;
    },
    {} as Record<number, Member>,
  );

  const toAdd: OrgMembers = [];

  // TODO: support removing members who aren't in the org anymore

  for (const ghMember of ghMembers) {
    if (!dbMembersMap[ghMember.id]) {
      toAdd.push(ghMember);
    }
  }

  return { toAdd };
};
