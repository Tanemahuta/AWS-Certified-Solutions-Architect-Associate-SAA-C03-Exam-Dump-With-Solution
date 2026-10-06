import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { renderDeploymentOverlay } from "./deployment-overlay.mjs";

const require = createRequire(import.meta.url);
const { JSDOM } = createRequire(require.resolve("jest-environment-jsdom"))("jsdom");

function preview(options, siteRoot) {
  const html = renderDeploymentOverlay(options);
  const meta = siteRoot ? `<meta name="study-app-site-root" content="${siteRoot}">` : "";
  const dom = new JSDOM(`<!doctype html><html><head>${meta}</head><body>${html}</body></html>`);
  const script = dom.window.document.querySelector("script").textContent;
  const destinations = [];
  return {
    document: dom.window.document,
    destinations,
    run(fetch = () => { throw new Error("Unexpected network request"); }) {
      runInNewContext(script, {
        document: dom.window.document,
        window: { location: { protocol: "https:", assign: (url) => destinations.push(url) } },
        URL,
        fetch,
      });
    },
  };
}

test("extracts the shared overlay without the preview page and displays the embedded version", () => {
  const page = preview({ version: "1.4.0", branch: 'feature/a&"b' });
  page.run();
  assert.equal(page.document.querySelector(".deployment-version").textContent, "v1.4.0");
  assert.equal(page.document.querySelector("select").value, 'feature/a&"b');
  assert.equal(page.document.querySelector("main"), null);
});

test("a nested preview loads the root branch list and navigates to the selected version", async () => {
  const page = preview({ version: "1.4.0-preview.sha123", branch: "feat/a" }, "https://example.github.io/app/");
  let requested;
  page.run(async (url) => {
    requested = url.href;
    return { ok: true, json: async () => ({ branches: [
      { name: "main", path: "", published: true },
      { name: "feat/a", path: "feat/a/", published: true },
      { name: "pending", path: "pending/", published: false },
    ] }) };
  });
  await new Promise(setImmediate);
  assert.equal(requested, "https://example.github.io/app/branches.json");
  const selector = page.document.querySelector("select");
  assert.equal(selector.querySelector('option[value="pending"]').disabled, true);
  selector.value = "main";
  selector.dispatchEvent(new page.document.defaultView.Event("change"));
  assert.deepEqual(page.destinations, ["https://example.github.io/app/index.html"]);
});

test("a root placeholder displays unpublished and retains embedded navigation when offline", async () => {
  const page = preview({ version: "unpublished", branch: "main", branches: [
    { name: "main", path: "", published: true },
    { name: "feat/a", path: "feat/a/", published: true },
  ] }, "https://example.github.io/app/");
  page.run(async () => { throw new Error("Offline"); });
  await new Promise(setImmediate);
  assert.equal(page.document.querySelector(".deployment-version").textContent, "Unpublished");
  const selector = page.document.querySelector("select");
  selector.value = "feat/a";
  selector.dispatchEvent(new page.document.defaultView.Event("change"));
  assert.deepEqual(page.destinations, ["https://example.github.io/app/feat/a/index.html"]);
});
