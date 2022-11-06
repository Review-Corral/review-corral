import axios from "axios";
import { Logger } from "next-axiom";
import { getInstallationAccessToken } from "../../../../components/api/utils/apiUtils";
import { withProtectedApi } from "../../../../components/api/utils/withProtectedApi";
import { flattenParam } from "../../../../components/utils/flattenParam";
import {
  InstallationAccessResponse,
  OrgMember,
} from "../../../../github-api-types";

export default withProtectedApi(async function GetMembers(
  req,
  res,
  supabaseServerClient,
) {
  const orgId = flattenParam(req.query.orgId);

  if (!orgId) {
    return res.status(404).send({ error: "No orgId provided" });
  }

  const { data: organization, error } = await supabaseServerClient
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .limit(1)
    .single();

  if (error || !organization) {
    return res.status(404).send({
      error: `No organization found for id: ${orgId} ${
        error && ". Error: " + error.message
      }`,
    });
  }

  if (organization.organization_type !== "Organization") {
    return res.status(400).send({
      error: "Can't get members for non-organization Organization type",
    });
  }

  const installationAccessToken = await getInstallationAccessToken(
    organization.installation_id,
  ).catch((error) => {
    console.error(
      `No installation access token found for installation id: ${
        organization.installation_id
      } ${error && ". Error: " + error.message}`,
    );
    return undefined;
  });

  if (installationAccessToken) {
    req.log.info("Got installation access token for members query");

    const members = await getOrganizationMembers(
      organization.account_name,
      installationAccessToken,
      req.log,
    );

    if (members) {
      return res.status(200).send({ data: members });
    } else {
      return res.status(500).send({ error: "Error getting members" });
    }
  } else {
    return res
      .status(500)
      .send({ error: "Issue getting installation access token" });
  }
});

const getOrganizationMembers = async (
  orgName: string,
  installationAccessToken: InstallationAccessResponse,
  logger: Logger,
): Promise<OrgMember[] | undefined> => {
  return await axios
    .get<OrgMember[]>(
      `https://api.github.com/orgs/${orgName}/members?per_page=100`,
      {
        headers: {
          Authorization: `bearer ${installationAccessToken.token}`,
        },
      },
    )
    .then((response) => response.data)
    .catch((error) => {
      logger.info("Got error getting members: ", error);
      return undefined;
    });
};
