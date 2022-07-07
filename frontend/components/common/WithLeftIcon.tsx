import cntl from "cntl";
import React from "react";

interface WithLeftIconProps {
  alignItemsCenter?: boolean;
  icon: React.ReactElement;
  children: React.ReactNode;
}
const WithLeftIcon: React.FC<WithLeftIconProps> = ({
  icon,
  alignItemsCenter = true,
  children,
}) => {
  const wrapperCN = cntl`
    flex
    ${alignItemsCenter ? "items-center" : ""}
  `;
  return (
    <div className={wrapperCN}>
      <span className="">{icon}</span>
      <div>{children}</div>
    </div>
  );
};

export default WithLeftIcon;
