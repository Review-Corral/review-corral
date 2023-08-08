import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import axios from "axios";
import { AxiomAPIRequest, Logger, withAxiom } from "next-axiom";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Database } from "types/database-types";
import { flattenParam } from "../../../../components/utils/flattenParam";
import { getInstallationAccessToken } from "../../../../services/utils/apiUtils";
import {
  InstallationAccessResponse,
  OrgMember,
} from "../../../../types/github-api-types";

export const GET = withAxiom(async (req: AxiomAPIRequest) => {
  const supabaseServerClient = createRouteHandlerClient<Database>({ cookies });
  req.log.debug("Get memebrs query called");
  const orgId = flattenParam(req.query.orgId);

  if (!orgId) {
    req.log.info("Members call returning 404 since no orgId provided");
    return NextResponse.json({ error: "No orgId provided" }, { status: 404 });
  }

  const { data: organization, error } = await supabaseServerClient
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .limit(1)
    .single();

  if (error || !organization) {
    req.log.error("Error getting members: ", error);
    return NextResponse.json(
      {
        error: `No organization found for id: ${orgId}`,
      },
      { status: 400 },
    );
  }
  if (organization.organization_type !== "Organization") {
    req.log.info(
      "Getting members: Organization is not of organization type (no members): ",
      {
        orgId: organization.id,
      },
    );
    return NextResponse.json(
      {
        error: "Can't get members for non-organization Organization type",
      },
      { status: 400 },
    );
  }

  const installationAccessToken = await getInstallationAccessToken(
    organization.installation_id,
  ).catch((error) => {
    req.log.error(
      `Getting members: No installation access token found for installation id: ${
        organization.installation_id
      } ${error && ". Error: " + error.message}`,
    );
    return undefined;
  });

  if (installationAccessToken) {
    req.log.info(
      "Getting members: Got installation access token for members query",
    );

    const members = await getOrganizationMembers(
      organization.account_name,
      installationAccessToken,
      req.log,
    );

    if (members) {
      req.log.info("Got members for organization ", {
        organization,
        members,
      });
      return NextResponse.json({ data: members }, { status: 200 });
    } else {
      req.log.warn("No members found for organization: ", organization);
      return NextResponse.json(
        { error: "Error getting members" },
        { status: 500 },
      );
    }
  } else {
    req.log.error("Issue getting installation access token for members query");
    return NextResponse.json(
      { error: "Issue getting installation access token" },
      { status: 500 },
    );
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
