import { auth_access_token_key } from "@auth/const";
import Cookies from "js-cookie";
import ky from "ky";
import { useMutation } from "@tanstack/react-query";

export const useBillingPortalSession = (orgId: number, customerId: string) => {
  return useMutation({
    mutationKey: ["checkout-session"],
    mutationFn: async () => {
      return await ky
        .post(`${process.env.NEXT_PUBLIC_API_URL}/stripe/billing-portal`, {
          headers: {
            Authorization: `Bearer ${Cookies.get(auth_access_token_key)}`,
          },
          body: JSON.stringify({
            orgId,
            customerId,
          }),
        })
        .json<{ url: string }>();
    },
  });
};
