import { Organization, Repository, User } from "@core/dynamodb/entities/types";
import { addOrganizationMemberFromUser } from "@domain/dynamodb/fetchers/members";
import {
  fetchOrganizationById,
  fetchUsersOrganizations,
  insertOrganizationAndAssociateUser,
  updateOrganizationInstallationId,
} from "@domain/dynamodb/fetchers/organizations";
import {
  fetchRepositoriesForOrganization,
  fetchRepository,
  insertRepository,
  removeRepository,
  setRespositoryActiveStatus,
} from "@domain/dynamodb/fetchers/repositories";
import { InstallationsData } from "@domain/github/endpointTypes";
import {
  getInstallationRepositories,
  getUserInstallations,
} from "@domain/github/fetchers";
import { Logger } from "@domain/logging";
import { Hono } from "hono";
import * as z from "zod";
import { authMiddleware, requireAuth } from "../middleware/auth";
import { Bindings, verifyGithubWebhookEvent } from "./handleWebhook";

const LOGGER = new Logger("github:routes");

export const app = new Hono<{ Bindings: Bindings }>();

const orgIdSchema = z.object({
  organizationId: z.string().transform(Number),
});

const repoSchema = z.object({
  organizationId: z.string().transform(Number),
  repositoryId: z.string().transform(Number),
});

// Webhook event route - no auth required but verified with webhook secret
app.post("/webhook-event", async (c, next) => await verifyGithubWebhookEvent(c, next));

// Create a group for authenticated routes
const authRoutes = new Hono();

// Apply authentication middleware to all authenticated routes
authRoutes.use(authMiddleware);
authRoutes.use(requireAuth);

// Get installations route
authRoutes.get("/installations", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  try {
    // Installations appear to have effectively a 1:1 mapping with organizations
    const installations = await getUserInstallations(user);

    LOGGER.debug("Installations fetch response: ", { installations });

    const organizations: Organization[] = await getOrganizations(user, installations);

    return c.json(organizations);
  } catch (error) {
    LOGGER.error("Error getting installations", { error });
    return c.json({ message: "Error getting installations" }, 500);
  }
});

// Get repositories route
authRoutes.get("/:organizationId/repositories", async (c) => {
  try {
    const { organizationId } = orgIdSchema.parse(c.req.param());

    const organization = await fetchOrganizationById(organizationId);

    if (!organization) {
      return c.json({ message: "Organization not found" }, 404);
    }

    const repositories = await getRepositories(organization);

    return c.json(repositories);
  } catch (error) {
    LOGGER.error("Error getting repositories", { error });
    return c.json({ message: "Error getting repositories" }, 500);
  }
});

// Set repository status route
authRoutes.put("/:organizationId/repositories/:repositoryId", async (c) => {
  try {
    const { organizationId, repositoryId } = repoSchema.parse(c.req.param());

    const repository = await fetchRepository({
      repoId: repositoryId,
      orgId: organizationId,
    });

    await setRespositoryActiveStatus({
      orgId: repository.orgId,
      repoId: repository.repoId,
      isEnabled: !repository.isEnabled,
    });

    return c.json({});
  } catch (error) {
    LOGGER.error("Error setting repository status", { error });
    return c.json({ message: "Error setting repository status" }, 500);
  }
});

// Helper functions
/**
 * Syncs the local database Organizations with the installations response from
 * GitHub, then returns the organizations the user has access to.
 */
async function getOrganizations(user: User, installations: InstallationsData) {
  const organizations: Organization[] = [];

  const usersOrganizations = await fetchUsersOrganizations(user.userId);
  const usersOrganizationsIds = usersOrganizations.map((org) => org.orgId);

  for (const installation of installations.installations) {
    // Try to see if we find an organization with the same id (account id)
    // as the installation's account_id
    if (!installation.account?.login) {
      LOGGER.warn("Installation found with no account info", { installation });
      continue;
    }

    const organization = await fetchOrganizationById(installation.account.id);

    if (organization) {
      LOGGER.debug("Found organization for installation", { organization });
      // We should update the installation ID if it's different
      if (organization.installationId !== installation.id) {
        updateOrganizationInstallationId({
          orgId: organization.orgId,
          installationId: installation.id,
        });
      }

      // If the user isn't part of the existing organization (m2m), then add them to
      // it. this can happen if someone else installed the app into an organization
      // that the user is part of.
      if (!usersOrganizationsIds.includes(organization.orgId)) {
        LOGGER.info(
          "User is not part of organization. Associating user with organization...",
        );
        await addOrganizationMemberFromUser({ orgId: organization.orgId, user });
      }

      organizations.push(organization);
    } else {
      LOGGER.info("No organization found for installation. Inserting...");
      const newOrg = await insertOrganizationAndAssociateUser({
        createOrgArgs: {
          orgId: installation.account.id,
          name: installation.account.login,
          avatarUrl: installation.account.avatar_url,
          installationId: installation.id,
          type: installation.account.type,
        },
        user,
      });
      organizations.push(newOrg);
    }
  }
  return organizations;
}

const getRepositories = async (organization: Organization): Promise<Repository[]> => {
  const repositories = await getInstallationRepositories({
    installationId: organization.installationId,
  });

  const allInstallRepos = await fetchRepositoriesForOrganization(organization.orgId);

  const allInstalledRepoIds = allInstallRepos.map((repo) => repo.repoId);

  const allOriginRepoIds = repositories.repositories.map((repo) => repo.id);

  const reposToInsert = repositories.repositories.filter(
    (repo) => !allInstalledRepoIds.includes(repo.id),
  );
  const reposToRemove = allInstalledRepoIds.filter(
    (id) => !allOriginRepoIds.includes(id),
  );

  const reposToReturn = allInstallRepos.filter((repo) =>
    allOriginRepoIds.includes(repo.repoId),
  );

  LOGGER.debug("Repos to insert/delete: ", {
    reposToInsert,
    reposToRemove,
  });

  // This is less effecient, but I'm inserting these one at a time so that we can do
  // an onConflictDoUpdate. This allows us to handle the edge case that the there was
  // a new installation setup for the same organization, which would result in us having
  // repos in the database for an old installation and now we'd be trying to insert them
  // again (and they'd have the same Ids)
  for (const repoToInsert of reposToInsert) {
    reposToReturn.push(
      await insertRepository({
        repoId: repoToInsert.id,
        name: repoToInsert.name,
        orgId: organization.orgId,
        isEnabled: false,
      }),
    );
  }

  for (const repoToRemoveId of reposToRemove) {
    await removeRepository({
      orgId: organization.orgId,
      repoId: repoToRemoveId,
    });
  }

  return reposToReturn;
};

// Merge the authenticated routes into main app
app.route("/", authRoutes);
