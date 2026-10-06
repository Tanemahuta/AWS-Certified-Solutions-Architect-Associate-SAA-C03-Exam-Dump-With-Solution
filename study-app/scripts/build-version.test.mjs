import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { calculateVersion } from "./build-version.mjs";

test("predicts the same release bumps as semantic-release and labels previews", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "saa-version-"));
  const git = (...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  try {
    git("init", "-b", "main");
    git("config", "user.name", "Version test");
    git("config", "user.email", "version@example.com");
    git("config", "commit.gpgsign", "false");
    git("config", "tag.gpgsign", "false");
    await writeFile(join(cwd, ".releaserc.json"), JSON.stringify({ plugins: [["@semantic-release/commit-analyzer", { preset: "conventionalcommits" }]] }));
    git("add", ".");
    git("commit", "-m", "feat: initial app");
    const sha = git("rev-parse", "HEAD");
    assert.equal((await calculateVersion(cwd, "main", sha)).version, "1.0.0");
    git("tag", "v1.0.0");
    git("commit", "--allow-empty", "-m", "docs: describe app");
    assert.equal((await calculateVersion(cwd, "main", sha)).version, "1.0.0");
    git("commit", "--allow-empty", "-m", "fix: repair answers");
    assert.equal((await calculateVersion(cwd, "main", sha)).version, "1.0.1");
    git("commit", "--allow-empty", "-m", "feat: branch selector");
    assert.equal((await calculateVersion(cwd, "main", sha)).version, "1.1.0");
    assert.equal((await calculateVersion(cwd, "feat/previews", "0123456789abcdef")).version, "1.1.0-preview.sha0123456");
    git("commit", "--allow-empty", "-m", "feat!: replace deployment layout");
    assert.equal((await calculateVersion(cwd, "main", sha)).version, "2.0.0");
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
