import { SupabaseClient } from "@supabase/auth-helpers-nextjs";
import axios from "axios";
import { NextApiResponse } from "next";
import { withAxiom } from "next-axiom";
import { AxiomAPIRequest } from "next-axiom/dist/withAxiom";
import { flattenParam } from "../../../../components/utils/flattenParam";
import {
  getInstallationAccessToken,
  isValidBody,
} from "../../../../services/utils/apiUtils";
import { withProtectedApi } from "../../../../services/utils/withProtectedApi";
import { Database } from "../../../../types/database-types";
import { InstallationRepositories } from "../../../../types/github-api-types";

export type PutRepositoryArgs = {
  repositoryId: number;
  isActive: boolean;
};

type RepositoryInsertArgs =
  Database["public"]["Tables"]["github_repositories"]["Insert"];

export default withAxiom(
  withProtectedApi(async function ProtectedRoute(
    req,
    res,
    supabaseServerClient,
  ) {
    const installationId: number = Number(
      flattenParam(req.query.installationId),
    );

    if (!installationId) {
      return res.status(404);
    }
    req.log.info(
      "Got request for repositories for installation: ",
      installationId,
    );

    if (req.method === "GET") {
      return _handleGetRequest(req, res, supabaseServerClient, installationId);
    }

    if (req.method === "PUT") {
      return _handlePutRequest(req, res, supabaseServerClient, installationId);
    }

    return res.status(404).end();
  }),
);

type ApiResponseType = {
  error?: any;
  data?: any;
};

const _handleGetRequest = async (
  req: AxiomAPIRequest,
  res: NextApiResponse<ApiResponseType>,
  supabaseServerClient: SupabaseClient<Database>,
  installationId: number,
) => {
  req.log.info("Got GET request for repositories for installation: ", {
    installationId,
  });

  const { data: organizationData, error: organizationError } =
    await supabaseServerClient
      .from("organizations")
      .select("id")
      .eq("installation_id", installationId)
      .limit(1)
      .single();

  if (organizationError) {
    return res.status(500).send({ error: organizationError });
  }

  if (!organizationData?.id) {
    return res.status(404).send({ error: "Organization not found" });
  }

  const installationAccessToken = await getInstallationAccessToken(
    installationId,
  );

  const installation = await _getReposForInstallation(
    installationAccessToken.token,
  );

  if (installation.repositories.length > 0) {
    const { data: orgsRepos, error: currentReposError } =
      await supabaseServerClient
        .from("github_repositories")
        .select("*")
        .eq("organization_id", organizationData.id);

    if (currentReposError) {
      req.log.error(
        "Got error getting current repositories for installation: ",
        { installationId, error: currentReposError },
      );
      return res.status(400).send({ error: currentReposError });
    }

    // If the repository ID is found again, but it has a new installation id,
    // update it instead.
    // This can happen if the user uninstalls the Github app, and then installs
    // it again for the same repositoires
    if (installation.repositories && orgsRepos) {
      for (let installationRepo of installation.repositories) {
        const mistmatchedInstalltionIds = orgsRepos?.filter(
          (orgRepo) =>
            installationRepo.id === orgRepo.repository_id &&
            installationId !== orgRepo.installation_id,
        );

        for (let mismatchedRepo of mistmatchedInstalltionIds) {
          await supabaseServerClient
            .from("github_repositories")
            .update({
              installation_id: installationId,
            })
            .eq("id", mismatchedRepo.id);
        }
      }
    }

    const { data: insertedRepositories, error: InsertReposError } =
      await supabaseServerClient
        .from("github_repositories")
        .insert(
          installation.repositories
            .map((repo) => {
              if (!orgsRepos?.find((r) => r.repository_id === repo.id)) {
                return {
                  repository_id: repo.id,
                  repository_name: repo.name,
                  installation_id: installationId,
                  organization_id: organizationData.id,
                };
              }

              return undefined;
            })
            .filter((r): r is RepositoryInsertArgs => r !== undefined),
        )
        .select();

    if (InsertReposError) {
      req.log.error("Got error adding new repositories: ", {
        InsertReposError,
      });
      return res.status(400).end({ error: InsertReposError });
    }
    const payload = [...(orgsRepos ?? []), ...(insertedRepositories ?? [])];
    return res.status(200).send({ data: payload });
  }

  req.log.warn("No repositories found for installation", { installationId });
  return res.status(200).send({ data: [] });
};

const _handlePutRequest = async (
  req: AxiomAPIRequest,
  res: NextApiResponse<ApiResponseType>,
  supabaseServerClient: SupabaseClient<Database>,
  installationId: number,
) => {
  req.log.info("Got POST request for repositories for installation: ", {
    installationId,
  });

  if (!isValidBody<PutRepositoryArgs>(req.body, ["repositoryId", "isActive"])) {
    return res.status(402).send({ error: "Invalid body" });
  }

  const { error } = await supabaseServerClient
    .from("github_repositories")
    .update({ is_active: req.body.isActive })
    .eq("repository_id", req.body.repositoryId);

  if (error) {
    return res.status(400).send({ error });
  }

  return res.status(200).send({ data: null });
};

const _getReposForInstallation = async (
  installationAccessToken: string,
): Promise<InstallationRepositories> => {
  return axios
    .get<InstallationRepositories>(
      "https://api.github.com/installation/repositories",
      {
        headers: {
          Authorization: `bearer ${installationAccessToken}`,
        },
      },
    )
    .then((repository) => {
      return repository.data;
    })
    .catch((error) => {
      console.error("Got error getting repositories for installation: ", error);
      throw error;
    });
};
