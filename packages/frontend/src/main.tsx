import { Outlet, RootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import Cookies from "js-cookie";
import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "react-query";
import {
  LoaderFunction,
  LoaderFunctionArgs,
  RouterProvider,
  createBrowserRouter,
  redirect,
} from "react-router-dom";
import App from "./App.tsx";
import { auth_access_token_key } from "./auth/const.ts";
import { userIsLoggedIn } from "./auth/utils.ts";
import { HomeView } from "./home/HomeView.tsx";
import "./index.css";
import { OrgsView } from "./org/OrgsView.tsx";
import { OrgView } from "./organization/OrgView.tsx";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const protectedLoader: LoaderFunction = async (_args: LoaderFunctionArgs) => {
  if (!userIsLoggedIn()) {
    return redirect("/login");
  }

  return null;
};

const rootRoute = new RootRoute({
  component: () => (
    <>
      <div className="p-2 flex gap-2">Home page</div>
      <hr />
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
});

const dashboard = new RootRoute({
  component: () => (
    <>
      <div className="p-2 flex gap-2">Home page</div>
      <hr />
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
});

// Route components must be wrapped with the ModalContext here, so the modal components
// have access to the context from RouterProvider (to navigate around etc.)
const router = createBrowserRouter([
  {
    path: "/login",
    element: <App />,
    loader: async () => {
      if (userIsLoggedIn()) {
        return redirect("/");
      }
      return null;
    },
  },
  {
    path: "/login/success",
    loader: async ({ request }) => {
      const url = new URL(request.url);
      const token = url.searchParams.get("token");

      if (token) {
        Cookies.set(auth_access_token_key, token);
        return redirect("/");
      } else {
        return redirect("/error");
      }
    },
  },
  {
    path: "/logout",
    loader: async () => {
      Cookies.remove(auth_access_token_key);
      return redirect("/login");
    },
  },
  {
    path: "/org",
    element: <OrgsView />,
    loader: protectedLoader,
  },
  {
    path: "/org/:orgId",
    element: <OrgView />,
    loader: async (args) => {
      const protectedResult = await protectedLoader(args);
      if (protectedResult) return protectedResult;

      const { orgId } = args.params;

      console.log("Got orgId in params:", orgId);

      if (!orgId) {
        throw new Response("Not Found", { status: 404 });
      }

      return { orgId };
    },
  },
  {
    path: "/",
    element: <HomeView />,
    loader: protectedLoader,
  },
  {
    path: "/error",
    element: <div>Something went wrong...</div>,
  },
]);

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" reverseOrder={false} />
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
