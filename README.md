# typed-table

Headless, strongly typed table state engine for React and TypeScript.

## Overview

- `typed-table` provides table logic, state, and data-flow primitives without shipping UI components.
- The library is intended for developers who want reusable table architecture with strong TypeScript typing and React integration.
- The current scaffold covers local and remote table workflows through separate packages.

## Features

- Framework-agnostic core package for:
  - column definitions
  - table state
  - row and header models
  - filtering, faceted filter-value metadata, multi-column sorting, pagination, grouping, row expansion, column visibility, column ordering, row ordering, column pinning, and column sizing state
  - pure state transition helpers and grouped-row metadata for local tables
- React package for:
  - `useTable`
  - `TableProvider`
  - `useTableContext`
  - re-exported `column`, `createColumns`, and `createColumnFactory`
- Adapter package for:
  - local data mode
  - remote query mode with replace-or-append loading handled by the React hook
- Example apps for:
  - local basic table rendering with manual row ordering, grouping, expandable grouped rows, column visibility controls, and host-rendered sizing controls
  - focused filtering and row selection workflows
  - remote pagination, sorting, and optional dataset-level row selection
  - append-oriented remote loading through a dedicated infinite-scroll demo

## Architecture

- `packages/core`
  - framework-agnostic table engine
  - owns types, state model, row/header builders, and pure pipeline functions
- `packages/adapters`
  - composes the core engine into local and remote data workflows
- `packages/react`
  - connects the engine to React state, async effects, and context distribution
- `examples/*`
  - consumer-facing usage examples built on top of the React package

Dependency direction:

- `core` -> no React dependency
- `adapters` -> `core`
- `react` -> `core`, `adapters`
- `examples` -> `react`

## Tech Stack

- Language: TypeScript
- Framework: React
- Example tooling: Vite
- Testing: Vitest, Testing Library, jsdom
- Package management: npm workspaces
- Module format: ESM
- Database: None

## Project Structure

- `packages/core/src/`
  - table types, column helpers, state, pipeline functions, row-model builders, and pure actions
- `packages/react/src/`
  - React hook, context, provider, and package exports
- `packages/adapters/src/`
  - local and remote adapter implementations
- `examples/basic-table/`
  - local table example app
- `examples/filter-row-selection/`
  - focused filtering and row selection example app
- `examples/remote-pagination/`
  - remote query example app
- `examples/infinite-scroll/`
  - remote append-loading example app
- `docs/packages.md`
  - package-level API guide with examples for `core`, `react`, and `adapters`
- `docs/release.md`
  - release checklist and Changesets workflow
- `docs/virtualization.md`
  - guidance for row/column virtualization patterns with minimal React helpers and host-owned DOM windowing
- `CONTRIBUTING.md`
  - setup, workflow expectations, and pull request checklist

## Package APIs

Use `@typed-table/react` when building a React table UI. Its main exports are `useTable`, `TableProvider`, `useTableContext`, `column`, `createColumns`, `createColumnFactory`, `exportTableToCsv`, `partitionHeadersByPin`, `partitionRowCellsByPin`, and `getVirtualTableLayout` for strongly typed custom column callbacks, accessor columns with arbitrary string ids, headless CSV export of the current visible table model, and minimal virtualization-friendly layout derivation. The hook exposes partial controlled-state ownership through `state` and `onStateChange`, local faceting through `getFacetedUniqueValues(columnId)` and `getFacetedMinMaxValues(columnId)`, headless grouping and expansion state through `grouping`, `rowExpansion`, `toggleGrouping`, and `toggleRowExpanded`, grouped-row metadata on `table.rows`, headless column layout state through `columnOrder`, `rowOrder`, `columnPinning`, `columnSizing`, `setColumnOrder`, `moveColumn`, `setRowOrder`, `moveRow`, `setColumnPinning`, `setColumnSize`, `resizeColumn`, and `clearColumnSizing`, plus header/cell sizing metadata for host-rendered layouts, and opt-in append-oriented remote loading through `remoteLoading: { mode: "append" }`. Grouping, grouped-row expansion, faceted metadata, and row ordering are currently local-table features.

Use `@typed-table/core` when you need the framework-agnostic engine. Its main exports are the column helpers, `createColumnFactory`, the table state factory, controlled-state and faceting types, pipeline functions such as `getFacetedUniqueValues(...)`, `getFacetedMinMaxValues(...)`, and `applyRowOrder(...)`, grouped and flat row-model builders, `exportTableToCsv(...)` for headless CSV serialization of visible headers and rows, and pure state actions for sorting, grouping, expansion, visibility, row ordering, sizing, and layout.

Use `@typed-table/adapters` when you want composed local or remote table models without using the React hook. Its main exports are `createLocalAdapter` and `createRemoteAdapter`, and the local adapter now honors explicit row ordering before later local sorting or grouping.

The repository requires Node.js 22 or newer for development and release automation. Published package manifests intentionally do not declare a separate consumer Node engine range yet, because the packages target browser and bundler runtimes rather than direct Node execution.

See [docs/packages.md](./docs/packages.md) for package-by-package examples, including local grouping with expandable grouped rows, local faceted filter metadata through `getFacetedUniqueValues(columnId)` and `getFacetedMinMaxValues(columnId)`, column ordering, row ordering, pinning, sizing, the minimal virtualization helpers, append-oriented remote loading for infinite scroll, the manual pattern for clearing hidden-column filters and sorting, and the optional remote include/exclude row-selection workflow with opt-in automatic query-scope resets. See [docs/virtualization.md](./docs/virtualization.md) for the current row/column virtualization guidance and the minimal React helper boundary.

## Getting Started

### Prerequisites

- Node.js 22 or newer
- npm

### Install Dependencies

Use Node.js 22 or newer for all workspace commands below.

```bash
npm install
```

### Build the Workspace

```bash
npm run build
```

### Run the Basic Example

```bash
npm run dev:basic
```

### Run the Filtering and Row Selection Example

```bash
npm run dev:filter-selection
```

### Run the Remote Pagination Example

```bash
npm run dev:remote
```

### Run the Infinite Scroll Example

```bash
npm run dev:infinite-scroll
```

### Build the Example Apps

```bash
npm run build:examples
```

### Run Tests

```bash
npm test
```

### Run Core Benchmarks

```bash
npm run bench:core
```

Vitest benchmark mode is experimental in the current toolchain, so keep the Vitest version pinned when comparing benchmark output over time. The current core harness covers flat local pipeline, faceting, and grouped-row hotspots.

## Development

- Keep `packages/core` framework-agnostic.
- Prefer pure functions and serializable state transitions in the core package.
- Finalize typed column definitions with `createColumns<TData>([column(...)])`.
- Use ESM imports and type-only exports/imports where appropriate.
- Keep adapters focused on data-source composition, not UI concerns.
- Keep React-specific state and side effects inside `packages/react`.
- See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup and contribution workflow details.

## Release Workflow

- The repository uses Changesets for versioning and npm publication.
- Verify the workspace before a release:

```bash
npm run build
npm test
npm run build:examples
```

- Create a changeset for user-facing package changes:

```bash
npm run changeset
```

- Apply pending version updates:

```bash
npm run release:version
```

- Publish the packages:

```bash
npm run release:publish
```

- See [docs/release.md](./docs/release.md) for the full release sequence and pre-release checks.

## Roadmap

- Consider lower-priority features only after higher-value table-state work is settled.
- Keep the React virtualization helper surface minimal and virtualizer-agnostic; only expand it if repeated host integration pain justifies more public API surface.
- Explore server-backed grouping or faceting only after a concrete remote API shape exists.

## Contributing

- Follow [CONTRIBUTING.md](./CONTRIBUTING.md) for setup, workflow expectations, and pull request checks.
- Keep documentation aligned with committed code.
- Preserve the package dependency direction.
- Add or update examples when public API behavior changes.

























