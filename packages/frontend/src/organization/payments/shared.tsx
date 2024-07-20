import { Loading } from "@components/ui/cards/loading";
import React from "react";
import { useLoaderData } from "react-router-dom";
import { DashboardLayout } from "src/layouts/DashboardLayout";
import { z } from "zod";
import { useOrganization } from "../useOrganization";

interface SharedPayentsProps {}

const orgViewParamsSchema = z.object({
  orgId: z.string().transform(Number),
});

export const SharedPaymentsView: React.FC<React.PropsWithChildren<SharedPayentsProps>> =
  ({ children }) => {
    const loaderData = useLoaderData();
    const { orgId } = orgViewParamsSchema.parse(loaderData);

    const { data, isLoading } = useOrganization(orgId);

    return (
      <DashboardLayout title="Organization" activeOrganizationAccountId={data?.orgId}>
        {isLoading ? <Loading text={"Loading payment status"} /> : children}
      </DashboardLayout>
    );
  };
