"use client"; // Error components must be Client Components

import { ErrorCard } from "@/components/cards/ErrorCard";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <ErrorCard message={"Something went wrong fetching your Slack setup"} />
  );
}
