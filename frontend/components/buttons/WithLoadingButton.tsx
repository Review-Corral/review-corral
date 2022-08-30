import { FC } from "react";
import { Spinner } from "../assets/icons/Spinner";
import WithLeftIcon from "../common/WithLeftIcon";
import Button, { ButtonProps } from "./Button";

interface WithLoadingButtonProps extends ButtonProps {
  isLoading: boolean;
  loadingButtonProps?: ButtonProps;
  loadingChildrenClassName?: string;
  children?: React.ReactNode;
  customLoadingText?: string;
}

export const WithLoadingButton: FC<WithLoadingButtonProps> = ({
  isLoading,
  loadingButtonProps,
  loadingChildrenClassName,
  children,
  customLoadingText,
  ...props
}) => {
  if (!isLoading) {
    return <Button {...props}>{children}</Button>;
  }
  return (
    <Button {...props} {...loadingButtonProps}>
      <div className={loadingChildrenClassName}>
        <WithLeftIcon icon={<Spinner className=" h-4 w-4 mr-4 animate-spin" />}>
          <span>{customLoadingText || "Loading..."}</span>
        </WithLeftIcon>
      </div>
    </Button>
  );
};
