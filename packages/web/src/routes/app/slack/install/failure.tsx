import { Button } from "@components/shadcn/button";
import { ErrorCard } from "@components/ui/cards/ErrorCard";
import { Link, createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  orgId: z.coerce.number(),
  action: z.enum(["install", "update"]).catch("install"),
});

export const Route = createFileRoute("/app/slack/install/failure")({
  validateSearch: searchSchema,
  component: SlackInstallFailure,
});

function SlackInstallFailure() {
  const { orgId, action } = Route.useSearch();

  const actionText = action === "install" ? "installing" : "updating";

  return (
    <div className="flex items-center justify-center min-h-screen">
      <ErrorCard
        message={`Oops, there was an error ${actionText} the Slack integration.`}
        subMessage={
          <div className="mt-4">
            <Link
              to={"/app/org/$orgId"}
              params={{ orgId: orgId.toString() }}
              search={{ page: "overview" }}
            >
              <Button variant="outline">Go back home</Button>
            </Link>
          </div>
        }
      />
    </div>
  );
}
