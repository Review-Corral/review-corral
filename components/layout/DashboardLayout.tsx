/* This example requires Tailwind CSS v2.0+ */
import { FC, ReactNode } from "react";
import { Navbar, NavbarProps } from "./Navbar";

interface NavigationType {
  name: string;
  href: string;
  current: boolean;
}

interface DashboardLayoutProps extends NavbarProps {
  title: string;
  children: ReactNode;
}

export const DashboardLayout: FC<DashboardLayoutProps> = ({
  title,
  children,
  ...props
}) => {
  return (
    <>
      <div className="min-h-full">
        <Navbar {...props} />
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <h1 className="text-lg leading-6 font-semibold text-gray-900">
              {title}
            </h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </>
  );
};
