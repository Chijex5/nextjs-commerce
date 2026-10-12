import path from "node:path";
import { defineConfig } from "vitest/config";

// Mirror tsconfig's baseUrl imports ("lib/...", "components/...").
const alias = [
  {
    find: /^(lib|components|app|hooks)\//,
    replacement: `${path.resolve(__dirname)}/$1/`,
  },
  { find: /^@\//, replacement: `${path.resolve(__dirname)}/` },
];

export default defineConfig({
  resolve: { alias },
  test: {
    // Integration files share one database and per-IP rate limits.
    fileParallelism: false,
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        resolve: { alias },
        test: {
          // Drives a running app (TEST_BASE_URL) backed by a throwaway
          // Postgres (TEST_DATABASE_URL). See tests/README.md.
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          environment: "node",
          globalSetup: ["tests/setup/integration-setup.ts"],
          testTimeout: 60_000,
          hookTimeout: 120_000,
        },
      },
    ],
  },
});
