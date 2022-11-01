import { withApiAuth } from "@supabase/auth-helpers-nextjs";
import { PostgrestResponse } from "@supabase/supabase-js";
import axios from "axios";
import { Database } from "../../../database-types";
import { InstallationsResponse } from "../../../github-api-types";

export default withApiAuth<Database>(async function ProtectedRoute(
  req,
  res,
  supabaseServerClient,
) {
  const { data } = await supabaseServerClient.auth.getSession();

  if (!data?.session?.user?.id) {
    return res.status(401).send({ error: "Unauthorized" });
  }

  console.log("Getting installations for user", data.session.user.id);

  const { data: user, error } = await supabaseServerClient
    .from("users")
    .select("*")
    .eq("id", data.session.user.id)
    .single();

  if (!user) {
    return res.status(404).send({
      error: `No user in user found for id: ${data.session.user.id} ${
        error && ". Error: " + error.message
      }`,
    });
  }

  // Run queries with RLS on the server
  const reponse = await axios.get<InstallationsResponse>(
    "https://api.github.com/user/installations",
    {
      headers: {
        Authorization: `token ${user.gh_access_token}`,
      },
    },
  );

  // Check that the available installations are in the database
  const organizations = await supabaseServerClient
    .from("users_and_organizations")
    .select("user_id, organizations(account_id, id, installation_id)")
    .eq("user_id", user.id);

  if (organizations.data !== null) {
    for (const installation of reponse.data.installations) {
      const foundInstallation = foundOrganization(
        installation.account.id,
        organizations,
      );

      // If the organization was found but the installation id is different,
      // update it
      if (
        foundInstallation &&
        foundInstallation.installationId !== installation.id
      ) {
        const { error } = await supabaseServerClient
          .from("organizations")
          .update({ installation_id: installation.id })
          .eq("id", foundInstallation.orgId);

        if (error) {
          res.status(500).send({
            error: `Error updating org installation id: ${error.message}`,
          });
        }
      }

      if (!foundInstallation) {
        const { data: newOrg, error } = await supabaseServerClient
          .from("organizations")
          .insert({
            account_id: installation.account.id,
            installation_id: installation.id,
            account_name: installation.account.login,
            avatar_url: installation.account.avatar_url,
            organization_type:
              installation.account.type === "User" ? "User" : "Organization",
          })
          .select();

        if (error) {
          res
            .status(500)
            .send({ error: `Error creating org: ${error.message}` });
        }

        if (newOrg) {
          await supabaseServerClient
            .from("users_and_organizations")
            .insert({
              user_id: user.id,
              org_id: newOrg[0].id,
            })
            .eq("user_id", user.id);
        }
      }
    }
  }

  res.json(reponse.data);
});

const foundOrganization = (
  accountId: number,
  organization: PostgrestResponse<
    {
      user_id: string;
    } & {
      organizations:
        | ({
            account_id: number;
          } & {
            id: string;
          } & {
            installation_id: number;
          })
        | ({
            account_id: number;
          } & {
            id: string;
          } & {
            installation_id: number;
          })[]
        | null;
    }
  >,
): { orgId: string; installationId: number } | undefined => {
  if (organization.data) {
    for (const org of organization.data) {
      if (Array.isArray(org.organizations)) {
        for (const org2 of org.organizations) {
          if (org2.account_id === accountId) {
            return { orgId: org2.id, installationId: org2.installation_id };
          }
        }
      } else {
        if (org.organizations?.account_id === accountId) {
          return {
            orgId: org.organizations.id,
            installationId: org.organizations.installation_id,
          };
        }
      }
    }
  }

  return undefined;
};
