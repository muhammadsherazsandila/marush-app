import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
  },
  define: {
    __DEV__: "true",
  },
  resolve: {
    alias: {
      "react-native": "react-native-web",
    },
  },
});
