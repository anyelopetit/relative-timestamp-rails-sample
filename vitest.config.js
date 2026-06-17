import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    restoreMocks: true
  },
  resolve: {
    alias: {
      "@hotwired/stimulus": new URL("./node_modules/@hotwired/stimulus/dist/stimulus.js", import.meta.url).pathname
    }
  }
})
