import { createFileRoute, redirect } from "@tanstack/react-router";
import toast from "react-hot-toast";

export const Route = createFileRoute("/app/_dashboard/org/$orgId/payment/failure")({
  beforeLoad: ({ params }) => {
    // Show error toast notification
    toast.error("Subscription process was cancelled or failed.");

    // Redirect to organization billing page
    throw redirect({
      to: "/app/org/$orgId",
      params: { orgId: params.orgId },
      search: { page: "billing" },
    });
  },
  component: () => null,
});
