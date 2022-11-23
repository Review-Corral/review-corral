/* This example requires Tailwind CSS v2.0+ */
import { FC, ReactNode } from "react";
import { Navbar, NavbarProps } from "./Navbar";

interface NavigationType {
  name: string;
  href: string;
  current: boolean;
}

const navigation: NavigationType[] = [
  // { name: "Dashboard", href: "#", current: true },
  // { name: "Team", href: "#", current: false },
  // { name: "Projects", href: "#", current: false },
  // { name: "Calendar", href: "#", current: false },
  // { name: "Reports", href: "#", current: false },
];

const userNavigation = [
  { name: "Your Profile", href: "#" },
  { name: "Settings", href: "#" },
  { name: "Sign out", href: "/signout" },
];

interface DashboardLayoutProps extends NavbarProps {
  title: string;
  subnav?: ReactNode;
  children: ReactNode;
}

export const DashboardLayout: FC<DashboardLayoutProps> = ({
  title,
  children,
  subnav,
  ...props
}) => {
  return (
    <>
      <div className="min-h-full min-w-[900px] overflow-x-auto">
        <Navbar {...props} />
        <header className="bg-white border-b border-gray-200">{subnav}</header>
        <main className="">
          <div className="max-w-7xl mx-auto py-6 px-7">{children}</div>
        </main>
      </div>
    </>
  );
};
