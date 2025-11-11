import { AlertTriangle } from "lucide-react";
import { CardProps } from "./types";

export const WarningCard: React.FC<CardProps> = ({ message, subMessage }) => {
  return (
    <div className="rounded-md bg-amber-50 p-4 max-w-lg border border-amber-300">
      <div className="flex">
        <div className="shrink-0">
          <AlertTriangle className="h-5 w-5 text-amber-400" aria-hidden="true" />
        </div>
        <div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-amber-800">{message}</h3>
            {subMessage && (
              <div className="text-sm font-light text-amber-800 pt-1">{subMessage}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
