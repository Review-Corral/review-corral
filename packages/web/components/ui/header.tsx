import { cn } from "@/lib/utils";
import { PropsWithChildren } from "react";

export const Header: React.FC<
  PropsWithChildren & {
    classname?: string;
  }
> = ({ children, classname }) => (
  <h1 className={cn("text-2xl font-bold pt-8", classname)}>{children}</h1>
);
