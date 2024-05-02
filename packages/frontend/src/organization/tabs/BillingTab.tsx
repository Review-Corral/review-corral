import { auth_access_token_key } from "@auth/const";
import { BetterButton } from "@components/ui/BetterButton";
import Cookies from "js-cookie";
import ky from "ky";
import { FC } from "react";
import { useMutation } from "react-query";
import { SharedLayout } from "./SharedLayout";

interface BillingTabProps {
  orgId: number;
}

export const BillingTab: FC<BillingTabProps> = ({ orgId }) => {
  const getCheckoutSession = useMutation({
    mutationKey: ["checkout-session"],
    mutationFn: async () => {
      return await ky
        .post(`${import.meta.env.VITE_API_URL}/stripe/checkout-session`, {
          headers: {
            Authorization: `Bearer ${Cookies.get(auth_access_token_key)}`,
          },
          body: JSON.stringify({
            orgId: orgId,
            priceId: import.meta.env.VITE_STRIPE_PRICE_ID,
          }),
        })
        .json<{ url: string }>();
    },
  });

  return (
    <SharedLayout title={"Billing"}>
      <BetterButton
        onClick={async () => {
          const checkout = await getCheckoutSession.mutateAsync();
          window.open(checkout.url);
        }}
      >
        Subscribe
      </BetterButton>
    </SharedLayout>
  );
};
