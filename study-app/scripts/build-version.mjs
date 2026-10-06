import { execFileSync } from "node:child_process";
import { appendFile, readFile, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { analyzeCommits } from "@semantic-release/commit-analyzer";

export function nextVersion(previous, type) {
  if (!type) return previous ?? "0.0.0";
  if (!previous) return "1.0.0";
  const [major, minor, patch] = previous.split(".").map(Number);
  if (type === "major") return `${major + 1}.0.0`;
  if (type === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

export async function calculateVersion(cwd, branch, sha) {
  const git = (...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
  // Use the same analyzer and options as the real release, without requiring push credentials.
  const config = JSON.parse(await readFile(`${cwd}/.releaserc.json`, "utf8"));
  const analyzer = config.plugins.find((plugin) => Array.isArray(plugin) && plugin[0] === "@semantic-release/commit-analyzer");
  const tags = git("tag", "--merged", "HEAD", "--list", "v*", "--sort=-version:refname").split("\n");
  const lastTag = tags.find((tag) => /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(tag));
  const range = lastTag ? `${lastTag}..HEAD` : "HEAD";
  const commits = git("log", "--format=%H%x00%B%x00", range).split("\0");
  const entries = [];
  for (let i = 0; i + 1 < commits.length; i += 2) entries.push({ hash: commits[i].trim(), message: commits[i + 1].trim() });
  const type = await analyzeCommits(analyzer?.[1] ?? {}, { cwd, commits: entries, logger: { log() {} } });
  const version = nextVersion(lastTag?.slice(1), type);
  return { branch, sha, version: branch === "main" ? version : `${version}-preview.sha${sha.slice(0, 7)}` };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const branch = process.env.APP_BRANCH ?? "local";
  const sha = process.env.APP_SHA ?? execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const metadata = await calculateVersion(process.cwd(), branch, sha);
  const metadataPath = process.env.BUILD_METADATA_PATH ?? "dist/build.json";
  await mkdir(dirname(metadataPath), { recursive: true });
  await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
  if (process.env.GITHUB_ENV) {
    await appendFile(process.env.GITHUB_ENV, `APP_VERSION=${metadata.version}\nAPP_BRANCH=${branch}\n`);
  }
  console.log(`Build ${metadata.version} (${branch})`);
}
