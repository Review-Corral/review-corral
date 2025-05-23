import { AuthAccessTokenKey } from "@auth/const";
import { useMutation } from "@tanstack/react-query";
import Cookies from "js-cookie";
import ky from "ky";

export const useCheckoutSession = (orgId: number) => {
  return useMutation({
    mutationKey: ["checkout-session"],
    mutationFn: async () => {
      return await ky
        .post(`${process.env.NEXT_PUBLIC_API_URL}/stripe/checkout-session`, {
          headers: {
            Authorization: `Bearer ${Cookies.get(AuthAccessTokenKey)}`,
          },
          body: JSON.stringify({
            orgId: orgId,
            priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
          }),
        })
        .json<{ url: string }>();
    },
  });
};
