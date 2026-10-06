import { readFile, writeFile, mkdir, rm, lstat } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const reserved = new Set(["index.html", "build.json", "branches.json", "CNAME", ".nojekyll"]);

export function branchDirectory(branch) {
  if (branch === "main") return "";
  const parts = branch.split("/");
  if (!branch || parts.some((part) => !part || part.startsWith(".") || part.includes("\\") || part.includes("~"))) {
    throw new Error(`Unsafe branch name: ${branch}`);
  }
  // Git branch names cannot contain '~', so this escape cannot collide with another branch.
  if (reserved.has(parts[0])) parts[0] = `~${parts[0]}`;
  return `${parts.join("/")}/`;
}

const urlPath = (path) => path.split("/").map(encodeURIComponent).join("/");
const escapeAttribute = (text) => text.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

async function readRegularFile(path) {
  try {
    if (!(await lstat(path)).isFile()) throw new Error(`Not a regular file: ${path}`);
    return await readFile(path, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
}

export async function prepareSite({ previous, output, build, branches, branch, subdirectory, cleanupOnly = false, siteUrl }) {
  const rootUrl = `${siteUrl.replace(/\/$/, "")}/`;
  if (!["https:", "http:"].includes(new URL(rootUrl).protocol)) throw new Error("Invalid Pages URL");
  // Reconstruct from live branches only, rather than deleting a parent directory that might contain another preview.
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  const active = branches.filter((item) => item.name !== "gh-pages").sort((a, b) => a.name === "main" ? -1 : b.name === "main" ? 1 : a.name.localeCompare(b.name));
  const manifest = [];
  for (const item of active) {
    const directory = branchDirectory(item.name);
    let html = await readRegularFile(resolve(previous, directory, "index.html"));
    let metadata = await readRegularFile(resolve(previous, directory, "build.json"));
    if (!cleanupOnly && item.name === branch) {
      if ((subdirectory ? branchDirectory(subdirectory) : "") !== directory) throw new Error("Subdirectory must match the source branch");
      const candidate = JSON.parse(await readFile(resolve(build, "build.json"), "utf8"));
      if (candidate.branch !== branch) throw new Error("Build metadata does not match the publishing branch");
      if (candidate.sha === item.commit.sha) {
        html = await readRegularFile(resolve(build, "index.html"));
        if (!html) throw new Error("Built index.html is missing");
        metadata = `${JSON.stringify(candidate, null, 2)}\n`;
      } else {
        console.log(`Skipping stale build for ${branch}; branch HEAD has changed.`);
      }
    }
    if (html) {
      html = html.replace(/<meta name="study-app-site-root" content="[^"]*">\s*/g, "");
      html = html.replace(/<head>/i, `<head>\n<meta name="study-app-site-root" content="${escapeAttribute(rootUrl)}">`);
      const destination = resolve(output, directory);
      await mkdir(destination, { recursive: true });
      await writeFile(resolve(destination, "index.html"), html);
      if (metadata) await writeFile(resolve(destination, "build.json"), metadata);
    }
    manifest.push({ name: item.name, path: urlPath(directory), published: Boolean(html) });
  }
  const cname = await readRegularFile(resolve(previous, "CNAME"));
  if (cname) await writeFile(resolve(output, "CNAME"), cname);
  await writeFile(resolve(output, ".nojekyll"), "");
  await writeFile(resolve(output, "branches.json"), `${JSON.stringify({ branches: manifest }, null, 2)}\n`);
  return manifest;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const temp = process.env.RUNNER_TEMP;
  const branches = JSON.parse(await readFile(resolve(temp, "active-branches.json"), "utf8")).flat();
  await prepareSite({
    previous: resolve(temp, "previous-site"),
    output: resolve(temp, "published-site"),
    build: resolve(process.env.BUILD_DIRECTORY),
    branches,
    branch: process.env.PUBLISH_BRANCH,
    subdirectory: process.env.PUBLISH_SUBDIRECTORY,
    cleanupOnly: process.env.CLEANUP_ONLY === "true",
    siteUrl: process.env.SITE_URL,
  });
}
