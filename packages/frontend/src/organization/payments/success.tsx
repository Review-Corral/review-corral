import { FC } from "react";
import { SharedPaymentsView } from "./shared";

interface PaymentsSuccessProps {}

export const PaymentsSuccess: FC<PaymentsSuccessProps> = () => {
  return <SharedPaymentsView>Payment Success!</SharedPaymentsView>;
};
