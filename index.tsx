import React from "react";
import ReactDOM from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import App from "./App";

const convexUrl = import.meta.env.VITE_CONVEX_URL;
if (!convexUrl) {
  console.warn(
    "VITE_CONVEX_URL is not set. Convex queries will fail until this is configured."
  );
}
const convex = new ConvexReactClient(convexUrl ?? "");

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
  </React.StrictMode>
);

// Log for debugging
console.log("App mounted. Convex URL:", convexUrl || "NOT SET");