import { AuthAccessTokenKey } from "@auth/const";
import { useMutation } from "@tanstack/react-query";
import Cookies from "js-cookie";
import ky from "ky";

export const useBillingPortalSession = (orgId: number, customerId: string) => {
  return useMutation({
    mutationKey: ["checkout-session"],
    mutationFn: async () => {
      return await ky
        .post(`${process.env.NEXT_PUBLIC_API_URL}/stripe/billing-portal`, {
          headers: {
            Authorization: `Bearer ${Cookies.get(AuthAccessTokenKey)}`,
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
