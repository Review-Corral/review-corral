import { XCircleIcon } from "@heroicons/react/outline";
import { FC } from "react";

interface ErrorProps {
  message: string;
}

export const ErrorAlert: FC<ErrorProps> = ({ message }) => {
  return (
    <div className="rounded-md bg-red-50 p-4 max-w-lg">
      <div className="flex">
        <div className="flex-shrink-0">
          <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">{message}</h3>
        </div>
      </div>
    </div>
  );
};
