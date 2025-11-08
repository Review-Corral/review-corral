import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_landing/about")({
  component: AboutPage,
});

function AboutPage() {
  return <h1>about</h1>;
}
