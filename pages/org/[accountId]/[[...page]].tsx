import { withPageAuth } from "@supabase/auth-helpers-nextjs";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { ReactNode, useEffect, useState } from "react";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { GithubTab } from "../../../components/organization/github/GithubTab";
import { OverviewTab } from "../../../components/organization/Overview";
import { Organization, Pages } from "../../../components/organization/shared";
import { SlackTab } from "../../../components/organization/slack/SlackTab";
import { UsernamesTab } from "../../../components/organization/usernames/UsernamesTab";
import { flattenParam } from "../../../components/utils/flattenParam";

type SubNav = {
  text: string;
  page: Pages | undefined;
};

const routes: SubNav[] = [
  {
    text: "Overview",
    page: undefined,
  },
  {
    text: "Github",
    page: "github",
  },
  {
    text: "Slack",
    page: "slack",
  },
  {
    text: "Usernames",
    page: "usernames",
  },
];

const OrgOverviewPage: NextPage<{
  organization: Organization;
  page: Pages | undefined;
}> = ({ organization, page }) => {
  const router = useRouter();
  const [_page, setPage] = useState<Pages | undefined>(page);

  const setPageWrapper = (page: Pages | undefined): void => {
    if (page !== _page) {
      setPage(page);
      let route = "";
      if (page) {
        route = `/org/${organization.account_id}/${page}`;
      } else {
        route = `/org/${organization.account_id}`;
      }
      router.push(route, undefined, { shallow: true });
    }
  };

  const stringIsPage = (str: string): str is Pages => {
    return routes.map((route) => route.page).includes(str as Pages);
  };

  // Handles pressing back when moving tabs
  useEffect(() => {
    const splitPath = router.asPath.split("/");
    if (splitPath.length > 3) {
      const page = splitPath[3];
      if (stringIsPage(page)) {
        setPageWrapper(page);
      }
    } else {
      setPageWrapper(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.asPath]);

  return (
    <DashboardLayout
      title={organization.account_name}
      activeOrganizationAccountId={organization.account_id}
      subnav={
        <>
          <div className="max-w-7xl mx-auto px-6 pt-4 pb-3 font-medium ">
            <ul>
              {routes.map((route) => (
                <li
                  key={route.text}
                  className={`
                    inline px-2 py-1 cursor-pointer text-base hover:bg-gray-100 rounded-md
                    `}
                  onClick={() => setPageWrapper(route.page)}
                >
                  <span
                    className={`
                      pb-[0.9rem]
                      px-1
                      ${
                        _page == route.page
                          ? "border-b-2 border-indigo-500"
                          : ""
                      }
                    `}
                  >
                    {route.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      }
    >
      {((): ReactNode => {
        const tabProps = { organization, setPage: setPageWrapper };

        switch (_page) {
          case "github":
            return <GithubTab {...tabProps} />;
          case "slack":
            return <SlackTab {...tabProps} />;
          case "usernames":
            return <UsernamesTab {...tabProps} />;
          default:
            return <OverviewTab {...tabProps} />;
        }
      })()}
    </DashboardLayout>
  );
};

export default OrgOverviewPage;

export const getServerSideProps = withPageAuth<"public">({
  getServerSideProps: async function getServerSideProps(ctx, supabaseClient) {
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
  },
});
