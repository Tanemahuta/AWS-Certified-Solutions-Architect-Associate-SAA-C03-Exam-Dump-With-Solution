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

Dependabot pull requests (patch/minor, and major for direct development dependencies) and pull requests by the
repository owner are approved and auto-merged by the [pull request automation](../.github/workflows/pr.yaml).
