// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    app: {
        rootAttrs: {
            "data-vaul-drawer-wrapper": "",
            class: "bg-(--ui-bg)",
        },
        pageTransition: { name: 'page', mode: 'out-in' },
        layoutTransition: { name: 'layout', mode: 'out-in' }
    },
    runtimeConfig: {
        // Private keys are only available on the server
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,

        // Public keys that are exposed to the client
        public: {
            apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api',
        },
    },
    modules: [
        "@nuxt/eslint",
        "@nuxt/ui",
        "@vueuse/nuxt",
        "@nuxtjs/supabase",
        "@pinia/nuxt",
    ],

    devtools: {
        enabled: true,
    },

    css: ["~/assets/css/main.css"],

    build: {
        transpile: ['@nuxtjs/supabase'],
    },

    routeRules: {
        "/api/**": {
            cors: true,
        },
    },

    future: {
        compatibilityVersion: 4,
    },

    compatibilityDate: "2024-07-11",

    eslint: {
        config: {
            stylistic: {
                commaDangle: "never",
                braceStyle: "1tbs",
            },
        },
    },
    nitro: {
        externals: {
            inline: ["@supabase/supabase-js"]
        }
    },
    supabase: {
        redirectOptions: {
            login: "/auth",
            callback: "/",
            include: undefined,
            exclude: [],
            saveRedirectToCookie: false,
        },
    },
});