import { execFileSync } from "node:child_process";

const allowed = new Set([
  "0BSD", "Apache-2.0", "Artistic-2.0", "BlueOak-1.0.0", "BSD-2-Clause", "BSD-3-Clause", "CC-BY-3.0", "CC-BY-4.0",
  "CC0-1.0", "ISC", "MIT", "MIT-0", "MPL-2.0", "Public Domain", "Python-2.0", "Unlicense",
]);

const isAllowed = (expression) =>
  expression
    .replace(/[()]/g, "")
    .split(/\s+OR\s+/)
    .some((license) => license.split(/\s+AND\s+/).every((part) => allowed.has(part.trim())));

const inventory = JSON.parse(execFileSync("pnpm", ["licenses", "list", "--json"], { encoding: "utf8" }));
const rows = Object.entries(inventory).flatMap(([license, packages]) =>
  packages.map((pkg) => ({ license, name: pkg.name, versions: (pkg.versions ?? [pkg.version]).join(" ") })));
const rejected = rows.filter((row) => !isAllowed(row.license));

if (process.argv.includes("--report")) {
  console.log("license,package,versions");
  rows.forEach((row) => console.log(`"${row.license}",${row.name},${row.versions}`));
}

if (rejected.length > 0) {
  console.error("Forbidden or unknown dependency licenses:");
  rejected.forEach((row) => console.error(`  ${row.name}@${row.versions}: ${row.license}`));
  process.exit(1);
}
console.error(`All ${rows.length} dependencies use allowed licenses.`);
