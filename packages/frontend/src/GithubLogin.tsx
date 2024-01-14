import ky from "ky";
import React from "react";
import { useMutation } from "react-query";

interface GithubButtonProps {}

const GithubButton: React.FC<GithubButtonProps> = () => {
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
        className="underline cursor-pointer p-1 border-white border rounded-md"
      >
        Login with Github
      </div>
    </div>
  );
};

export default GithubButton;
