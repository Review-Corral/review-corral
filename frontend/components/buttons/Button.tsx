import cntl from "cntl";
import { FC } from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color?: "indigo" | "green";
  variant?: "solid" | "outline";
}

export const Button: FC<ButtonProps> = ({
  color = "green",
  variant = "solid",
  ...props
}) => {
  const baseCn = cntl`
    inline-flex
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

  if (props.disabled) {
    return (
      <button
        type="button"
        className={cntl`
        ${baseCn}
        text-white
        bg-gray-300
        border-gray-300
      `}
        {...props}
      >
        {props.children}
      </button>
    );
  }

  if (variant === "solid") {
    return (
      <button
        type="button"
        className={cntl`
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
      `}
        {...props}
      >
        {props.children}
      </button>
    );
  }

  if (variant === "outline") {
    return (
      <button
        type="button"
        className={cntl`
        ${baseCn}
        border-transparent
        bg-white
        border
        ${
          color === "green"
            ? `
              text-green-600
              hover:bg-green-50
              focus:ring-green-500
              border-green-600
              `
            : `
              text-indigo-600
              hover:bg-indigo-50
              focus:ring-indigo-500
              border-indigo-600
              `
        }
      `}
        {...props}
      >
        {props.children}
      </button>
    );
  }

  throw Error("Unsupported button");
};

export default Button;
