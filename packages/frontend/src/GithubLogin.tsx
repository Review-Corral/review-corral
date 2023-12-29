import React from "react";

interface GithubButtonProps {
  state: string;
}

export const getGithubAuthorizationUrl = (teamId: string) => {
  const params = new URLSearchParams();
  params.append("client_id", process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID ?? "");
  params.append(
    "redirect_uri",
    process.env.NEXT_PUBLIC_GITHUB_CALLBACK_URL ?? ""
  );
  params.append("state", teamId);

  const url = new URL("https://github.com/login/oauth/authorize");
  url.search = params.toString();

  return url;
};

const GithubButton: React.FC<GithubButtonProps> = ({ state }) => {
  console.log("client_id: ", process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID);

  return (
    <div>
      <div onClick={() => window.open(getGithubAuthorizationUrl(state))}>
        Connect to Github
      </div>
    </div>
  );
};

export default GithubButton;
