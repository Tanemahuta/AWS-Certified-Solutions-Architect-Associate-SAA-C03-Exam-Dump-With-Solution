import { readFileSync } from "node:fs";

const escapeHtml = (value) => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

export function renderDeploymentOverlay({ version = "dev", branch = "local", branches = [{ name: branch, path: "", published: true }] } = {}) {
  const template = readFileSync(new URL("../webapp/deployment-overlay.html", import.meta.url), "utf8");
  const fragment = template.split("<!-- deployment-overlay:start -->")[1]?.split("<!-- deployment-overlay:end -->")[0];
  if (!fragment) throw new Error("Deployment overlay template markers are missing");
  const options = branches.map((item) => `<option value="${escapeHtml(item.name)}" data-path="${escapeHtml(item.path)}"${item.name === branch ? " selected" : ""}${item.published ? "" : " disabled"}>${escapeHtml(item.name + (item.published ? "" : " (build pending)"))}</option>`).join("\n");
  return fragment
    .replace(/data-version="[^"]*"/, `data-version="${escapeHtml(version)}"`)
    .replace(/data-branch="[^"]*"/, `data-branch="${escapeHtml(branch)}"`)
    .replace(/<!-- overlay-options:start -->[\s\S]*?<!-- overlay-options:end -->/, options);
}
