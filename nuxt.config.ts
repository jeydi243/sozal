// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  extends: [process.env.NUXT_UI_PRO_PATH || "@nuxt/ui-pro"],

  modules: [
    "@nuxt/eslint",
    "@nuxt/ui",
    "@nuxt/fonts",
    "@vueuse/nuxt",
    "@nuxtjs/supabase",
  ],
  supabase: {
    url: process.env.SUPABASE_URL,
    redirectOptions: {
      login: "/auth",
      callback: "/",
      include: undefined,
      exclude: [],
      cookieRedirect: false,
    },
  },
  runtimeConfig: {
    public: {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_KEY: process.env.SUPABASE_KEY,
    },
  },
  ui: {
    icons: ["heroicons", "simple-icons"],
    safelistColors: ["primary", "red", "orange", "green"],
  },
  devServer: { port: 9000 },
  colorMode: {
    disableTransition: true,
  },

  routeRules: {
    "/": { prerender: true },
  },

  devtools: {
    enabled: true,
  },

  typescript: {
    strict: false,
  },

  future: {
    compatibilityVersion: 4,
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: "never",
        braceStyle: "1tbs",
      },
    },
  },

  compatibilityDate: "2025-02-21",
});
