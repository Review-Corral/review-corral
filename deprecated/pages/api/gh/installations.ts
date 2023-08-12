import { PostgrestResponse } from "@supabase/supabase-js";
import axios from "axios";
import { withAxiom } from "next-axiom";
import { withProtectedApi } from "../../../services/utils/withProtectedApi";
import { InstallationsResponse } from "../../../types/github-api-types";

export default withAxiom(
  withProtectedApi(async function ProtectedRoute(
    req,
    res,
    supabaseServerClient,
  ) {
    const { data } = await supabaseServerClient.auth.getSession();

    if (!data?.session?.user?.id) {
      return res.status(401).send({ error: "Unauthorized" });
    }

    req.log.info("Getting installations for user", {
      userId: data.session.user.id,
    });

    const { data: user, error } = await supabaseServerClient
      .from("users")
      .select("*")
      .eq("id", data.session.user.id)
      .single();

    if (!user) {
      req.log.error("No user found for id", data.session.user.id);
      return res.status(404).send({
        error: `No user in user found for`,
      });
    }

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
        const foundInstallation = findOrganization(
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
            req.log.error(
              `Error updating org installation id: ${error.message}`,
            );
            return res.status(500).send({
              error: `There was an unexpected error`,
            });
          }
        }

        if (!foundInstallation) {
          // Check that the organization was created by another user
          // if so, then just create the mapping
          const {
            data: orgIdWithInstallationId,
            error: foundOrgWithInstallationIdError,
          } = await supabaseServerClient
            .from("organizations")
            .select("id")
            .eq("account_id", installation.account.id);

          if (foundOrgWithInstallationIdError) {
            req.log.error(
              `Error finding org with installation id: ${foundOrgWithInstallationIdError.message}`,
            );
            return res.status(500).send({
              error: `There was an unexpected error`,
            });
          }

          req.log.debug("Result for searching for org with installation id", {
            result: orgIdWithInstallationId,
            installationId: installation.account.id,
          });

          // If the organization already exists, just link to the user through
          // the m2m table
          if (orgIdWithInstallationId && orgIdWithInstallationId.length > 0) {
            const foundOrgId = orgIdWithInstallationId[0].id;
            req.log.debug(
              "Found organization for the installation id for non-linked user/organization",
              {
                orgId: foundOrgId,
                installationId: installation.id,
                user: user.id,
              },
            );

            const { error: insertError } = await supabaseServerClient
              .from("users_and_organizations")
              .insert([
                {
                  org_id: foundOrgId,
                  user_id: user.id,
                },
              ]);

            if (insertError) {
              req.log.error(
                `Error inserting user and organization: ${insertError.message}`,
              );
              return res.status(500).send({
                error: `There was an unexpected error`,
              });
            }
          } else {
            const { data: newOrg, error } = await supabaseServerClient
              .from("organizations")
              .insert([
                {
                  account_id: installation.account.id,
                  installation_id: installation.id,
                  account_name: installation.account.login,
                  avatar_url: installation.account.avatar_url,
                  organization_type: _getOrganizationType(
                    installation.account.type,
                  ),
                },
              ])
              .select();

            if (error) {
              req.log.error(`Error creating org: ${error.message}`);
              return res
                .status(500)
                .send({ error: `There was an unexpected error` });
            }

            if (newOrg) {
              const { error } = await supabaseServerClient
                .from("users_and_organizations")
                .insert({
                  user_id: user.id,
                  org_id: newOrg[0].id,
                })
                .eq("user_id", user.id);

              if (error) {
                req.log.error(
                  `Error creating user_and_organizations row: ${error.message}`,
                );
                return res
                  .status(500)
                  .send({ error: `There was an unexpected error` });
              }
            }
          }
        }
      }
    }

    res.json(reponse.data);
  }),
);

const _getOrganizationType = (type?: string) => {
  switch (type) {
    case "User":
      return "User";
    case "Organization":
      return "Organization";
    default:
      null;
  }
};

const findOrganization = (
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
