import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";
import './supabase-test';
import { ErrorBoundary } from "./components/common";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
    <App />
    </ErrorBoundary>
  </StrictMode>
);
