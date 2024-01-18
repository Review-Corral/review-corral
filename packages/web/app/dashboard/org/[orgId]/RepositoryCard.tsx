"use client";

import { Switch } from "@/components/ui/switch";
import { FC } from "react";

interface RepositoryCardProps {
  repoId: number;
  active: boolean;
}

export const RepositoryCard: FC<RepositoryCardProps> = ({ repoId, active }) => {
  return <Switch value="true" id={repoId.toString()} type="submit" />;
};
