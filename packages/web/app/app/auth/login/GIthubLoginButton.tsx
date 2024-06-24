"use client";

import ky from "ky";
import React, { useState } from "react";
import githubLogo from "../../../../public/github-mark/github-mark-white.svg";
import { BetterButton } from "@components/ui/BetterButton";
import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { cn } from "@/components/lib/utils";

const GithubLoginButton: React.FC = () => {
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  const authUri = process.env.NEXT_PUBLIC_AUTH_URL!;
  console.log({ authUri });
  const mutation = useMutation({
    mutationFn: async () => {
      console.log("logging in");
      const payload = await ky.get(authUri).json<{ github: string }>();
      window.open(payload.github, "_self");
    },
  });

  const isLoading = mutation.isPending || isRedirecting;

  useDetectRedirect(() => {
    console.log(`Is redirecting!: ${!isRedirecting}`);
    setIsRedirecting(!isRedirecting);
  });

  return (
    <div>
      <BetterButton isLoading={isLoading} onClick={() => mutation.mutate()}>
        <div
          className={cn("flex items-center justify-left gap-8", isLoading && "pl-6")}
        >
          {!isLoading && (
            <img src={githubLogo} height={8} width={20} alt="Github login" />
          )}
          {!isLoading ? "Sign in with Github" : "Signing into Github"}
        </div>
      </BetterButton>
    </div>
  );
};

export default GithubLoginButton;

/**
 * Hook to handle window redirection detection.
 * @param onRedirect Callback function to handle the redirection event.
 */
const useDetectRedirect = (onRedirect: () => void) => {
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      onRedirect();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [onRedirect]);
};