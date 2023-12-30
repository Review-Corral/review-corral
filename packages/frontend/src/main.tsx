import Cookies from "js-cookie";
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "react-query";
import {
  RouterProvider,
  createBrowserRouter,
  redirect,
} from "react-router-dom";
import App from "./App.tsx";
import { auth_access_token_key } from "./auth/const.ts";
import "./index.css";
import { ProfileView } from "./profile/ProfileView.tsx";

// Route components must be wrapped with the ModalContext here, so the modal components
// have access to the context from RouterProvider (to navigate around etc.)
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/login/success",
    loader: async ({ request }) => {
      const url = new URL(request.url);
      const token = url.searchParams.get("token");

      if (token) {
        Cookies.set(auth_access_token_key, token);
        return redirect("/home");
      } else {
        return redirect("/error");
      }
    },
  },
  {
    path: "/home",
    element: <ProfileView />,
  },
  {
    path: "/error",
    element: <div>Something went wrong...</div>,
  },
]);

// Create a client
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
