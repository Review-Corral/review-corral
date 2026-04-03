import GithubLoginButton from "@/components/landing/GIthubLoginButton";
import { LogoWithText } from "@/components/landing/LogoWithText";
import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/login/")({
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="landing-dark flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <LogoWithText dark />
        </div>
        <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
          <h2 className="text-xl font-semibold text-white text-center mb-2">
            Get started
          </h2>
          <p className="text-center text-sm text-stone-400 mb-8">
            Sign in with GitHub to get started. This will
            allow Review Corral to see the repositories
            you're a part of.
          </p>
          <GithubLoginButton />
        </div>
        <p className="text-center text-xs text-stone-500 mt-6">
          <Link to="/" className="hover:text-stone-300 transition-colors">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
