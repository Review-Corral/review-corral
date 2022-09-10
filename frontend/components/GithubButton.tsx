import { useRouter } from "next/router";
import React from "react";
import Button from "./buttons/Button";

interface GithubButtonProps {
  state: string;
}

const GithubButton: React.FC<GithubButtonProps> = ({ state }) => {
  const router = useRouter();
  const params = new URLSearchParams();
  params.append("client_id", process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID ?? "");
  params.append(
    "redirect_uri",
    process.env.NEXT_PUBLIC_GITHUB_CALLBACK_URL ?? "",
  );
  params.append("state", state);

  const url = new URL("https://github.com/login/oauth/authorize");
  url.search = params.toString();

  console.log("client_id: ", process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID);

  return (
    <div>
      <Button onClick={() => router.push(url)}>Connect to Github</Button>
    </div>
  );
};

export default GithubButton;
