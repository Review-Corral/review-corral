"use client";

import { cn } from "@components/lib/utils";
import { BetterButton } from "@components/ui/BetterButton";
import React, { useState } from "react";
import { useEffect } from "react";

const GithubLoginButton: React.FC = () => {
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);

  const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID!;
  const redirectUri = `${import.meta.env.VITE_API_URL}/auth/callback`;

  console.log("Environment variables:", {
    GITHUB_CLIENT_ID,
    VITE_API_URL: import.meta.env.VITE_API_URL,
    allEnv: import.meta.env,
  });

  const isLoading = isRedirecting;

  useDetectRedirect(() => {
    setIsRedirecting(!isRedirecting);
  });

  return (
    <div>
      <BetterButton
        isLoading={isLoading}
        onClick={() => {
          console.log("logging in");
          window.open(
            `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=user:email&redirect_uri=${redirectUri}`,
            "_self",
          );
        }}
      >
        <div
          className={cn("flex items-center justify-left gap-8", isLoading && "pl-6")}
        >
          {!isLoading && (
            <img
              src="/github-mark/github-mark-white.svg"
              alt="Github Login"
              height={8}
              width={20}
            />
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
    const handleBeforeUnload = (_event: BeforeUnloadEvent) => {
      onRedirect();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [onRedirect]);
};
