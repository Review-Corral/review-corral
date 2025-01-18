"use client";

import { cn } from "@/components/lib/utils";
import { BetterButton } from "@components/ui/BetterButton";
import Image from "next/image";
import React, { useState } from "react";
import { useEffect } from "react";

const GithubLoginButton: React.FC = () => {
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  const authUri = `${process.env.NEXT_PUBLIC_API_URL!}/auth`;

  const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID!;

  console.log({ authUri, GITHUB_CLIENT_ID });

  const isLoading = isRedirecting;

  useDetectRedirect(() => {
    console.log(`Is redirecting!: ${!isRedirecting}`);
    setIsRedirecting(!isRedirecting);
  });

  return (
    <div>
      <BetterButton
        isLoading={isLoading}
        onClick={() => {
          console.log("logging in");
          window.open(
            `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=user:email`,
            "_self",
          );
        }}
      >
        <div
          className={cn("flex items-center justify-left gap-8", isLoading && "pl-6")}
        >
          {!isLoading && (
            <Image
              src="/github-mark/github-mark-white.svg"
              alt="Github Login"
              height={8}
              width={20}
              priority
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
