import { Header } from "@/components/ui/header";
import { Github, Slack } from "lucide-react";

export default function Layout(props: {
  children: React.ReactNode;
  githubSlot: React.ReactNode;
  slackSlot: React.ReactNode;
}) {
  console.log("OVERView layout props", props);
  return (
    <div className="space-y-12">
      <Header>Overview</Header>
      <div className="flex justify-between items-start">
        <div id="github" className="w-96">
          <div className="flex py-4 border-b border-gray-300 rounded-t-md justify-between items-center">
            <div className="flex gap-4 items-center">
              <Github className="h-8 w-8 fill-black" />
              <span className="font-semibold text-lg">
                Enabled Repositories
              </span>
            </div>
            <div className="cursor-pointer underline text-indigo-500 underline-offset-2">
              Edit
            </div>
          </div>
          <div className="py-6">{props.githubSlot}</div>
        </div>
        <div id="slack" className="w-96">
          <div className="flex py-4 border-b border-gray-300 rounded-t-md justify-between items-center">
            <div className="flex gap-4 items-center">
              <Slack className="h-8 w-8 fill-black" />
              <span className="font-semibold text-lg">Channels</span>
            </div>
          </div>
          <div className="py-6">{props.slackSlot}</div>
        </div>
      </div>
      {props.children}
    </div>
  );
}
