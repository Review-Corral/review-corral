"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import toast from "react-hot-toast";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const { orgId } = useParams<{ orgId: string }>();

  useEffect(() => {
    // Show success toast notification
    toast.success("Successfully subscribed to Review Corral!");

    // Redirect to organization homepage
    router.replace(`/app/org/${orgId}`);
  }, [orgId, router]);

  // This page content won't be shown due to immediate redirect
  return null;
}
