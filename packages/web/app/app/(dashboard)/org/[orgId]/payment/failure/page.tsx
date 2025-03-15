"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function PaymentFailurePage() {
  const router = useRouter();
  const { orgId } = useParams<{ orgId: string }>();

  useEffect(() => {
    // Show error toast notification
    toast.error("Subscription process was cancelled or failed.");

    // Redirect to organization billing page
    router.push(`/app/org/${orgId}?page=billing`);
  }, [orgId, router]);

  // This page content won't be shown due to immediate redirect
  return null;
}
