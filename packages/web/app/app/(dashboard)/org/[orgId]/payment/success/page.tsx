"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function PaymentSuccessPage({
  params,
}: {
  params: { orgId: string };
}) {
  const router = useRouter();

  useEffect(() => {
    // Show success toast notification
    toast.success("Successfully subscribed to Review Corral!");

    // Redirect to organization homepage
    router.replace(`app/org/${params.orgId}`);
  }, [params.orgId, router]);

  // This page content won't be shown due to immediate redirect
  return null;
}
