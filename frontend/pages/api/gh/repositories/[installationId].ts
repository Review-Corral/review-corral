import { withApiAuth } from "@supabase/auth-helpers-nextjs";
import axios from "axios";
import { getInstallationAccessToken } from "../../../../components/utils/apiUtils";
import { flattenParam } from "../../../../components/utils/flattenParam";
import { Database } from "../../../../database-types";
import { InstallationRepositories } from "../../../../github-types";

type GetRepositoriesRequest = {
  installationId: number;
};

export default withApiAuth<Database>(async function ProtectedRoute(
  req,
  res,
  supabaseServerClient,
) {
  const installationId = Number(flattenParam(req.query.installationId));

  if (!installationId) {
    return res.status(404);
  }
  console.info(
    "Got request for repositories for installation: ",
    installationId,
  );

  const { data } = await supabaseServerClient.auth.getSession();

  if (req.method === "GET") {
    // if (!isValidBody<GetRepositoriesRequest>(req.body, ["installationId"])) {
    //   return res.status(402).json({ error: "Invalid body" });
    // }
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
      const { data: repositories, error } = await supabaseServerClient
        .from("github_repositories")
        .insert(
          installationRepos.repositories.map((repo) => {
            return {
              repository_id: repo.id,
              repository_name: repo.name,
              installation_id: installationId,
            };
          }),
        )
        .select();

      if (error) {
        return res.status(500);
      }

      return res.status(200).json(repositories);
    }

    console.warn("No repositories found for installation");
    return res.status(200).json([]);
  }
});

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
