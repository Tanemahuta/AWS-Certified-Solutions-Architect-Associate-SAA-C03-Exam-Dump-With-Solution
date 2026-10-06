# Study App

A single-file React web app for studying a curated SAA-C03 question bank. The builder recalculates
the database's content hash and embeds the complete database into the app.

[Open the hosted study app on GitHub Pages](https://tanemahuta.github.io/AWS-Certified-Solutions-Architect-Associate-SAA-C03-Exam-Dump-With-Solution/),
with a version selector for main and published branch previews.

Download the ready-to-use app as `index.html` from the [latest release](https://github.com/Tanemahuta/AWS-Certified-Solutions-Architect-Associate-SAA-C03-Exam-Dump-With-Solution/releases/latest)
([direct download](https://github.com/Tanemahuta/AWS-Certified-Solutions-Architect-Associate-SAA-C03-Exam-Dump-With-Solution/releases/latest/download/index.html)) and open it in a browser. Answer statistics and quiz sessions are
stored only in the browser's local storage. Nothing leaves your machine.

## Development

All commands run from this folder:

| Command               | Description                                                                         |
|-----------------------|-------------------------------------------------------------------------------------|
| `pnpm install`        | Install dependencies                                                                |
| `pnpm run generate`   | Refresh the database hash and generate the embedded module                         |
| `pnpm run build`      | Refresh the database hash, then bundle a self-contained `dist/index.html`        |
| `pnpm run dev`        | Start the Vite dev server                                                           |
| `pnpm run lint`       | Run ESLint                                                                          |
| `pnpm run typecheck`  | Type-check the web app                                                  |
| `pnpm test`           | Run JSON builder/content checks and web app tests with React Testing Library    |
| `pnpm run verify`     | Lint, type-check and test                                                           |
| `pnpm run audit`      | Scan dependencies for known vulnerabilities                                         |
| `pnpm run licenses`   | Reject dependencies with forbidden or unknown licenses (`-- --report` for a CSV)    |

`webapp/data/database.json` is the sole tracked, authoritative question bank. Edit its questions,
answers, explanations, paragraph formatting, and language-labelled code blocks directly.
Before bundling, the builder recomputes SHA-512 from its question data (excluding the hash field itself),
updates the stored hash, and compresses the complete database into the single-page app.
Stored hashes are never trusted or reused; you may leave the hash blank when editing.

Only `webapp/src/generated/`, build output, and coverage reports are ignored by Git.
Build, development, typecheck, and test commands regenerate the embedded module automatically on a fresh checkout.
Keep multiline code inside `<code>` markers.
The renderer supports `<p>`, `<br/>`, and `<code>` while displaying other HTML as inert text.
Code blocks use the bundled Highlight.js dependency and theme. Set a language explicitly with
`<code class="language-json">` (also supported: YAML, JavaScript, Bash, SQL, and plaintext).
Unlabelled blocks use automatic detection; unsupported explicit languages use plaintext.
Highlighting preserves code and newlines, and requires no external scripts or stylesheets.

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
If the root `index.html` has not been published yet, the publisher creates a placeholder with the branch
dropdown and the message "no published main version, yet." A successful main publication replaces it.

The upper-right toolbar displays the embedded version and a branch dropdown. Its branch list is loaded from
the site's root `branches.json`, including from nested previews. Active branches without a successful published
build are shown as pending. Downloaded release HTML remains self-contained and does not need the branch list.
Repository branches and their PRs publish previews, including Dependabot branches; fork PRs and merge queue
runs remain check-only. CodeQL and dependency quality do not publish duplicate previews.
The rounded selector box is a translucent overlay that becomes opaque on hover or keyboard focus.
Open [`webapp/deployment-overlay.html`](webapp/deployment-overlay.html) directly in a browser to preview it.
The Vite builder and root placeholder extract the marked overlay fragment from that same HTML file;
the surrounding preview content is not included in the published app.

Enable GitHub Pages with **Settings → Pages → Build and deployment → Source → GitHub Actions** before the
first publication. The publishing workflow and action must be merged into the default branch for
[`workflow_run` and deletion events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)
to use them. A manual publish run rebuilds and publishes the selected branch; use `main` for the root page.

`pnpm run test:deployment` checks version calculation and publication/cleanup using temporary repositories
and directories. CI runs these tests alongside the existing Jest suite.

## Dependency security

`pnpm run audit` audits all dependencies without advisory exceptions. The workspace
overrides `source-map-js` to 1.2.2 for [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q).
NYC's YAML loader uses js-yaml 4.3.2, removing the argparse 1 / sprintf-js chain affected by
[GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c).

For [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), `braces` is replaced with the
API-compatible [`@dieub/braces-depth-guard`](https://github.com/dieub/braces-depth-guard) fork, pinned to
3.0.3-pn.0. Its runtime changes backport the nesting guards from upstream micromatch/braces#72 and preserve
the original MIT license. No local patches or audit suppressions are needed.
`pnpm run test:security` checks depth rejection and ordinary glob behavior through all direct consumers,
plus the NYC YAML replacement. CI runs these alongside the existing tests.

Dependabot pull requests (patch/minor, and major for direct development dependencies) and pull requests by the
repository owner are approved and auto-merged by the [pull request automation](../.github/workflows/pr.yaml).
That same workflow opens missing pull requests for all repository source branches on branch pushes,
hourly, and when manually dispatched. It skips the default branch, `gh-pages`, branches with any open PR
(including drafts), and branches with no commits ahead of the default branch. Closed unmerged PRs do not
prevent a new PR from being opened. The existing `AUTO_RELEASE_TOKEN` must have contents read and pull
requests write permissions; using it allows PR checks and approval automation to run without an approval prompt.
