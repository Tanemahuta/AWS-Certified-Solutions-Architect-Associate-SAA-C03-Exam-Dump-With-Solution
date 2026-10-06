import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { renderDeploymentOverlay } from "../scripts/deployment-overlay.mjs";

export default defineConfig({
  root: "webapp",
  plugins: [react(), viteSingleFile(), {
    name: "mdi-woff2-only",
    enforce: "pre",
    transform(css, id) {
      if (!id.replaceAll("\\", "/").endsWith("/@mdi/font/css/materialdesignicons.css")) return;
      // Modern browsers use WOFF2; avoid embedding duplicate legacy font formats.
      return css.replace(/@font-face\s*\{[\s\S]*?\}/g, (face) => {
        const source = face.match(/url\(([^)]*\.woff2[^)]*)\)\s*format\(["']woff2["']\)/);
        if (!source) throw new Error("MDI stylesheet has no WOFF2 font source.");
        return face.replace(/src\s*:[^;]*;/g, "").replace(/\}$/, `src: url(${source[1]}) format("woff2");}`);
      });
    },
  }, {
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
