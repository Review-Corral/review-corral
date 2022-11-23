import { InformationCircleIcon } from "@heroicons/react/outline";
import { FC, ReactNode } from "react";

interface ErrorProps {
  message: string;
  subMessage?: ReactNode;
}

export const InfoAlert: FC<ErrorProps> = ({ message, subMessage }) => {
  return (
    <div className="rounded-md bg-blue-50 p-4 max-w-lg">
      <div className="flex">
        <div className="flex-shrink-0">
          <InformationCircleIcon
            className="h-5 w-5 text-blue-400"
            aria-hidden="true"
          />
        </div>
        <div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">{message}</h3>
            {subMessage && (
              <div className="text-sm font-light text-blue-800 pt-1">
                {subMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
