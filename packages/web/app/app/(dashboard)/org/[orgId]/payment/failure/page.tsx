"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function PaymentFailurePage({
  params,
}: {
  params: { orgId: string };
}) {
  const router = useRouter();

  useEffect(() => {
    // Show error toast notification
    toast.error("Subscription process was cancelled or failed.");

    // Redirect to organization billing page
    router.push(`app/org/${params.orgId}/tabs/billing`);
  }, [params.orgId, router]);

  // This page content won't be shown due to immediate redirect
  return null;
}
