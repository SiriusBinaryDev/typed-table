import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@typed-table/core": resolve(rootDir, "packages/core/src/index.ts"),
      "@typed-table/react": resolve(rootDir, "packages/react/src/index.ts"),
      "@typed-table/adapters": resolve(rootDir, "packages/adapters/src/index.ts"),
    },
  },
  test: {
    environment: "node",
    maxWorkers: 1,
    minWorkers: 1,
    include: [
      "packages/*/test/**/*.test.ts",
      "packages/*/test/**/*.test.tsx",
    ],
  },
});
