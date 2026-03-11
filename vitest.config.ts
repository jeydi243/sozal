import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    // or keep happy-dom but nuxt environment is better for mountSuspended
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    hookTimeout: 30000,
    testTimeout: 30000,
    env: {
      SUPABASE_URL: 'http://localhost:54321',
      SUPABASE_KEY: 'dummy-key'
    }
  }
})
