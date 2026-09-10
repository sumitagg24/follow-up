import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // run tests from src only — ignore stale compiled output in dist/
    exclude: ["**/node_modules/**", "**/dist/**"],
  },
});
