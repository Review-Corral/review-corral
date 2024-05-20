import { BetterButton } from "@components/ui/BetterButton";
import { FC } from "react";
import { SharedLayout } from "../SharedLayout";
import { useCheckoutSession } from "./useCheckoutSession";
import { useOrganizationBilling } from "./useOrganizationBilling";

interface BillingTabProps {
  orgId: number;
}

export const BillingTab: FC<BillingTabProps> = ({ orgId }) => {
  const getCheckoutSession = useCheckoutSession(orgId);
  const getBillingDetails = useOrganizationBilling(orgId);

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
