import { updateMemberSchema } from "@core/fetchTypes/updateOrgMember";
import { OrgMembers } from "@domain/github/endpointTypes";
import { getInstallationAccessToken, getOrgMembers } from "@domain/github/fetchers";
import { Logger } from "@domain/logging";
import {
  type MemberWithUser,
  addOrganizationMembers,
  getOrganizationMembers,
  updateOrgMemberSlackId,
} from "@domain/postgres/fetchers/members";
import { getOrganization } from "@domain/postgres/fetchers/organizations";
import { insertUser } from "@domain/postgres/fetchers/users";
import { Organization } from "@domain/postgres/schema";
import { getBillingDetails } from "@domain/selectors/organization/getBillingDetails";
import { Hono } from "hono";
import * as z from "zod";
import { authMiddleware, requireAuth } from "../middleware/auth";

const LOGGER = new Logger("organization:routes");

export const app = new Hono();

// Schema definitions
const orgIdSchema = z.object({
  organizationId: z.string().transform(Number),
});

// Apply authentication middleware to all organization routes
app.use("*", authMiddleware, requireAuth);

// Get organization details
app.get("/:organizationId", async (c) => {
  try {
    const { organizationId } = orgIdSchema.parse(c.req.param());

    const organization = await getOrganization(organizationId);

    if (!organization) {
      return c.json({ message: "Organization not found" }, 404);
    }

    if (organization.type === "Organization") {
      await syncOrgMembers(organization);
    }

    return c.json(organization);
  } catch (error) {
    LOGGER.error("Error getting organization", { error });
    return c.json({ message: "Error getting organization" }, 500);
  }
});

// Get organization billing details
app.get("/:organizationId/billing", async (c) => {
  try {
    const { organizationId } = orgIdSchema.parse(c.req.param());

    const organization = await getOrganization(organizationId);

    if (!organization) {
      return c.json({ message: "Organization not found" }, 404);
    }

    const billingDetails = await getBillingDetails(organization);
    return c.json(billingDetails);
  } catch (error) {
    LOGGER.error("Error getting organization billing details", { error });
    return c.json({ message: "Error getting organization billing details" }, 500);
  }
});

// Get organization members
app.get("/:organizationId/members", async (c) => {
  try {
    const { organizationId } = orgIdSchema.parse(c.req.param());

    const organization = await getOrganization(organizationId);

    if (!organization) {
      return c.json({ message: "Organization not found" }, 404);
    }

    const members = await getOrganizationMembers(organization.id);

    return c.json(members);
  } catch (error) {
    LOGGER.error("Error getting organization members", { error });
    return c.json({ message: "Error getting organization members" }, 500);
  }
});

// Update organization member
app.put("/:organizationId/member", async (c) => {
  try {
    const { organizationId } = orgIdSchema.parse(c.req.param());

    const organization = await getOrganization(organizationId);

    if (!organization) {
      return c.json({ message: "Organization not found" }, 404);
    }

    try {
      const body = await c.req.json();
      const parsedBody = updateMemberSchema.parse(body);

      await updateOrgMemberSlackId({
        orgId: parsedBody.orgId,
        userId: parsedBody.memberId,
        slackId: parsedBody.slackId,
      });

      // Return success - Postgres version doesn't return the updated member
      return c.json({ success: true });
    } catch (error) {
      LOGGER.error("Invalid request body", { error });
      return c.json({ message: "Invalid request body" }, 400);
    }
  } catch (error) {
    LOGGER.error("Error updating organization member", { error });
    return c.json({ message: "Error updating organization member" }, 500);
  }
});

// Helper functions
/**
 * Sync the members in Github into the database
 */
const syncOrgMembers = async (organization: Organization) => {
  LOGGER.info("Syncing members for organization", {
    organizationId: organization.id,
  });

  const accessToken = await getInstallationAccessToken(organization.installationId);

  LOGGER.debug("Got installation access token", {
    organizationId: organization.id,
    orgName: organization.name,
    isToken: !!accessToken,
  });

  // Load the organizations members
  const members = await getOrgMembers({
    orgName: organization.name,
    accessToken: accessToken.token,
  });

  const dbMembers = await getOrganizationMembers(organization.id);

  const { toAdd } = reduceOrgMembers(members, dbMembers);

  if (toAdd.length > 0) {
    LOGGER.info("Adding members to database", {
      organizationId: organization.id,
      existingMembers: dbMembers.length,
      toAdd: toAdd,
    });

    // First ensure all users exist in the users table
    for (const member of toAdd) {
      await insertUser(
        {
          id: member.id,
          login: member.login,
          email: member.email ?? null,
          avatar_url: member.avatar_url,
        },
        null, // Empty access token for org members added via sync
      );
    }

    // Then add them to the organization_members junction table
    const membersToInsert = toAdd.map((member) => ({
      orgId: organization.id,
      userId: member.id,
    }));
    await addOrganizationMembers(membersToInsert);
  }
};

const reduceOrgMembers = (ghMembers: OrgMembers, dbMembers: MemberWithUser[]) => {
  const dbMembersMap = dbMembers.reduce(
    (acc, m) => {
      acc[m.userId] = m;
      return acc;
    },
    {} as Record<number, MemberWithUser>,
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
