import { Member, Organization } from "@core/dynamodb/entities/types";
import { updateMemberSchema } from "@core/fetchTypes/updateOrgMember";
import {
  addOrganizationMembers,
  getOrganizationMembers,
  getOrganizationMembers as fetchOrgMembers,
  updateOrgMember
} from "@domain/dynamodb/fetchers/members";
import { fetchOrganizationById } from "@domain/dynamodb/fetchers/organizations";
import { OrgMembers } from "@domain/github/endpointTypes";
import { getInstallationAccessToken, getOrgMembers } from "@domain/github/fetchers";
import { Logger } from "@domain/logging";
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
    
    const organization = await fetchOrganizationById(organizationId);

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
    
    const organization = await fetchOrganizationById(organizationId);

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
    
    const organization = await fetchOrganizationById(organizationId);

    if (!organization) {
      return c.json({ message: "Organization not found" }, 404);
    }

    const members = await getOrganizationMembers(organization.orgId);
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
    
    const organization = await fetchOrganizationById(organizationId);

    if (!organization) {
      return c.json({ message: "Organization not found" }, 404);
    }

    try {
      const body = await c.req.json();
      const parsedBody = updateMemberSchema.parse(body);
      
      const newMember = await updateOrgMember(parsedBody);
      return c.json(newMember);
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