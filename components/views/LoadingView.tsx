import React from "react";
import { Spinner } from "../assets/icons/Spinner";

interface LoadingViewProps {
  loadingText?: string;
}

const LoadingView: React.FC<LoadingViewProps> = ({
  loadingText = "Loading",
}) => {
  return (
    <div
      data-testid="loading-page"
      className="flex h-screen w-screen items-center justify-cente"
    >
      <div className="flex flex-col items-center space-y-8 ">
        <div className="flex items-center">
          <Spinner className="-ml-1 mr-3 h-5 w-5 animate-spin text-indigo-700" />
          <span className="text-darkBlue">{loadingText}</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingView;
