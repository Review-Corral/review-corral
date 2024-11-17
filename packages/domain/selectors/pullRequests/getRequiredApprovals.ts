import { fetchBranch, insertBranch } from "@domain/dynamodb/fetchers/branches";
import {
  getInstallationAccessToken,
  getPrRequiredApprovalsCount,
} from "@domain/github/fetchers";
import { LOGGER } from "@domain/github/webhooks/handlers/pullRequest";
import { BaseGithubWebhookEventHanderArgs } from "@domain/github/webhooks/types";
import { RequiredApprovalsQueryPayloadArg } from "@domain/slack/mainMessage";
import { HTTPError } from "ky";

/**
 * Tries to get the required approvals count our cache, or from GH if not in cache
 */
export async function tryGetPrRequiredApprovalsCount(args: {
  repository: {
    id: number;
    url: string;
  };
  pullRequest: {
    id: number;
    url: string;
    base: {
      ref: string;
    };
  };
  baseProps: BaseGithubWebhookEventHanderArgs;
}): Promise<RequiredApprovalsQueryPayloadArg> {
  const branch = await fetchBranch({
    repoId: args.repository.id,
    branchName: args.pullRequest.base.ref,
  });

  if (branch?.requiredApprovals) {
    return { count: branch.requiredApprovals };
  }

  if (!branch) {
    // Fetch from GH directly and then save
    const requiredApprovals = await tryFetchPrRequiredApprovalsCountFromGh(args);

    if (requiredApprovals !== null) {
      await insertBranch({
        repoId: args.repository.id,
        branchName: args.pullRequest.base.ref,
        name: args.pullRequest.base.ref,
        requiredApprovals,
      });

      return { count: requiredApprovals };
    }

    return null;
  }

  return null;
}
/**
 * Getting the required approvals requires a new permission which the installed GH app
 * may not have accepted yet. Handle this case gracefully by returning null.
 */

async function tryFetchPrRequiredApprovalsCountFromGh(
  args: Parameters<typeof tryGetPrRequiredApprovalsCount>[0],
): Promise<number | null> {
  const accessToken = await getInstallationAccessToken(args.baseProps.installationId);

  try {
    return await getPrRequiredApprovalsCount({
      repository: args.repository,
      pullRequest: args.pullRequest,
      accessToken: accessToken.token,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "HTTPError") {
      if ((error as HTTPError).response.status === 403) {
        LOGGER.warn(
          "Got 403 when trying to get required approvals count. This probably means the new permissions haven't been accepted yet",
          {
            repoId: args.repository.id,
            prId: args.pullRequest.id,
          },
        );
        return null;
      } else {
        LOGGER.warn("Got HTTP error when trying to get required approvals count", {
          repoId: args.repository.id,
          prId: args.pullRequest.id,
        });
      }
    }
    throw error;
  }
}
