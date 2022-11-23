import { FC } from "react";

interface activeLightProps {}

export const ActiveLight: FC<activeLightProps> = () => {
  return (
    <div className="relative flex items-center justify-center mt-0.5">
      <div className="absolute z-10 h-[0.6rem] w-[0.6rem] rounded-full bg-green-300 blur-sm"></div>
      <div className="absolute z-20 rounded-full h-2 w-2 bg-green-500"></div>
    </div>
  );
};
