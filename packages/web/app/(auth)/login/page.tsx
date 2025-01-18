import GithubLoginButton from "./GIthubLoginButton";

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <img
          className="mx-auto h-24 w-auto"
          src="https://avatars.githubusercontent.com/in/203068?s=120&u=4f27b80d54a1405e10756a1dc0175d1ef3866422&v=4"
          alt="Review Corral Logo"
        />
      </div>
      <h2 className="mt-2 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
        Review Corral
      </h2>

      <div className="flex justify-center mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <GithubLoginButton />
      </div>
    </div>
  );
}
