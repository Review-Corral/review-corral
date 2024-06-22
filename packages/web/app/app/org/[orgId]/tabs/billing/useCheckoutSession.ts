import { auth_access_token_key } from "@auth/const";
import Cookies from "js-cookie";
import ky from "ky";
import { useMutation } from "react-query";

export const useCheckoutSession = (orgId: number) => {
  return useMutation({
    mutationKey: ["checkout-session"],
    mutationFn: async () => {
      return await ky
        .post(`${process.env.NEXT_PUBLIC_API_URL}/stripe/checkout-session`, {
          headers: {
            Authorization: `Bearer ${Cookies.get(auth_access_token_key)}`,
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
