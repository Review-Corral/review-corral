import { FC } from "react";
import GithubButton from "../GithubButton";
import { Team } from "./useTeams";

interface TeamsViewProps {
  teams: Team[];
}

export const TeamsView: FC<TeamsViewProps> = ({ teams }) => {
  return (
    <div>
      {teams.map((team) => (
        <div key={team.id} className="space-y-6">
          <GithubButton state={team.id} />
          {/* <SlackButton /> */}
        </div>
      ))}
    </div>
  );
};
