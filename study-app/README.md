# Study App

A TypeScript CLI that extracts questions and choices from the PDF in the repository root, matches the correct answer
and explanation from the solution text, and a single-file React web app to study the resulting question database.

Download the ready-to-use app as `index.html` from the [latest release](https://github.com/Iamrushabhshahh/AWS-Certified-Solutions-Architect-Associate-SAA-C03-Exam-Dump-With-Solution/releases/latest)
([direct download](https://github.com/Iamrushabhshahh/AWS-Certified-Solutions-Architect-Associate-SAA-C03-Exam-Dump-With-Solution/releases/latest/download/index.html)) and open it in a browser. Answer statistics and quiz sessions are
stored only in the browser's local storage. Nothing leaves your machine.

## Development

All commands run from this folder:

| Command               | Description                                                                         |
|-----------------------|-------------------------------------------------------------------------------------|
| `pnpm install`        | Install dependencies                                                                |
| `pnpm run create-db`  | Parse `../*.pdf` and `../*.txt` into `webapp/data/problems.json`                    |
| `pnpm run build`      | `create-db`, then bundle the web app into a self-contained `dist/index.html`        |
| `pnpm run dev`        | Start the Vite dev server                                                           |
| `pnpm run lint`       | Run ESLint                                                                          |
| `pnpm run typecheck`  | Type-check the CLI and the web app                                                  |
| `pnpm test`           | Run the Jest tests (`cli` in node, `webapp` in jsdom with React Testing Library)    |
| `pnpm run verify`     | Lint, type-check and test                                                           |
| `pnpm run audit`      | Scan dependencies for known vulnerabilities                                         |
| `pnpm run licenses`   | Reject dependencies with forbidden or unknown licenses (`-- --report` for a CSV)    |

The CLI runs directly from the TypeScript sources via `ts-node`:

```sh
pnpm run cli -- list
pnpm run cli -- show 1
pnpm run cli -- create-db --pdf questions.pdf --solutions solutions.txt --output webapp/data/problems.json
```

## CI and releases

The GitHub Actions workflows are split into reusable `*-callable.yml` workflows:

- [verify](../.github/workflows/verify.yml): ESLint, type check, Jest with coverage and the web app build.
- [dependency quality](../.github/workflows/quality.yml): `pnpm audit` and the dependency license check.
- [CodeQL](../.github/workflows/codeql.yml): code scanning for JavaScript/TypeScript and GitHub Actions.

They run on pull requests, in the merge queue and on pushes to any branch other than `main`. A branch push is skipped
while the branch has an open pull request, because the pull request run already covers it. Quality and CodeQL also
run weekly.

On every push to `main`, the [release](../.github/workflows/release.yml) workflow runs all checks.
[semantic-release](https://semantic-release.gitbook.io/) then calculates the next version from
[Conventional Commits](https://www.conventionalcommits.org/) (`fix:` → patch, `feat:` → minor,
`feat!:`/`BREAKING CHANGE:` → major). It creates the `v<version>` GitHub release with the built `index.html` attached.

The shared [build workflow](../.github/workflows/build-callable.yml) embeds the version calculated with
semantic-release's configured commit analyzer. `main` uses the next release version, or the latest reachable
release version when there are no release changes. Branch builds append `-preview.sha<short-commit>`.
This calculation works with read-only credentials and does not create tags or releases.

The [publish workflow](../.github/workflows/publish.yml) runs after successful verify or release workflows.
It downloads that run's build before invoking the [publish action](../.github/actions/publish-study-app/action.yaml).
The action supports a `subdirectory` input: `main` is published to `/index.html`, while a branch such as
`feat/previews` is published to `/feat/previews/index.html`, relative to the GitHub Pages site root.
Root publication preserves active branch previews. Branch deletion removes **all** orphan preview directories;
the same cleanup also runs on every publication. Publication is queued to prevent concurrent changes from
overwriting each other, and a stale build cannot replace a newer branch HEAD. The `gh-pages` branch stores
the complete site and is excluded from source CI.

The upper-right toolbar displays the embedded version and a branch dropdown. Its branch list is loaded from
the site's root `branches.json`, including from nested previews. Active branches without a successful published
build are shown as pending. Downloaded release HTML remains self-contained and does not need the branch list.
Repository branches and their PRs publish previews, including Dependabot branches; fork PRs and merge queue
runs remain check-only. CodeQL and dependency quality do not publish duplicate previews.

Enable GitHub Pages with **Settings → Pages → Build and deployment → Source → GitHub Actions** before the
first publication. The publishing workflow and action must be merged into the default branch for
[`workflow_run` and deletion events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)
to use them. A manual publish run rebuilds and publishes the selected branch; use `main` for the root page.

`pnpm run test:deployment` checks version calculation and publication/cleanup using temporary repositories
and directories. CI runs these tests alongside the existing Jest suite.

## Dependency security patches

`pnpm run audit` tests the installed dependency mitigations before running the registry audit. The workspace
overrides `source-map-js` to 1.2.2 for [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q).
NYC's YAML loader uses js-yaml 4.3.2, removing the argparse 1 / sprintf-js chain affected by
[GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c).

[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) has no upstream braces fix.
The committed pnpm patch rejects nesting deeper than 128 levels before parsing or recursively walking an
AST. It also checks caller-supplied ASTs and cycles for compile, expand, and stringify. Regression tests exercise
the patched dependency through each direct consumer and verify ordinary expansion and matching.
Only this locally mitigated advisory is exempted from the registry audit, which cannot inspect patches;
the exemption is guarded by these tests. Remove both the patch and exemption when upstream publishes a fix.

Dependabot pull requests (patch/minor, and major for direct development dependencies) and pull requests by the
repository owner are approved and auto-merged by the [pull request automation](../.github/workflows/pr.yaml).
