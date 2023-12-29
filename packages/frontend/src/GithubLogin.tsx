import React from "react";
import { Link } from "react-router-dom";

interface GithubButtonProps {}

const GithubButton: React.FC<GithubButtonProps> = () => {
  return (
    <div>
      <Link to={import.meta.env.VITE_AUTH_URL}>
        <div className="underline cursor-pointer p-1 border-white border rounded-md">
          Login with Github
        </div>
      </Link>
    </div>
  );
};

export default GithubButton;
