import { Button, ButtonProps } from "@components/shadcn/button";
import { Loader2Icon } from "lucide-react";
import React, { FC } from "react";

interface BetterButtonProps extends ButtonProps {
  isLoading?: boolean;
}

export const BetterButton: FC<React.PropsWithChildren<BetterButtonProps>> = ({
  isLoading,
  children,
  ...props
}) => {
  return (
    <Button {...props} disabled={isLoading}>
      {isLoading && <Loader2Icon className="animate-spin h-5 w-5 black" />}
      {children}
    </Button>
  );
};
