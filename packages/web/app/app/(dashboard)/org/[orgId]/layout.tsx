"use client";

import * as z from "zod";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Providers from "../../../providers";
import { DashboardPaddedBody } from "../../../../../components/ui/layout/DashboardPaddedBody";

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

export default function RootLayout({ children }: React.PropsWithChildren) {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();

  const parsedPage = PageSchema.safeParse(searchParams.get("page"));
  const { orgId } = orgViewParamsSchema.parse(params);

  const [_page, setPage] = useState<Page>(
    parsedPage.success ? parsedPage.data : "overview",
  );

  const setPageWrapper = (page: Page): void => {
    if (orgId) {
      if (page !== _page) {
        setPage(page);
        let route = "";
        if (page) {
          route = `/app/org/${orgId}?page=${page}`;
        } else {
          route = `/app/org/${orgId}`;
        }
        router.push(route);
      }
    }
  };

  return (
    <div className="min-h-full min-w-[900px] overflow-x-auto ">
      <header className="bg-white border-b border-gray-200 ">
        {
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
        }
      </header>
      <DashboardPaddedBody>{children}</DashboardPaddedBody>
    </div>
  );
}
