import { createFileRoute, redirect } from "@tanstack/react-router";
import toast from "react-hot-toast";

export const Route = createFileRoute("/app/_dashboard/org/$orgId/payment/success")({
  beforeLoad: ({ params }) => {
    // Show success toast notification
    toast.success("Successfully subscribed to Review Corral!");

    // Redirect to organization homepage
    throw redirect({ to: "/app/org/$orgId", params: { orgId: params.orgId } });
  },
  component: () => null,
});
