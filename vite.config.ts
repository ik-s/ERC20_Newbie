import { defineConfig } from "vitest/config";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [nodePolyfills({ protocolImports: true })],
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
    sourcemap: true,
    chunkSizeWarningLimit: 800,
  },
  server: {
    port: 3000,
  },
  test: {
    environment: "happy-dom",
    include: ["tests/**/*.test.ts"],
  },
});
