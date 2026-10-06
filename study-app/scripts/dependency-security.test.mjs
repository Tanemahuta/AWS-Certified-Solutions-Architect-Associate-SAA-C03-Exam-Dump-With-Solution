import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const consumers = ["semantic-release", "@semantic-release/commit-analyzer", "vite-plugin-singlefile"];

for (const consumer of consumers) {
  const consumerRequire = createRequire(require.resolve(consumer));
  const braces = createRequire(consumerRequire.resolve("micromatch"))("braces");

  test(`${consumer}: replacement braces rejects deep patterns and caller-supplied ASTs`, () => {
    // Stay below the original 10,000-character cap: this exercises the new depth guard.
    const deep = "{".repeat(4000) + "a,b" + "}".repeat(4000);
    const unmatched = "{".repeat(4000) + "a";
    const parentheses = "(".repeat(4000) + "a" + ")".repeat(4000);
    for (const pattern of [deep, unmatched, parentheses]) {
      for (const operation of [braces.parse, braces.compile, braces.expand, braces.stringify]) {
        assert.throws(() => operation(pattern), /exceeds max depth/);
      }
    }
    let ast = { type: "text", value: "a" };
    for (let i = 0; i < 10000; i++) ast = { type: "root", nodes: [ast] };
    const cycle = { type: "root", nodes: [] };
    cycle.nodes.push(cycle);
    for (const operation of [braces.compile, braces.expand, braces.stringify]) {
      for (const input of [ast, cycle]) assert.throws(() => operation(input), /exceeds max depth/);
    }
  });

  test(`${consumer}: normal brace patterns and glob matching retain their behavior`, () => {
    assert.deepEqual(braces.expand("src/{parser,model}/{a,b}.ts"), ["src/parser/a.ts", "src/parser/b.ts", "src/model/a.ts", "src/model/b.ts"]);
    assert.equal(braces.compile("{main,next}"), "(main|next)");
    const micromatch = consumerRequire("micromatch");
    assert.deepEqual(micromatch(["main", "next", "other"], "{main,next}"), ["main", "next"]);
  });
}

test("NYC reads YAML config with js-yaml 4 without the vulnerable sprintf-js dependency", () => {
  let coverageRequire = require;
  for (const dependency of ["jest", "@jest/core", "@jest/transform", "babel-plugin-istanbul"]) {
    coverageRequire = createRequire(coverageRequire.resolve(dependency));
  }
  const nycRequire = createRequire(coverageRequire.resolve("@istanbuljs/load-nyc-config"));
  const yamlRequire = createRequire(nycRequire.resolve("js-yaml"));
  assert.match(yamlRequire("./package.json").version, /^4\./);
  assert.deepEqual(nycRequire("js-yaml").load("all: true\ninclude:\n  - src/**/*.ts\n"), { all: true, include: ["src/**/*.ts"] });
  const argparseRequire = createRequire(yamlRequire.resolve("argparse"));
  const argparsePackage = argparseRequire("./package.json");
  assert.match(argparsePackage.version, /^2\./);
  assert.equal(argparsePackage.dependencies?.["sprintf-js"], undefined);
});
