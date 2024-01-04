import { Organization } from "@core/db/types";
import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "src/layouts/DashboardLayout";
import { Page } from "./OrgView";

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

const OrgTabbedViewHandler: React.FC<{
  organization: Organization;
  page: Page;
}> = ({ organization, page }) => {
  // const location = useLocation();
  const navigate = useNavigate();
  const [_page, setPage] = useState<Page | undefined>(page);

  const setPageWrapper = (page: Page | undefined): void => {
    if (page !== _page) {
      setPage(page);
      let route = "";
      if (page) {
        route = `/org/${organization.id}?page=${page}`;
      } else {
        route = `/org/${organization.id}`;
      }
      navigate(route);
    }
  };

  // const stringIsPage = (str: string): str is Page => {
  //   return routes.map((route) => route.page).includes(str as Page);
  // };

  // // Handles pressing back when moving tabs
  // useEffect(() => {
  //   const splitPath = location.pathname.split("/");
  //   if (splitPath.length > 3) {
  //     const page = splitPath[3];
  //     if (stringIsPage(page)) {
  //       setPageWrapper(page);
  //     }
  //   } else {
  //     setPageWrapper(undefined);
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [location]);

  return (
    <DashboardLayout
      title={organization.accountName}
      activeOrganizationAccountId={organization.id}
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const tabProps = { organization, setPage: setPageWrapper };

        switch (_page) {
          case "github":
            return <div>Github</div>;
          case "slack":
            return <div>Slack</div>;
          case "usernames":
            return <div>Usernames</div>;
          default:
            return <div>Overview</div>;
        }
      })()}
    </DashboardLayout>
  );
};

export default OrgTabbedViewHandler;
