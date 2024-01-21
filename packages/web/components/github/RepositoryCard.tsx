"use client";

import { Switch } from "@/components/ui/switch";
import { setActiveRepo } from "@/lib/fetchers/organizations";
import { useState } from "react";

interface RepositoryCardProps {
  repoId: number;
  active: boolean;
}

export const RepositoryCard: React.FC<RepositoryCardProps> = ({
  repoId,
  active,
}) => {
  const [isActive, setIsActive] = useState<boolean>(active);

  return (
    <Switch
      checked={isActive}
      id={repoId.toString()}
      onClick={async () => {
        setIsActive(!isActive);
        await setActiveRepo(repoId, !isActive);
      }}
    />
  );
};
