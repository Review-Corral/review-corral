import Cookies from "js-cookie";
import React from "react";
import ReactDOM from "react-dom/client";
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
import { OrgView } from "./org/OrgView.tsx";
import { OrgsView } from "./org/OrgsView.tsx";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const protectedLoader: LoaderFunction = async (args: LoaderFunctionArgs) => {
  if (!userIsLoggedIn()) {
    return redirect("/login");
  }

  return null;
};

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
    path: "/org",
    element: <OrgsView />,
    loader: protectedLoader,
  },
  {
    path: "/org/:orgId",
    element: <OrgView />,
    loader: protectedLoader,
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
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
