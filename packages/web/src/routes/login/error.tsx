import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/login/error")({
  component: LoginErrorPage,
});

function LoginErrorPage() {
  return (
    <div>
      <p>Oops... there was an error logging you in. </p>
      <a href="https://www.reviewcorral.com">home</a>
    </div>
  );
}
