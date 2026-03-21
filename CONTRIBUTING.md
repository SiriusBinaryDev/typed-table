# Contributing

## Development Setup

Use Node.js 22 or newer for local development, testing, and releases.

1. Install dependencies:

```bash
npm install
```

2. Verify the workspace builds:

```bash
npm run build
```

3. Run tests:

```bash
npm test
```

4. Build the example apps when example-facing behavior changes:

```bash
npm run build:examples
```

## Development Workflow

- Keep `packages/core` framework-agnostic and side-effect free.
- Put data-source composition in `packages/adapters`.
- Keep React state, effects, and context inside `packages/react`.
- Keep examples consuming the public React package API rather than duplicating engine logic.
- Treat the root Node.js floor as a workspace tooling requirement; do not add package-level engines fields unless package runtime support is being defined explicitly.
- Run `npm run bench:core` when changing core pipeline behavior and compare results against the current local baseline before treating a performance-sensitive change as complete. The current harness covers the flat local pipeline plus local faceting and grouped-row hotspots.
- Update documentation when public APIs, examples, or workflows change.

## Common Commands

- `npm run build`
- `npm run typecheck`
- `npm test`
- `npm run bench:core`
- `npm run build:examples`
- `npm run dev:basic`
- `npm run dev:filter-selection`
- `npm run dev:remote`
- `npm run dev:infinite-scroll`

## Windows npm Shell Note

If `npm config get script-shell` points at Git Bash on Windows, `npm run build`, `npm run build:examples`, and `npm run bench:core` can fail before the workspace command starts with a Bash signal-pipe or `CreateFileMapping ... error 5` message. In that case the workspace scripts are fine; npm is failing while launching the configured shell.

Use one of these approaches in that environment:

- Reconfigure npm's `script-shell` to PowerShell or `cmd.exe`.
- Run the direct commands instead of the npm wrappers:
  - `./node_modules/.bin/tsc.cmd -b`
  - `./node_modules/.bin/vitest.cmd bench --config vitest.config.ts --environment node packages/core/test/pipeline.bench.ts`
  - Run `vite.cmd build` inside each example workspace when you need example builds.

## Changesets

Create a changeset for user-facing package changes:

```bash
npm run changeset
```

Use a changeset when changing package behavior, public types, exports, or docs/examples that should be called out in a release. Skip it for purely local maintenance that should not produce a package release.

## Pull Request Checklist

- Keep changes scoped to the task.
- Preserve the package dependency direction.
- Add or update tests when runtime behavior changes.
- Add or update examples when public API usage changes.
- Keep README and `docs/` aligned with the committed code.

## Release Overview

The repository uses Changesets for versioning and npm publication. See `docs/release.md` for the release sequence and pre-release checks.
