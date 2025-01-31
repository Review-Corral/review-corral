import { BetterButton } from "@components/ui/BetterButton";
import { Loading } from "@components/ui/cards/loading";
import { Subscription } from "@core/dynamodb/entities/types";
import { CheckIcon } from "lucide-react";
import React, { FC } from "react";
import { SharedLayout } from "../SharedLayout";
import { useBillingPortalSession } from "./useBillingPortalSession";
import { useCheckoutSession } from "./useCheckoutSession";
import { useOrgBillingDetails } from "./useOrgBillingDetails";

interface BillingTabProps {
  orgId: number;
}

export const BillingTab: FC<BillingTabProps> = ({ orgId }) => {
  const getBillingDetails = useOrgBillingDetails(orgId);

  if (getBillingDetails.isLoading) {
    return <Loading />;
  }

  const subscriptions = getBillingDetails.data?.subscriptions;

  return (
    <SharedLayout title={"Billing"}>
      {subscriptions && subscriptions.length > 0 ? (
        <ActiveSubscriptionsSection subscriptions={subscriptions} orgId={orgId} />
      ) : (
        <div className="flex flex-col gap-4">
          You don't have any active subscriptions.
          <PlanCard orgId={orgId} />
        </div>
      )}
    </SharedLayout>
  );
};

const ActiveSubscriptionsSection: FC<{
  subscriptions: Subscription[];
  orgId: number;
}> = ({ subscriptions, orgId }) => {
  return (
    <div>
      <h3 className="text-xl font-bold tracking-tight text-gray-900">
        Active Subscriptions
      </h3>
      <div className="flex mt-8 gap-4">
        {subscriptions.map((subscription) => {
          return (
            <ActivePlanCard
              key={subscription.subId}
              subscription={subscription}
              orgId={orgId}
            />
          );
        })}
      </div>
    </div>
  );
};

const includedFeatures = ["10 team members (measured by Github users)"];

const ActivePlanCard: FC<{ subscription: Subscription; orgId: number }> = ({
  subscription,
  orgId,
}) => {
  const getBillingPortalSession = useBillingPortalSession(
    orgId,
    subscription.customerId,
  );

  return (
    <div className="max-w-md rounded-3xl ring-1 ring-gray-200">
      <div className="p-8 sm:p-10 lg:flex-auto">
        <h3 className="text-2xl font-bold tracking-tight text-gray-900">
          Startup Plan
        </h3>
        <p className="mt-3 text-base leading-7 text-gray-600">$10/month</p>
        <div className="mt-6">
          <BetterButton
            isLoading={getBillingPortalSession.isPending}
            onClick={async () => {
              const checkout = await getBillingPortalSession.mutateAsync();
              window.open(checkout.url);
            }}
          >
            Manage Subscription
          </BetterButton>
        </div>
        <div className="mt-10 flex items-center gap-x-4">
          <h4 className="flex-none text-sm font-semibold leading-6 text-indigo-600">
            What’s included
          </h4>
          <div className="h-px flex-auto bg-gray-100" />
        </div>
        <ul className="mt-8 grid grid-cols-1 gap-4 text-sm leading-6 text-gray-600 sm:grid-cols-1 sm:gap-6">
          {includedFeatures.map((feature) => (
            <li key={feature} className="flex gap-x-3">
              <CheckIcon
                className="h-6 w-5 flex-none text-indigo-600"
                aria-hidden="true"
              />
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const PlanCard: React.FC<{ orgId: number }> = ({ orgId }) => {
  const getCheckoutSession = useCheckoutSession(orgId);

  return (
    <div className="mx-auto w-full rounded-3xl ring-1 ring-gray-200 lg:mx-0 lg:flex lg:max-w-none">
      <div className="p-8 sm:p-10 lg:flex-auto">
        <h3 className="text-2xl font-bold tracking-tight text-gray-900">
          Startup Plan
        </h3>
        <p className="mt-6 text-base leading-7 text-gray-600">
          Review Corral is designed for small teams and is currently the only plan we
          offer. If you're interested in using Review Corral for a larger team, please{" "}
          <a className="underline" href="mailto:alex.mclean25+reviewcorral@gmail.com">
            reach out
          </a>
          .
        </p>
        <div className="mt-10 flex items-center gap-x-4">
          <h4 className="flex-none text-sm font-semibold leading-6 text-indigo-600">
            What’s included
          </h4>
          <div className="h-px flex-auto bg-gray-100" />
        </div>
        <ul className="mt-8 grid grid-cols-1 gap-4 text-sm leading-6 text-gray-600 sm:grid-cols-1 sm:gap-6">
          {includedFeatures.map((feature) => (
            <li key={feature} className="flex gap-x-3">
              <CheckIcon
                className="h-6 w-5 flex-none text-indigo-600"
                aria-hidden="true"
              />
              {feature}
            </li>
          ))}
        </ul>
      </div>
      <div className="-mt-2 p-2 lg:mt-0 lg:w-full lg:max-w-md lg:flex-shrink-0">
        <div className="rounded-2xl bg-gray-50 py-10 text-center ring-1 ring-inset ring-gray-900/5 lg:flex lg:flex-col lg:justify-center lg:py-16">
          <div className="mx-auto max-w-xs px-8">
            <p className="mt-6 flex items-baseline justify-center gap-x-2">
              <span className="text-5xl font-bold tracking-tight text-gray-900">
                $10
              </span>
              <span className="text-sm font-semibold leading-6 tracking-wide text-gray-600">
                USD/month
              </span>
            </p>
            <div className="pt-6">
              <BetterButton
                size={"lg"}
                color="indigo"
                isLoading={getCheckoutSession.isPending}
                onClick={async () => {
                  const checkout = await getCheckoutSession.mutateAsync();
                  window.open(checkout.url);
                }}
              >
                Subscribe
              </BetterButton>
            </div>

            <p className="mt-6 text-xs leading-5 text-gray-600">
              Invoices and receipts available for easy company reimbursement
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
