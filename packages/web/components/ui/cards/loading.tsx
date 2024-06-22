import { Loader2Icon } from "lucide-react";
import { FC } from "react";

interface LoadingProps {
  text?: string;
}

export const Loading: FC<LoadingProps> = ({ text = "Loading..." }) => {
  return (
    <div className="flex gap-2 items-center">
      <Loader2Icon className="animate-spin h-5 w-5 black" />
      <span>{text}</span>
    </div>
  );
};
