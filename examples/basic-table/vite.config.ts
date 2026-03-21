import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function resolveWorkspaceEntry(relativePath: string): string {
  const pathname = new URL(relativePath, import.meta.url).pathname;

  return /^\/[A-Za-z]:/.test(pathname) ? pathname.slice(1) : pathname;
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@typed-table/core": resolveWorkspaceEntry("../../packages/core/src/index.ts"),
      "@typed-table/adapters": resolveWorkspaceEntry("../../packages/adapters/src/index.ts"),
      "@typed-table/react": resolveWorkspaceEntry("../../packages/react/src/index.ts"),
    },
  },
});
