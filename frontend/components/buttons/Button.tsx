import cntl from "cntl";
import { FC } from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color?: "indigo" | "green";
}

export const Button: FC<ButtonProps> = ({ color, ...props }) => {
  return (
    <button
      type="button"
      className={cntl`
        inline-flex
        items-center
        px-4
        py-2
        border
        border-transparent
        text-sm
        font-medium
        rounded-md
        shadow-sm
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
        focus:outline-none
        focus:ring-2
        focus:ring-offset-2
      `}
      {...props}
    >
      {props.children}
    </button>
  );
};

export default Button;
