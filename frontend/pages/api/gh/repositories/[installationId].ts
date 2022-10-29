import { SupabaseClient, withApiAuth } from "@supabase/auth-helpers-nextjs";
import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";
import {
  getInstallationAccessToken,
  isValidBody,
} from "../../../../components/utils/apiUtils";
import { flattenParam } from "../../../../components/utils/flattenParam";
import { Database } from "../../../../database-types";
import { InstallationRepositories } from "../../../../github-types";

type GetRepositoriesRequest = {
  repositoryId: number;
  isActive: boolean;
};

export default withApiAuth<Database>(async function ProtectedRoute(
  req,
  res,
  supabaseServerClient,
) {
  const installationId: number = Number(flattenParam(req.query.installationId));

  if (!installationId) {
    return res.status(404);
  }
  console.info(
    "Got request for repositories for installation: ",
    installationId,
  );

  if (req.method === "GET") {
    return _handleGetRequest(req, res, supabaseServerClient, installationId);
  }

  if (req.method === "PUT") {
    return _handlePostRequest(req, res, supabaseServerClient, installationId);
  }

  return res.status(404).end();
});

type ApiResponseType = {
  error?: any;
  data?: any;
};

const _handleGetRequest = async (
  req: NextApiRequest,
  res: NextApiResponse<ApiResponseType>,
  supabaseServerClient: SupabaseClient<Database>,
  installationId: number,
) => {
  console.info(
    "Got GET request for repositories for installation: ",
    installationId,
  );

  const installationAccessToken = await getInstallationAccessToken(
    installationId,
  );

  console.info("Got installation access token");

  const installationRepos = await _getReposForInstallation(
    installationAccessToken.token,
  );

  if (installationRepos.repositories.length > 0) {
    const { data: currentRepos, error: currentReposError } =
      await supabaseServerClient
        .from("github_repositories")
        .select("*")
        .eq("installation_id", installationId);

    if (currentReposError) {
      console.error(
        "Got error getting current repositories for installation: ",
        installationId,
        currentReposError,
      );
      return res.status(400).send({ error: currentReposError });
    }

    type RepositoryInsertArgs =
      Database["public"]["Tables"]["github_repositories"]["Insert"];

    const { data: insertedRepositories, error: InsertReposError } =
      await supabaseServerClient
        .from("github_repositories")
        .insert(
          installationRepos.repositories
            .map((repo) => {
              if (!currentRepos?.find((r) => r.repository_id === repo.id)) {
                return {
                  repository_id: repo.id,
                  repository_name: repo.name,
                  installation_id: installationId,
                };
              }

              return undefined;
            })
            .filter((r): r is RepositoryInsertArgs => r !== undefined),
        )
        .select();

    if (InsertReposError) {
      console.error("Got error adding new repositories: ", InsertReposError);
      return res.status(400).end({ error: InsertReposError });
    }
    const payload = [...currentRepos, ...insertedRepositories];
    console.info("Going to return payload: ", payload);
    return res.status(200).send({ data: payload });
  }

  console.warn("No repositories found for installation");
  return res.status(200).send({ data: [] });
};

const _handlePostRequest = async (
  req: NextApiRequest,
  res: NextApiResponse<ApiResponseType>,
  supabaseServerClient: SupabaseClient<Database>,
  installationId: number,
) => {
  console.info(
    "Got POST request for repositories for installation: ",
    installationId,
  );

  if (
    !isValidBody<GetRepositoriesRequest>(req.body, ["repositoryId", "isActive"])
  ) {
    return res.status(402).send({ error: "Invalid body" });
  }

  const { error } = await supabaseServerClient
    .from("github_repositories")
    .update({ is_active: req.body.isActive })
    .eq("repository_id", req.body.repositoryId);

  if (error) {
    return res.status(400).send({ error });
  }
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
