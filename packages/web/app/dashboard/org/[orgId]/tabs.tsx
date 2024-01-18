"use client";

import { usePathname, useRouter } from "next/navigation";
import { z } from "zod";

const PageSchema = z.enum(["github", "slack", "usernames", "overview"]);

const schema = z.string(PageSchema).optional().default("overview");

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
    text: "Usernames",
    page: "usernames",
  },
];

export const DashboardTabs: React.FC<{ orgId: number }> = ({ orgId }) => {
  const router = useRouter();
  const pathName = usePathname();

  const currentTabUrl = pathName.replaceAll(/\/dashboard\/org\/\d*\/*/gi, "");

  const currentTab =
    routes.find((route) => route.page.startsWith(currentTabUrl)) ?? routes[0];

  console.log({
    currentTabUrl,
    pathName,
  });

  return (
    <div className="max-w-7xl mx-auto px-6 pt-4 pb-3 font-medium ">
      <ul>
        {routes.map((route) => (
          <li
            key={route.text}
            className={`
                    inline px-2 py-1 cursor-pointer text-base hover:bg-gray-100 rounded-md
                    `}
            onClick={() => router.push(`/dashboard/org/${orgId}/${route.page}`)}
          >
            <span
              className={`
                      pb-[0.9rem]
                      px-1
                      ${
                        currentTab === route
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
  );
};
