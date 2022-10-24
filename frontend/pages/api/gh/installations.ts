// pages/api/protected-route.js
import { withApiAuth } from "@supabase/auth-helpers-nextjs";
import { PostgrestResponse } from "@supabase/supabase-js";
import axios from "axios";
import { Database } from "../../../dabatabase-types";
import { InstallationsResponse } from "../../../github-types";

export default withApiAuth<Database>(async function ProtectedRoute(
  req,
  res,
  supabaseServerClient,
) {
  const { data } = await supabaseServerClient.auth.getSession();

  if (!data?.session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const result = await supabaseServerClient
    .from("users")
    .select("*")
    .eq("id", data.session.user.id);

  // Run queries with RLS on the server

  const reponse = await axios.get<InstallationsResponse>(
    "https://api.github.com/user/installations",
    {
      headers: {
        Authorization: `token ${result?.data?.[0].gh_access_token}`,
      },
    },
  );

  // Check that the available installations are in the database
  const organizations = await supabaseServerClient
    .from("users_and_organizations")
    .select("user_id, organizations(account_id, id, installation_id)")
    .eq("user_id", data?.session?.user?.id);

  if (organizations.data !== null) {
    for (const installation of reponse.data.installations) {
      const foundInstallation = foundOrganization(
        installation.account.id.toString(),
        organizations,
      );

      // If the organization was found but the installation id is different,
      // update it
      if (
        foundInstallation &&
        foundInstallation.installationId !== installation.id.toString()
      ) {
        const { error } = await supabaseServerClient
          .from("organizations")
          .update({ installation_id: installation.id.toString() })
          .eq("id", foundInstallation.orgId);

        if (error) {
          res.status(500).json({
            error: `Error updating org installation id: ${error.message}`,
          });
        }
      }

      if (!foundInstallation) {
        const { data: newOrg, error } = await supabaseServerClient
          .from("organizations")
          .insert({
            account_id: installation.account.id.toString(),
            installation_id: installation.id.toString(),
            account_name: installation.account.login,
            avatar_url: installation.account.avatar_url,
          })
          .select();

        if (error) {
          res
            .status(500)
            .json({ error: `Error creating org: ${error.message}` });
        }

        if (newOrg) {
          await supabaseServerClient
            .from("users_and_organizations")
            .insert({
              user_id: data.session.user.id,
              org_id: newOrg[0].id,
            })
            .eq("user_id", data?.session?.user?.id);
        }
      }
    }
  }

  res.json(reponse.data);
});

const foundOrganization = (
  installationId: string,
  organization: PostgrestResponse<
    {
      user_id: string;
    } & {
      organizations:
        | ({
            account_id: string;
          } & {
            id: string;
          } & {
            installation_id: string;
          })
        | ({
            account_id: string;
          } & {
            id: string;
          } & {
            installation_id: string;
          })[]
        | null;
    }
  >,
): { orgId: string; installationId: string } | undefined => {
  if (organization.data) {
    for (const org of organization.data) {
      if (Array.isArray(org.organizations)) {
        for (const org2 of org.organizations) {
          if (org2.account_id === installationId) {
            return { orgId: org2.id, installationId: org2.installation_id };
          }
        }
      } else {
        if (org.organizations?.account_id === installationId) {
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
