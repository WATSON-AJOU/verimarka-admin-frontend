import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";
import { appLogger } from "./lib/logger";
import { initSentry } from "./lib/sentry";

void initSentry();

window.addEventListener("error", (event) => {
  appLogger.error("admin.frontend.runtime_error", {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
  });
});

window.addEventListener("unhandledrejection", (event) => {
  appLogger.error("admin.frontend.unhandled_rejection", {
    reason: event.reason,
  });
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
