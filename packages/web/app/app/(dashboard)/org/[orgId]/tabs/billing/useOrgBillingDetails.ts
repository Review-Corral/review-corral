import { getSessionToken } from "@auth/getSessionToken";
import { BillingDetailsResponse } from "@core/selectorTypes/organization";
import { useQuery } from "@tanstack/react-query";
import ky from "ky";

const ORGANIZATION_BILLING_QUERY_KEY = "organizationBilling";

export const useOrgBillingDetails = (orgId: number) => {
  return useQuery({
    queryKey: [ORGANIZATION_BILLING_QUERY_KEY],
    queryFn: async () => {
      return await ky
        .get(`${process.env.NEXT_PUBLIC_API_URL}/org/${orgId}/billing`, {
          headers: {
            Authorization: `Bearer ${getSessionToken()}`,
          },
        })
        .json<BillingDetailsResponse>();
    },
  });
};
