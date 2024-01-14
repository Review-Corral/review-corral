import { Info } from "lucide-react";
import { CardProps } from "./types";

export const InfoCard: React.FC<CardProps> = ({ message, subMessage }) => {
  return (
    <div className="rounded-md bg-blue-50 p-4 max-w-lg">
      <div className="flex">
        <div className="flex-shrink-0">
          <Info className="h-5 w-5 text-blue-400" aria-hidden="true" />
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
