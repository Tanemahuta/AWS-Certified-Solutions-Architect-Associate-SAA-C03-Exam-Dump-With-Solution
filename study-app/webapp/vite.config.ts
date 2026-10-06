import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { renderDeploymentOverlay } from "../scripts/deployment-overlay.mjs";

export default defineConfig({
  root: "webapp",
  plugins: [react(), viteSingleFile(), {
    name: "deployment-overlay",
    transformIndexHtml(html) {
      const overlay = renderDeploymentOverlay({ version: process.env.APP_VERSION, branch: process.env.APP_BRANCH });
      return html.replace("</body>", `${overlay}\n</body>`);
    },
  }],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
  },
});
