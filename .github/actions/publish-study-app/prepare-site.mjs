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
const placeholderMarker = '<meta name="study-app-placeholder" content="main">';

function rootPlaceholder(branches, rootUrl) {
  const options = branches.map((item) => {
    const label = `${item.name}${item.published ? "" : " (build pending)"}`;
    return `<option value="${escapeAttribute(`${item.path}index.html`)}"${item.name === "main" ? " selected" : ""}${item.published ? "" : " disabled"}>${escapeAttribute(label)}</option>`;
  }).join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="study-app-site-root" content="${escapeAttribute(rootUrl)}">
${placeholderMarker}
<title>AWS SAA-C03 Exam Prep</title>
<style>
body { margin: 0; background: #f1f5f9; color: #172033; font-family: system-ui, sans-serif; }
aside { position: fixed; top: 1rem; right: 1rem; display: flex; align-items: center; gap: .5rem; }
select { max-width: 60vw; padding: .4rem; border: 1px solid #94a3b8; border-radius: .35rem; font: inherit; background: white; }
main { min-height: 100vh; min-height: 100dvh; display: grid; place-items: center; padding: 0 1rem; box-sizing: border-box; }
</style>
</head>
<body>
<aside aria-label="Branch selection"><label for="deployment-branch">Branch</label><select id="deployment-branch">${options}</select></aside>
<main><p>no published main version, yet.</p></main>
<script>
document.getElementById('deployment-branch').addEventListener('change', function () {
  const root = document.querySelector('meta[name="study-app-site-root"]').content;
  window.location.assign(new URL(this.value, root).href);
});
</script>
</body>
</html>
`;
}

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
    // Regenerate placeholders each time so their branch list stays current.
    if (item.name === "main" && html?.includes(placeholderMarker)) {
      html = undefined;
      metadata = undefined;
    }
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
  let main = manifest.find((item) => item.name === "main");
  if (!main?.published) {
    if (!main) {
      main = { name: "main", path: "", published: false };
      manifest.unshift(main);
    }
    main.published = true;
    main.placeholder = true;
    await writeFile(resolve(output, "index.html"), rootPlaceholder(manifest, rootUrl));
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
