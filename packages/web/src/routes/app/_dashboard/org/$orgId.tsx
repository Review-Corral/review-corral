import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { DashboardPaddedBody } from "@components/ui/layout/DashboardPaddedBody";
import { prefetchOrgQueries } from "@/hooks/prefetchOrgQueries";

const PageSchema = z.enum(["billing", "users", "overview"]);
type Page = z.infer<typeof PageSchema>;

const searchSchema = z.object({
  page: z.enum(["billing", "users", "overview"]).optional().default("overview"),
});

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

export const Route = createFileRoute("/app/_dashboard/org/$orgId")({
  validateSearch: searchSchema,
  component: OrgLayout,
});

function OrgLayout() {
  const { orgId } = Route.useParams();
  const { page } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [_page, setPage] = useState<Page>(page);

  // Prefetch all organization-related queries when this layout is mounted
  useEffect(() => {
    const orgIdNumber = Number(orgId);
    prefetchOrgQueries(queryClient, orgIdNumber);
  }, [orgId, queryClient]);

  const setPageWrapper = (page: Page): void => {
    if (page !== _page) {
      setPage(page);
      navigate({
        to: "/app/org/$orgId",
        params: { orgId },
        search: { page },
      });
    }
  };

  return (
    <div className="min-h-full min-w-[900px] overflow-x-auto ">
      <header className="bg-white border-b border-gray-200 ">
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
                    ${_page === route.page ? "border-b-2 border-indigo-500" : ""}
                  `}
                >
                  {route.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </header>
      <DashboardPaddedBody>
        <Outlet />
      </DashboardPaddedBody>
    </div>
  );
}
