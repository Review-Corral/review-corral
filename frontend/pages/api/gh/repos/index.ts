import { withApiAuth } from "@supabase/auth-helpers-nextjs";
import axios from "axios";
import {
  getInstallationAccessToken,
  isValidBody,
} from "../../../../components/utils/apiUtils";
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
  const { data } = await supabaseServerClient.auth.getSession();

  if (req.method === "GET") {
    if (!isValidBody<GetRepositoriesRequest>(req.body, ["installationId"])) {
      return res.status(402).json({ error: "Invalid body" });
    }

    const installationAccessToken = await getInstallationAccessToken(
      req.body.installationId,
    );

    const installationRepos = await _getReposForInstallation(
      installationAccessToken.token,
    );

    if (installationRepos.repositories.length > 0) {
      await supabaseServerClient.from("github_repositories").insert(
        installationRepos.repositories.map((repo) => {
          return {
            repository_id: repo.id,
            repository_name: repo.name,
            installation_id: req.body.installationId,
          };
        }),
      );
    }

    const { data, error } = await supabaseServerClient
      .from("github_repositories")
      .select("*")
      .eq("installation_id", req.body.installationId);

    return res.status(200).json(data);
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
      console.log("Got error getting repository info: ", error);
      throw error;
    });
};
