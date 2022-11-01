import cntl from "cntl";
import { FC } from "react";
import { Spinner } from "../assets/icons/Spinner";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  leftIcon?: React.ReactNode;
  isLoading?: boolean;
  color?: "indigo" | "green";
  variant?: "solid" | "outline";
}

export const Button: FC<ButtonProps> = ({
  color = "green",
  variant = "solid",
  isLoading = false,
  leftIcon,
  ...props
}) => {
  const baseCn = cntl`
    inline-block
    items-center
    px-4
    py-2
    border
    text-sm
    font-medium
    rounded-md
    shadow-sm
    focus:outline-none
    focus:ring-2
    focus:ring-offset-2
  `;

  const getClassName = (): string => {
    if (props.disabled) {
      return cntl`
        ${baseCn}
        text-white
        bg-gray-300
        border-gray-300
      `;
    } else {
      return cntl`
        ${baseCn}
        border-transparent
        text-white
        ${
          color === "green"
            ? `
              bg-green-600
              hover:bg-green-700
              focus:ring-green-500
              `
            : `
              bg-indigo-600
              hover:bg-indigo-700
              focus:ring-indigo-500
              `
        }
      `;
    }
  };

  return (
    <button type="button" className={getClassName()} {...props}>
      <div className="flex items-center space-x-3">
        {isLoading && (
          <div>
            <Spinner className="h-4 animate-spin" />
          </div>
        )}
        {!isLoading && leftIcon && leftIcon}
        {props.children}
      </div>
    </button>
  );
};

export default Button;
