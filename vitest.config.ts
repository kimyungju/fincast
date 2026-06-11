import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Pure helper unit tests only — not the Convex runtime functions.
    include: ["convex/lib/**/*.test.ts"],
    environment: "node",
  },
});
