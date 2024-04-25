import { ErrorCard } from "@components/ui/cards/ErrorCard";
import { FC } from "react";
import { SharedPaymentsView } from "./shared";

interface PaymentFailureProps {}

export const PaymentFailure: FC<PaymentFailureProps> = () => {
  return (
    <SharedPaymentsView>
      <ErrorCard message="Something went wrong with your payment. Our team has been notified" />
    </SharedPaymentsView>
  );
};
