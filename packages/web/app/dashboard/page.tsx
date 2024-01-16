import { Header } from "@/components/ui/header";
import { useOrganizations } from "@/lib/fetchers/organizations";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { useUser } from "./userActions";

export default async function DashboardHome() {
  const user = await useUser();
  const organizations = await useOrganizations(user);

  return (
    <div className="h-full w-full">
      <Suspense fallback={<div>Loading...</div>}>
        <>
          <Header>Your Organizations</Header>
          <p className="mt-1">
            Here are the organizations you&apos;ve installed the Review Corral
            bot on in Github
          </p>
          <div className="mt-8 inline-flex flex-col gap-2">
            {organizations.map((org) => (
              <Link key={org.id} href={`/dashboard/org/${org.id}`}>
                <div className="inline-flex items-center space-x-2 w-72 cursor-pointer rounded-md p-4 border border-gray-200 hover:shadow-sm">
                  <div className="rounded-md overflow-hidden">
                    <Image
                      alt={"Avatar url"}
                      src={org.avatarUrl}
                      width={32}
                      height={32}
                    />
                  </div>
                  <div>{org.accountName}</div>
                </div>
              </Link>
            ))}
          </div>
        </>
      </Suspense>
    </div>
  );
}
