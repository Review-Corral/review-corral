import { ComponentType, FC } from "react";
import { useInstallations } from "../hooks/useInstallations";
import LoadingView from "./LoadingView";

export const withInstallations = (WrappedComponent: ComponentType): FC => {
  const WithInstallations: FC = () => {
    const installations = useInstallations();

    if (installations.isLoading) {
      return <LoadingView loadingText="Loading your GitHub workspaces" />;
    }

    return <WrappedComponent />;
  };

  return WithInstallations;
};
