import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#09090B",
            border: "1px solid #27272A",
            color: "#fff",
            borderRadius: "6px",
            fontSize: "13px",
          },
          success: { iconTheme: { primary: "#22C55E", secondary: "#000" } },
          error: { iconTheme: { primary: "#EF4444", secondary: "#000" } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
