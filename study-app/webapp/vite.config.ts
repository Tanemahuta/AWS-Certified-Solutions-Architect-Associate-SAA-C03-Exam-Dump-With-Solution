import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  root: "webapp",
  plugins: [react(), viteSingleFile()],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.APP_VERSION ?? "dev"),
    __APP_BRANCH__: JSON.stringify(process.env.APP_BRANCH ?? "local"),
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
  },
});
