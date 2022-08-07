import { FC } from "react";
import GithubButton from "../GithubButton";
import SlackButton from "../SlackButton";
import { Team } from "./useTeams";

interface TeamsViewProps {
  teams: Team[];
}

export const TeamsView: FC<TeamsViewProps> = ({ teams }) => {
  return (
    <div>
      {teams.map((team) => (
        <div key={team.id} className="space-y-6">
          <h2>{team.name}</h2>
          <GithubButton state={team.id} />
          <SlackButton />
        </div>
      ))}
    </div>
  );
};
