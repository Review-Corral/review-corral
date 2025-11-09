import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@components/shadcn/dialog";
import { BetterButton } from "@components/ui/BetterButton";
import { DeleteIcon } from "lucide-react";
import { FC, useState } from "react";
import toast from "react-hot-toast";
import { useDeleteSlackIntegration } from "./useDeleteSlackIntegration";

interface SlackIntegration {
  organizationId: number;
  slackTeamId: string;
  slackTeamName: string | null;
  channelId: string | null;
  channelName: string | null;
}

export const SlackIntegration: FC<SlackIntegration> = ({
  organizationId,
  slackTeamId,
  slackTeamName,
  channelId,
  channelName,
}) => {
  const [open, setOpen] = useState(false);

  const deleteSlackIntegration = useDeleteSlackIntegration({
    orgId: organizationId,
    slackTeamId,
    channelId,
  });

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Slack Integration</DialogTitle>
            <DialogDescription className="pt-6">
              <div className="flex flex-col gap-4">
                <p>Are you sure you want to delete this Slack Integation?</p>
                <div className="border border-gray-200 rounded-md p-4 inline-block">
                  <div className="flex flex-row gap-2 inline-block">
                    <span className="text-gray-400 mr-2">{slackTeamName}</span>
                    {channelName}
                  </div>
                </div>
                <div>
                  <BetterButton
                    variant="destructive"
                    onClick={() =>
                      deleteSlackIntegration
                        .mutateAsync()
                        .then(() => {
                          toast.success("Slack Integration Deleted");
                          setOpen(false);
                        })
                        .catch((error) => {
                          toast.error("Failed to delete Slack Integration");
                          throw error;
                        })
                    }
                    isLoading={deleteSlackIntegration.isPending}
                  >
                    {!deleteSlackIntegration.isPending
                      ? "Yes, please delete"
                      : "Deleting"}
                  </BetterButton>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      <div
        className="border border-gray-200 rounded-md p-4 truncate"
        id="slack-channel"
        key={`${slackTeamId}-${channelId}`}
      >
        <div className="flex justify-between" key={slackTeamId}>
          <div key={`${slackTeamId}-${channelId}`} className="flex flex-row">
            <span className="text-gray-400 mr-2">{slackTeamName}</span>
            {channelName}
          </div>

          <div className="group flex items-center cursor-pointer p-1 hover:bg-red-100 rounded-md">
            <DeleteIcon
              className="w-4 h-4 text-gray-400 group-hover:text-red-500"
              onClick={() => setOpen(true)}
            />
          </div>
        </div>
      </div>
    </>
  );
};
