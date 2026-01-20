import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: [path.resolve(__dirname, "src/tests/setup.ts")]
  },
  resolve: {
    alias: {
      "@/": `${path.resolve(__dirname, "src")}/`,
      "@": path.resolve(__dirname, "src")
    }
  }
});
