# Virtualization Guide

`typed-table` still does not ship a built-in virtualizer. That is intentional.

`@typed-table/react` now exposes minimal virtualization helpers for pin-aware partitions and resolved width totals, but DOM-windowing concerns such as scroll position, viewport measurement, overscan, and item recycling still belong to your virtualizer.

This split keeps the repo headless:

- `@typed-table/core` owns the table model
- `@typed-table/react` owns React state and minimal layout helpers
- your virtualizer owns what actually mounts in the DOM

## What To Virtualize

Virtualize the already-resolved visible model, not the raw source data.

For rows, that means `table.rows`.

`table.rows` already reflects:

- filtering
- sorting
- pagination or remote page accumulation
- grouping and row expansion
- column visibility/order/pinning/sizing on each row's cells

For columns, virtualize `table.headers` and the matching cells from each row.

That order matters. If you virtualize the raw input array first, you will bypass grouping, expansion, filtering, or remote append behavior that the table model has already resolved for you.

## Minimal React Helpers

`@typed-table/react` now exports:

- `partitionHeadersByPin(headers)`
- `partitionRowCellsByPin(row)`
- `getVirtualTableLayout(table)`

These helpers do not choose a virtualizer or measure the DOM. They only derive:

- left / center / right header partitions
- left / center / right row-cell partitions
- total visible width plus left / center / right region widths from resolved `header.size`

Example:

```tsx
import {
  getVirtualTableLayout,
  partitionRowCellsByPin,
  useTable,
} from "@typed-table/react";

const table = useTable<User>({
  columns,
  data,
  getRowId: (row) => row.id,
  features: {
    columnPinning: true,
    columnResizing: true,
  },
});

const layout = getVirtualTableLayout(table);
const centerVirtualColumns = columnVirtualizer.getVirtualItems();

return layout.rows.map((row) => {
  const cells = partitionRowCellsByPin(row);

  return renderRow({
    row,
    leftCells: cells.left,
    centerCells: centerVirtualColumns.map((item) => cells.center[item.index]),
    rightCells: cells.right,
  });
});
```

## Row Virtualization Pattern

At a high level, row virtualization should treat `table.rows` as the source of truth for the visible logical rows:

```tsx
const table = useTable<User>({
  columns,
  data,
  getRowId: (row) => row.id,
  features: {
    sorting: true,
    filtering: true,
    grouping: true,
    rowExpansion: true,
  },
});

const virtualRows = rowVirtualizer.getVirtualItems();

return (
  <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
    {virtualRows.map((virtualRow) => {
      const row = table.rows[virtualRow.index];

      return (
        <div
          key={row.id}
          style={{
            position: "absolute",
            top: 0,
            transform: `translateY(${virtualRow.start}px)`,
            height: virtualRow.size,
          }}
        >
          {row.type === "group"
            ? renderGroupRow(row)
            : renderDataRow(row)}
        </div>
      );
    })}
  </div>
);
```

Guidelines:

- Key virtualized rows with `row.id`, not the index.
- Read the row from `table.rows[virtualRow.index]` after sorting/filtering/grouping have already run.
- Expect grouped rows and data rows to have different heights if your UI renders them differently.
- If row expansion changes visible rows, your virtualizer should react to the new `table.rows.length`.

## Grouped Rows And Dynamic Heights

Grouped tables are the main reason the repo still does not ship a one-size-fits-all virtualizer.

When grouping is enabled:

- `table.rows` contains both `row.type === "group"` rows and normal data rows.
- expanding or collapsing a group changes the visible row count
- group rows often render different markup and height than leaf rows

That means a host virtualizer usually needs either:

- separate row-height estimates for group rows vs data rows, or
- runtime measurement if the row height is not predictable

The minimal helpers intentionally stop short of row-height policy or DOM measurement.

The important part is still simple: virtualize the flattened visible `table.rows` array, not the grouped tree.

## Column Virtualization Pattern

Column virtualization should use `table.headers` because that array already reflects:

- visibility
- explicit order
- left/right pinning metadata
- resolved sizing metadata

The current repo exposes:

- `header.pin`
- `header.size`
- `header.minSize`
- `header.maxSize`
- matching metadata on each `row.cells` entry

A practical pattern is:

1. Render left pinned columns normally.
2. Virtualize only the unpinned center region.
3. Render right pinned columns normally.

This keeps pinned columns stable while still reducing DOM work for wide tables.

## Horizontal Offsets And Widths

If you virtualize columns, use the resolved header sizes rather than re-deriving widths from your raw column definitions.

For example, the current visible width of the center region should come from `table.headers`, because sizing overrides may already have changed the column widths.

A host usually needs to derive:

- total width of all visible columns
- width of the left pinned region
- width of the center virtualized region
- width of the right pinned region
- cumulative offsets for the center headers/cells it decides to mount

`getVirtualTableLayout(table)` now gives you the first four directly from the resolved header model.

## Combined Row + Column Virtualization

If you virtualize both axes:

- row virtualization should still source from `table.rows`
- column virtualization should still source from `table.headers`
- cell rendering should use the intersection of the chosen virtual row range and visible column range

A common host pattern is:

- partition headers into left / center / right by `header.pin`
- virtualize the center headers
- for each mounted row, render pinned cells plus the virtualized center cells

The repo now provides minimal helpers for the partitioning and width totals, but the final DOM structure still depends heavily on the host renderer and scroll-container strategy.

## Remote Tables

Virtualization and remote loading solve different problems.

- virtualization reduces DOM work for rows you already have in memory
- remote loading reduces how much data you fetch from the server

They can be combined.

Examples:

- classic remote pagination: virtualize only the current server page if that page is still large enough to matter
- append mode: use `remoteLoading: { mode: "append" }` to accumulate pages, then virtualize the accumulated `table.rows`

Keep in mind:

- changing sorting, filters, or page size still changes remote query scope
- append mode is not virtualization by itself
- virtualization should stay presentation-only and should not change your query contract unless your app explicitly wants that

## Infinite Scroll Is Not Virtualization

The existing `examples/infinite-scroll` demo shows append-oriented remote loading.

That example demonstrates:

- one scrolling surface
- sequential remote page accumulation
- a sentinel-based load-more trigger

It does **not** demonstrate DOM windowing.

If the append-loaded row count becomes large, pair that same pattern with a row virtualizer so the DOM only mounts the visible slice of `table.rows`.

## When Virtualization Is Worth It

Start with normal rendering when:

- local row counts are small
- remote pagination keeps each page small
- grouped rows are few and expansion is limited

Reach for virtualization when:

- local tables have hundreds or thousands of visible rows
- append mode keeps many remote rows mounted at once
- wide tables make the center column region expensive to render
- grouped/expanded views create large visible trees

## Current Recommendation

For this repo today:

- use the minimal React helpers when they remove obvious repeated partition/width boilerplate
- keep virtualization helpers virtualizer-library agnostic
- keep row-height measurement, overscan policy, and scroll-container ownership in the host app
- expand the helper surface only if repeated host integration pain justifies more public API
