"use client";

import { Button } from "@/components/ui/button";
import { ReloadIcon } from "@radix-ui/react-icons";
import { Github } from "lucide-react";
import { FC } from "react";
import { useFormStatus } from "react-dom";

interface GithubLoginProps {}

export const GithubLoginButton: FC<GithubLoginProps> = () => {
  const { pending } = useFormStatus();

  if (pending) {
    return (
      <Button disabled>
        <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  } else {
    return (
      <Button type="submit">
        <Github className="mr-2 h-4 w-4" />
        Login to Github
      </Button>
    );
  }
};
