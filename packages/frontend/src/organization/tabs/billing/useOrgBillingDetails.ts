import { BillingDetailsResponse } from "@core/selectorTypes/organization";
import ky from "ky";
import { useQuery } from "react-query";
import { getSessionToken } from "src/auth/getSessionToken";

const ORGANIZATION_BILLING_QUERY_KEY = "organizationBilling";

export const useOrgBillingDetails = (orgId: number) => {
  return useQuery({
    queryKey: [ORGANIZATION_BILLING_QUERY_KEY],
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
