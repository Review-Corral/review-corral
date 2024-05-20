import { FC, ReactNode, useState } from "react";
import { useLoaderData, useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "src/layouts/DashboardLayout";
import * as z from "zod";
import { OverviewTab } from "./tabs/OverviewTab";
import { BillingTab } from "./tabs/billing/BillingTab";
import { UsersTab } from "./tabs/users/UsersTab";
import { useOrganization } from "./useOrganization";

type OrgViewProps = {};

const PageSchema = z.enum(["billing", "users", "overview"]);

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
    text: "Users",
    page: "users",
  },
  {
    text: "Billing",
    page: "billing",
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

  const { data, isLoading } = useOrganization(orgId);

  const navigate = useNavigate();
  const [_page, setPage] = useState<Page>(
    pageParse.success ? pageParse.data : "overview",
  );

  const organization = data;

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
            case "users":
              return <UsersTab orgId={orgId} />;
            case "billing":
              return <BillingTab orgId={orgId} />;
            default:
              return <OverviewTab {...tabProps} />;
          }
        })()}
    </DashboardLayout>
  );
};
