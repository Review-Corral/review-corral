import ky from "ky";
import React from "react";
import { useMutation } from "react-query";

interface GithubButtonProps {}

const GithubButton: React.FC<GithubButtonProps> = () => {
  const mutation = useMutation({
    mutationFn: async () => {
      const payload = await ky
        .get(import.meta.env.VITE_AUTH_URL)
        .json<{ github: string }>();

      window.open(payload.github, "_self");
    },
  });

  return (
    <div>
      <div
        onClick={() => mutation.mutate()}
        className="underline cursor-pointer p-1 border-white border rounded-md"
      >
        Login with Github
      </div>
    </div>
  );
};

export default GithubButton;
