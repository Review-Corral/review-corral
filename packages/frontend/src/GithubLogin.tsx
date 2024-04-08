import ky from "ky";
import React from "react";
import { useMutation } from "react-query";
import githubLogo from "../public/github-mark/github-mark-white.svg";

interface GithubButtonProps {}

const GithubLoginButton: React.FC<GithubButtonProps> = () => {
  const authUri = import.meta.env.VITE_AUTH_URL;
  console.log({ authUri });
  const mutation = useMutation({
    mutationFn: async () => {
      const payload = await ky.get(authUri).json<{ github: string }>();
      window.open(payload.github, "_self");
    },
  });

  return (
    <div>
      <div
        onClick={() => mutation.mutate()}
        className="cursor-pointer border-white border rounded-lg bg-black hover:opacity-80 text-white text-center px-6 py-4 max-w-80"
      >
        <div className="flex items-center justify-left gap-8">
          <img src={githubLogo} height={12} width={30} />
          Sign in with Github
        </div>
      </div>
    </div>
  );
};

export default GithubLoginButton;
