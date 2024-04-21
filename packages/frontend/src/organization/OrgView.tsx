import { Organization } from "@core/dynamodb/entities/types";
import { FC, ReactNode, useEffect, useState } from "react";
import {
  redirect,
  useLoaderData,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { DashboardLayout } from "src/layouts/DashboardLayout";
import { useOrganizations } from "src/organization/useOrganizations";
import * as z from "zod";
import { OverviewTab } from "./tabs/OverviewTab";
import { UsersTab } from "./tabs/users/UsersTab";

interface OrgViewProps {}

const PageSchema = z.enum(["github", "slack", "users", "overview"]);

export type Page = z.infer<typeof PageSchema>;

type SubNav = {
  text: string;
  page: Page;
};

const routes: SubNav[] = [
  {
    text: "Overview",
    page: "overview",
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
    text: "Users",
    page: "users",
  },
];

const orgViewParamsSchema = z.object({
  orgId: z.string().transform(Number),
});

const orgViewSearchParamsSchema = PageSchema.optional().default("overview");

export const OrgView: FC<OrgViewProps> = () => {
  const loaderData = useLoaderData();
  console.log(loaderData);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [searchParams, _] = useSearchParams();

  const pageParse = orgViewSearchParamsSchema.safeParse(searchParams.get("page"));
  const { orgId } = orgViewParamsSchema.parse(loaderData);

  const { data, isLoading } = useOrganizations();

  const [organization, setOrganization] = useState<Organization | undefined>(undefined);

  const navigate = useNavigate();
  const [_page, setPage] = useState<Page>(
    pageParse.success ? pageParse.data : "overview",
  );

  const setPageWrapper = (page: Page): void => {
    if (organization) {
      if (page !== _page) {
        setPage(page);
        let route = "";
        if (page) {
          route = `/org/${organization.orgId}?page=${page}`;
        } else {
          route = `/org/${organization.orgId}`;
        }
        navigate(route);
      }
    }
  };

  // Gets the correct organization from the list of organizations fetched from
  // the database
  useEffect(() => {
    if (data) {
      const org = data.find((org) => org.orgId === Number(orgId));
      if (org) {
        setOrganization(org);
        return;
      } else {
        // TODO: I think rendering a 404 would be better
        redirect("/404");
      }
    }
    setOrganization(undefined);
  }, [data]);

  return (
    <DashboardLayout
      title="Organization"
      activeOrganizationAccountId={organization?.orgId}
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
                      ${_page == route.page ? "border-b-2 border-indigo-500" : ""}
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
      {isLoading && <div>Loading...</div>}
      {!isLoading &&
        organization &&
        ((): ReactNode => {
          const tabProps = { organization, onEdit: setPageWrapper };

          switch (_page) {
            case "github":
              return <div>Github</div>;
            // return <GithubTab {...tabProps} />;
            case "slack":
              return <div>Slack</div>;
            // return <SlackTab {...tabProps} />;
            case "users":
              return <UsersTab orgId={orgId} />;
            // return <UsernamesTab {...tabProps} />;
            default:
              return <OverviewTab {...tabProps} />;
          }
        })()}
    </DashboardLayout>
  );
};
