import { useRouter } from "next/router";
import React from "react";
import Button from "./buttons/Button";
import { Team } from "./teams/useTeams";

interface SlackButtonProps {
  teamId: Team["id"];
}

const SlackButton: React.FC<SlackButtonProps> = ({ teamId }) => {
  const router = useRouter();

  const redirectURI = process.env.NEXT_PUBLIC_SLACK_REDIRECT_URL;
  console.log("Slack button redirect URI", redirectURI);

  return (
    <div>
      <Button
        onClick={() =>
          router.push(
            `https://slack.com/oauth/v2/authorize?scope=channels%3Ahistory%2Cchat%3Awrite%2Ccommands%2Cgroups%3Ahistory%2Cincoming-webhook%2Cusers%3Aread&user_scope=&redirect_uri=${redirectURI}&state=${teamId}&client_id=3571046828385.3558423656162`,
          )
        }
      >
        Connect to Slack
      </Button>
    </div>
  );
};

export default SlackButton;
