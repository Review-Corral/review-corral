import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import axios from "axios";
import { withAxiom } from "next-axiom";
import { AxiomRequest } from "next-axiom/dist/withAxiom";
import { cookies } from "next/headers";
import { useSearchParams } from "next/navigation";
import { NextResponse } from "next/server";
import { flattenParam } from "../../../../components/utils/flattenParam";
import {
  getInstallationAccessToken,
  isValidBody,
} from "../../../../services/utils/apiUtils";
import { Database } from "../../../../types/database-types";
import { InstallationRepositories } from "../../../../types/github-api-types";

export type PutRepositoryArgs = {
  repositoryId: number;
  isActive: boolean;
};

type RepositoryInsertArgs =
  Database["public"]["Tables"]["github_repositories"]["Insert"];

export const GET = withAxiom(async (req: AxiomRequest) => {
  const searchParams = useSearchParams();

  const installationId = Number(
    flattenParam(searchParams?.get("installationId") || undefined),
  );
  const supabaseServerClient = createRouteHandlerClient<Database>({ cookies });

  if (!installationId) {
    return NextResponse.json(
      { error: "No installation id provided" },
      { status: 400 },
    );
  }
  req.log.info("Got request for repositories for installation: ", {
    installationId,
  });

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
    return NextResponse.json({ error: organizationError }, { status: 500 });
  }

  if (!organizationData?.id) {
    return NextResponse.json(
      { error: "Organization not found" },
      { status: 404 },
    );
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
        {
          installationId,
          error: currentReposError,
        },
      );
      return NextResponse.json({ error: currentReposError }, { status: 500 });
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
      return NextResponse.json({ error: InsertReposError }, { status: 500 });
    }
    const payload = [...(orgsRepos ?? []), ...(insertedRepositories ?? [])];
    return NextResponse.json({ data: payload }, { status: 200 });
  }

  req.log.warn("No repositories found for installation", { installationId });
  return NextResponse.json({ data: [] }, { status: 200 });
});

export const PUT = withAxiom(async (req: AxiomRequest) => {
  const searchParams = useSearchParams();

  const installationId = Number(
    flattenParam(searchParams?.get("installationId") || undefined),
  );
  const supabaseServerClient = createRouteHandlerClient<Database>({ cookies });

  if (!installationId) {
    return NextResponse.json(
      { error: "No installation id provided" },
      { status: 400 },
    );
  }
  req.log.info("Got request for repositories for installation: ", {
    installationId,
  });

  req.log.info("Got POST request for repositories for installation: ", {
    installationId,
  });

  if (!isValidBody<PutRepositoryArgs>(req.body, ["repositoryId", "isActive"])) {
    return NextResponse.json({ error: "Invalid body" }, { status: 402 });
  }

  const { error } = await supabaseServerClient
    .from("github_repositories")
    .update({ is_active: req.body.isActive })
    .eq("repository_id", req.body.repositoryId);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ data: null }, { status: 200 });
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
