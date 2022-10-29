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
  const installationId: number = Number(flattenParam(req.query.installationId));

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
        return res.status(500).send({ error: currentReposError });
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
        return res.status(500).end(InsertReposError);
      }
      const payload = [...currentRepos, ...insertedRepositories];
      console.info("Going to return payload: ", payload);
      return res.status(200).send(payload);
    }

    console.warn("No repositories found for installation");
    return res.status(200).send([]);
  }

  return res.status(404).end();
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
