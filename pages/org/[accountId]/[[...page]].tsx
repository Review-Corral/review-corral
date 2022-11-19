import { SupabaseClient } from "@supabase/supabase-js";
import type { GetServerSidePropsContext, NextPage, PreviewData } from "next";
import { useRouter } from "next/router";
import { ParsedUrlQuery } from "querystring";
import { ReactNode, useState } from "react";
import { Github } from "../../../components/assets/icons/Github";
import { Slack } from "../../../components/assets/icons/Slack";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { InstalledRepos } from "../../../components/teams/repos/InstallationRepositoriesWrapper";
import { SlackIntegrations } from "../../../components/teams/slack/SlackIntegrations";
import { UsernameMappings } from "../../../components/teams/slack/username-mappings/UsernameMappings";
import { flattenParam } from "../../../components/utils/flattenParam";
import { withPageAuth } from "../../../components/utils/withPageAuth";
import { Database } from "../../../database-types";

export type pages = "github" | "slack" | "usernames";

export type Organization = Database["public"]["Tables"]["organizations"]["Row"];

export const OrgView: NextPage<{
  organization: Organization;
  page: pages | undefined;
}> = ({ organization, page }) => {
  const router = useRouter();
  const [_page, setPage] = useState<pages | undefined>(page);

  const setPageWrapper = (page: pages | undefined) => {
    setPage(page);
    let route = "";
    if (page) {
      route = `/org/${organization.account_id}/${page}`;
    } else {
      route = `/org/${organization.account_id}`;
    }
    router.push(route, undefined, { shallow: true });
  };

  return (
    <DashboardLayout
      title={organization.account_name}
      activeOrganizationAccountId={organization.account_id}
      subnav={
        <>
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <h1 className="font-semibold text-gray-900">
              <ul>
                <li
                  className="inline px-2 py-2"
                  onClick={() => setPageWrapper(undefined)}
                >
                  Overview
                </li>
                <li
                  className="inline px-2 py-2"
                  onClick={() => setPageWrapper("github")}
                >
                  Github
                </li>
                <li
                  className="inline px-2 py-2"
                  onClick={() => setPageWrapper("slack")}
                >
                  Slack
                </li>
                <li
                  className="inline px-2 py-2"
                  onClick={() => setPageWrapper("usernames")}
                >
                  Usernames
                </li>
              </ul>
            </h1>
          </div>
        </>
      }
    >
      {((): ReactNode => {
        switch (_page) {
          case "github":
            return (
              <div id="github">
                <h1 className="text-xl font-semibold">Github</h1>
                <div className="rounded-md border border-gray-200">
                  <div className="flex p-4 bg-gray-100 rounded-t-md justify-between">
                    <Github className="h-8 w-8 fill-black" />
                    <span className="font-semibold text-lg">
                      Github Integration
                    </span>
                  </div>
                  <div className="px-4 py-6">
                    <InstalledRepos
                      installationId={organization.installation_id}
                    />
                  </div>
                </div>
              </div>
            );
          case "slack":
            return (
              <div id="slack">
                <h1 className="text-xl font-semibold">Slack</h1>
                <div className="rounded-md border border-gray-200">
                  <div className="flex p-4 bg-gray-100 rounded-md justify-between">
                    <Slack className="h-8 w-8 fill-black" />
                    <span className="font-semibold text-lg">
                      Slack Integration
                    </span>
                  </div>
                  <div className="px-4 py-6">
                    <SlackIntegrations organizationId={organization.id} />
                  </div>
                </div>
              </div>
            );
          case "usernames":
            return (
              <div id="usernames">
                {organization.organization_type === "Organization" && (
                  <UsernameMappings organizationId={organization.id} />
                )}
              </div>
            );
          default:
            return <div>Overview</div>;
        }
      })()}
    </DashboardLayout>
  );
};

export default OrgView;

export const getServerSideProps = withPageAuth<"public">({
  getServerSideProps: baseGetServerSideProps,
});

export async function baseGetServerSideProps(
  ctx: GetServerSidePropsContext<ParsedUrlQuery, PreviewData>,
  supabaseClient: SupabaseClient,
) {
  const accountId = flattenParam(ctx.params?.["accountId"]);
  const page = flattenParam(ctx.params?.["page"]);

  if (!accountId) {
    return {
      notFound: true,
      props: {},
    };
  }

  const { data: organization, error } = await supabaseClient
    .from("organizations")
    .select("*")
    .eq("account_id", accountId)
    .limit(1)
    .single();

  if (error) {
    console.error(
      "Got error getting organization by account ID ",
      accountId,
      ": ",
      error,
    );
    return {
      notFound: true,
      props: {},
    };
  }

  return { props: { organization, page } };
}
