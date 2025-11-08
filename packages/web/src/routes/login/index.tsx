import { createFileRoute } from "@tanstack/react-router";
import { LogoWithText } from "@/components/landing/LogoWithText";
import GithubLoginButton from "@/components/landing/GIthubLoginButton";

export const Route = createFileRoute("/login/")({
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex-col items-center border border-gray-200 w-full max-w-md overflow-hidden  bg-white rounded-lg">
        <div className="flex flex-col items-center justify-center px-8 pt-8 pb-6">
          <LogoWithText />

          <p className="mt-8 text-center text-sm text-gray-500">
            Login with your GitHub to get started. This will allow Review Corral to see
            the repositories you're a part of in order to install.
          </p>

          <div className="flex justify-center mt-8">
            <GithubLoginButton />
          </div>
        </div>
      </div>
    </div>
  );
}
