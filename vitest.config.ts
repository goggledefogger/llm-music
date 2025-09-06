import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Global test configuration
    globals: true,
    // Ensure tests run non-interactively
    watch: false,
    // Pass with no tests
    passWithNoTests: true,
  },
})
