import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { App } from "./App";
import { DeploymentToolbar } from "./components/DeploymentToolbar";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DeploymentToolbar version={__APP_VERSION__} branch={__APP_BRANCH__} />
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
