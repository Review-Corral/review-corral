import { SLACK_INTEGRATIONS_QUERY_KEY } from "@/components/dashboard/tabs/slack/useSlackIntegrations";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { z } from "zod";

const searchSchema = z.object({
  orgId: z.coerce.number(),
  action: z.enum(["install", "update"]).catch("install"),
});

export const Route = createFileRoute("/app/slack/install/success")({
  validateSearch: searchSchema,
  component: SlackInstallSuccess,
});

function SlackInstallSuccess() {
  const { orgId, action } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleSuccess = async () => {
      // Invalidate slack integrations query to force refetch
      await queryClient.invalidateQueries({
        queryKey: [SLACK_INTEGRATIONS_QUERY_KEY, orgId],
      });

      // Show success toast
      const message =
        action === "install"
          ? "Successfully installed Slack integration"
          : "Successfully updated Slack integration";
      toast.success(message);

      // Redirect to dashboard
      navigate({
        to: "/app/org/$orgId",
        params: { orgId: orgId.toString() },
        search: { page: "overview" },
      });
    };

    handleSuccess();
  }, [orgId, action, navigate, queryClient]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-gray-900 mx-auto" />
        <p className="mt-4 text-gray-600">
          {action === "install" ? "Installing" : "Updating"} Slack integration...
        </p>
      </div>
    </div>
  );
}
