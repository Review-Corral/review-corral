"use client";

import { Button } from "@/components/shadcn/button";
import { Loading } from "@/components/ui/cards/loading";
import { Header } from "@/components/ui/header";
import Link from "next/link";
import { FC } from "react";
import { DashboardPaddedBody } from "../../../components/ui/layout/DashboardPaddedBody";
import { useOrganizations } from "./org/useOrganizations";

const HomeView: FC = () => {
  const { data, isLoading } = useOrganizations();

  console.log("on dashboard main page");

  if (data && data.length <= 0) {
    return (
      <>
        <Header>Onboarding</Header>
        <div className="mt-8 space-y-6">
          <p className="">Welcome to Review Corral! Lets get you setup.</p>
          <div className="p-4 rounded-md border sborder-gray-200 max-w-2xl space-y-4">
            <div className="flex flex-row items-center gap-2 text-lg font-semibold">
              {/* <Github className="h-5 w-5" /> */}
              Install the Review Corral Github App
            </div>
            <p className="font-normal text-sm">
              Click the button below to install the Github App into any of the Github
              Orgnizations and repositories you want to receive events for. Even if you
              have installed the app for all repositories in an organization, you can
              still toggle which repositories to listen to events to in this dashboard
              at any time.
            </p>
            <div className="flex gap-2">
              <Link href={process.env.NEXT_PUBLIC_GITHUB_APP_URL!}>
                <Button color="indigo">Install Integration</Button>
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <DashboardPaddedBody>
      <Header>Your Organizations</Header>
      <p className="mt-1">
        Here are the organizations you&apos;ve installed the Review Corral bot on in
        Github
      </p>
      <div className="mt-8 inline-flex flex-col gap-2">
        {isLoading && <Loading />}
        {data?.map((org) => (
          <Link key={org.orgId} href={`/app/org/${org.orgId}`}>
            <div className="inline-flex items-center space-x-2 w-72 cursor-pointer rounded-md p-4 border border-gray-200 hover:shadow-sm">
              <div className="rounded-md overflow-hidden">
                <img alt={"Avatar url"} src={org.avatarUrl} width={32} height={32} />
              </div>
              <div>{org.name}</div>
            </div>
          </Link>
        ))}
      </div>
    </DashboardPaddedBody>
  );
};

export default HomeView;
