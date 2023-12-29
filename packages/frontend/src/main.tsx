import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";

// Route components must be wrapped with the ModalContext here, so the modal components
// have access to the context from RouterProvider (to navigate around etc.)
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/login/success",
    element: <App />, // TODO:
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
