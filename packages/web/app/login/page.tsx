import { GithubLoginButton } from "./GithubLogin";
import { login } from "./actions";

export default function Login() {
  return (
    <div>
      <h1>Login page</h1>
      <form action={login}>
        <GithubLoginButton />
      </form>
    </div>
  );
}
