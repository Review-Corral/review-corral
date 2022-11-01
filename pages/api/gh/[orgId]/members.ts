import { withApiAuth } from "@supabase/auth-helpers-nextjs";
import axios from "axios";
import { flattenParam } from "../../../../components/utils/flattenParam";
import { Database } from "../../../../database-types";
import {
  InstallationAccessResponse,
  OrgMember,
} from "../../../../github-api-types";

export default withApiAuth<Database>(async function ProtectedRoute(
  req,
  res,
  supabaseServerClient,
) {
  const orgId = flattenParam(req.query.orgId);

  if (!orgId) {
    return res.status(404).send({ error: "No orgId provided" });
  }

  // const { data: organization, error } = await supabaseServerClient
  //   .from("organizations")
  //   .select("*")
  //   .eq("id", orgId)
  //   .limit(1)
  //   .single();

  // if (error || !organization) {
  //   return res.status(404).send({
  //     error: `No organization found for id: ${orgId} ${
  //       error && ". Error: " + error.message
  //     }`,
  //   });
  // }

  // const installationAccessToken = await getInstallationAccessToken(
  //   organization.installation_id,
  // ).catch((error) => {
  //   console.error(
  //     `No installation access token found for installation id: ${
  //       organization.installation_id
  //     } ${error && ". Error: " + error.message}`,
  //   );
  //   return undefined;
  // });

  // if (installationAccessToken) {
  //   const members = await getOrganizationMembers(
  //     organization.account_name,
  //     installationAccessToken,
  //   );

  //   return res.status(200).send({ data: members });
  // } else {
  //   return res
  //     .status(500)
  //     .send({ error: "Issue getting installation access token" });
  // }

  return res.status(400).send({ error: "Not implemented" });
});

const getOrganizationMembers = async (
  orgName: string,
  installationAccessToken: InstallationAccessResponse,
): Promise<OrgMember[]> => {
  return (
    await axios.get<OrgMember[]>(
      `https://api.github.com/orgs/${orgName}/members?per_page=100`,
      {
        headers: {
          Authorization: `bearer ${installationAccessToken.token}`,
        },
      },
    )
  ).data;
};
