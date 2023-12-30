import { useState } from "react";
import "./App.css";
import GithubButton from "./GithubLogin";

function App() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loginError, _setLoginError] = useState<string | undefined>(undefined);

  return (
    <>
      <div>{import.meta.env.VITE_API_URL ?? "none"}</div>
      <GithubButton />
      {loginError && (
        <div className="mt-6">
          <div className="relative">
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-red-500">
                Error logging in
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
