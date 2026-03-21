# Release Workflow

## Preconditions

- Work from the `main` branch.
- Use Node.js 22 or newer.
- Ensure the workspace is clean enough to understand what will be released.
- Install dependencies with `npm install`.

## Verify Before Versioning

Run the main verification commands before cutting a release:

```bash
npm run build
npm test
npm run build:examples
```

If those npm wrappers fail on Windows before the underlying command starts and the error comes from Git Bash, check `npm config get script-shell`. A Git Bash `script-shell` can fail with Bash signal-pipe or `CreateFileMapping ... error 5` messages in this environment. Use PowerShell or `cmd.exe` as the npm script shell, or fall back to the direct `.cmd` commands (`./node_modules/.bin/tsc.cmd -b`, direct `vite.cmd build` runs in the example workspaces, and direct `vitest.cmd bench ...`) before treating the repo scripts themselves as broken.

If the release changes core pipeline behavior or intentionally affects performance-sensitive paths, also run the local pipeline benchmark harness, which currently covers flat pipeline, faceting, and grouped-row hotspots:

```bash
npm run bench:core
```

## Create Release Notes and Version Intent

For any user-facing package change, create a changeset:

```bash
npm run changeset
```

This writes a markdown file under `.changeset/` describing the release impact.

## Apply Version Updates

When the pending changesets are ready to turn into package versions:

```bash
npm run release:version
```

This updates package versions and changelog data produced by Changesets.

## Publish

Publish from the workspace root:

```bash
npm run release:publish
```

`release:publish` runs the root build first, then publishes through Changesets. Package manifests are already configured for public npm publication.

## Notes

- `.changeset/config.json` uses `main` as the base branch.
- Internal dependency updates are configured with `updateInternalDependencies: "patch"`.
- `changeset status` expects normal commit history on `main`.
- `.github/workflows/release.yml` is tag-driven on `v*`; it is intended to run after npm publish, not instead of npm publish.
- `scripts/release/prepare-github-packages.mjs` builds temporary owner-scoped mirror manifests under `.github-packages/` for the GitHub Packages publish step.
- The root `package.json` declares the repository's Node.js tooling floor.
- Published package manifests intentionally omit package-level `engines` metadata until consumer runtime support is defined separately from repo tooling.
- Vitest benchmark mode is currently experimental, so keep the Vitest version pinned when comparing benchmark output across releases.
