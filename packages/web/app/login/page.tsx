import { GithubLoginButton } from "./GithubLogin";
import { login } from "./actions";

export default function Login() {
  return (
    <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md"></div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px] ">
        <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12 flex flex-col gap-4">
          <div className="flex flex-col items-center">
            <img
              className="h-16 w-16"
              src="https://avatars.githubusercontent.com/in/203068?s=120&u=4f27b80d54a1405e10756a1dc0175d1ef3866422&v=4"
              alt="Review Corral logo"
            />
            <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
              Review Corral
            </h2>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-center">
              Login or get started by authenticating with your GitHub account.
            </p>
            <form className="mt-8" action={login}>
              <GithubLoginButton />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
