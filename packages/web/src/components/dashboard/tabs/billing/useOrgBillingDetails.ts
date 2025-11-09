import { getSessionToken } from "@/lib/auth/getSessionToken";
import { BillingDetailsResponse } from "@core/selectorTypes/organization";
import { useQuery } from "@tanstack/react-query";
import ky from "ky";

export const ORGANIZATION_BILLING_QUERY_KEY = "organizationBilling";

export const useOrgBillingDetails = (orgId: number) => {
  return useQuery({
    queryKey: [ORGANIZATION_BILLING_QUERY_KEY, orgId],
    queryFn: async () => {
      return await ky
        .get(`${import.meta.env.VITE_API_URL}/org/${orgId}/billing`, {
          headers: {
            Authorization: `Bearer ${getSessionToken()}`,
          },
        })
        .json<BillingDetailsResponse>();
    },
  });
};
