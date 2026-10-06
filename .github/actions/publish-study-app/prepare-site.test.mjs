import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { branchDirectory, prepareSite } from "./prepare-site.mjs";

async function fixture(callback) {
  const temp = await mkdtemp(resolve(tmpdir(), "saa-pages-"));
  const previous = resolve(temp, "previous");
  const output = resolve(temp, "output");
  const build = resolve(temp, "build");
  const file = async (root, path, contents) => {
    await mkdir(resolve(root, path, ".."), { recursive: true });
    await writeFile(resolve(root, path), contents);
  };
  try {
    await mkdir(previous);
    await mkdir(build);
    await file(previous, "index.html", "<html><head></head><body>main</body></html>");
    await file(previous, "feat/keep/index.html", "<html><head></head><body>keep</body></html>");
    await file(previous, "feat/deleted/index.html", "deleted");
    await file(previous, "unknown/nested/index.html", "orphan without manifest entry");
    await file(build, "index.html", "<html><head></head><body>new app</body></html>");
    const options = { previous, output, build, siteUrl: "https://example.github.io/app", subdirectory: "", branches: [
      { name: "main", commit: { sha: "main-sha" } },
      { name: "feat/keep", commit: { sha: "keep-sha" } },
      { name: "feat/new", commit: { sha: "new-sha" } },
      { name: "gh-pages", commit: { sha: "pages-sha" } },
    ] };
    await callback({ options, file });
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}

test("publishes a slash-named branch, preserves root and peers, removes every orphan, and lists pending branches", async () => {
  await fixture(async ({ options, file }) => {
    await file(options.build, "build.json", JSON.stringify({ branch: "feat/new", sha: "new-sha", version: "1.1.0-preview.shanew" }));
    const manifest = await prepareSite({ ...options, branch: "feat/new", subdirectory: "feat/new" });
    assert.match(await readFile(resolve(options.output, "feat/new/index.html"), "utf8"), /new app/);
    assert.match(await readFile(resolve(options.output, "index.html"), "utf8"), /main/);
    assert.match(await readFile(resolve(options.output, "feat/keep/index.html"), "utf8"), /keep/);
    assert.deepEqual(await readdir(resolve(options.output, "feat")), ["keep", "new"]);
    assert.equal((await readdir(options.output)).includes("unknown"), false);
    assert.deepEqual(manifest.map((item) => item.name), ["main", "feat/keep", "feat/new"]);
    assert.match(await readFile(resolve(options.output, "feat/new/index.html"), "utf8"), /content="https:\/\/example.github.io\/app\/"/);
  });
});

test("main replaces only root and retains previews; cleanup does not replace any app", async () => {
  await fixture(async ({ options, file }) => {
    await file(options.build, "build.json", JSON.stringify({ branch: "main", sha: "main-sha", version: "1.1.0" }));
    const manifest = await prepareSite({ ...options, branch: "main" });
    assert.match(await readFile(resolve(options.output, "index.html"), "utf8"), /new app/);
    assert.match(await readFile(resolve(options.output, "feat/keep/index.html"), "utf8"), /keep/);
    assert.equal(manifest.find((item) => item.name === "feat/new").published, false);
    await prepareSite({ ...options, branch: "main", cleanupOnly: true });
    assert.match(await readFile(resolve(options.output, "index.html"), "utf8"), /main/);
    assert.equal((await readdir(resolve(options.output, "feat"))).includes("deleted"), false);
  });
});

test("stale or deleted branch builds never recreate previews or overwrite current ones", async () => {
  await fixture(async ({ options, file }) => {
    await file(options.build, "build.json", JSON.stringify({ branch: "feat/keep", sha: "old-sha", version: "1.0.0" }));
    await prepareSite({ ...options, branch: "feat/keep", subdirectory: "feat/keep" });
    assert.match(await readFile(resolve(options.output, "feat/keep/index.html"), "utf8"), /keep/);
    await prepareSite({ ...options, branch: "feat/deleted", subdirectory: "feat/deleted" });
    assert.equal((await readdir(resolve(options.output, "feat"))).includes("deleted"), false);
  });
});

test("rejects path traversal and escapes branches that collide with root files", () => {
  assert.throws(() => branchDirectory("../escape"), /Unsafe/);
  assert.throws(() => branchDirectory("feat/../../escape"), /Unsafe/);
  assert.equal(branchDirectory("index.html"), "~index.html/");
  assert.equal(branchDirectory("branches.json/topic"), "~branches.json/topic/");
});
