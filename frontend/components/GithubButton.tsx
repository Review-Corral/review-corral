import React from "react";

interface GithubButtonProps {
  state: string;
}

const GithubButton: React.FC<GithubButtonProps> = ({ state }) => {
  const params = new URLSearchParams();
  params.append("client_id", process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID ?? "");
  params.append(
    "redirect_uri",
    process.env.NEXT_PUBLIC_GITHUB_CALLBACK_URL ?? "",
  );
  params.append("state", state);

  const url = new URL("https://github.com/login/oauth/authorize");
  url.search = params.toString();

  return (
    <div>
      <button onClick={() => window.open(url)}>Connect Github</button>
    </div>
  );
};

export default GithubButton;