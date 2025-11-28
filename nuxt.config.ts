// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    app: {
        rootAttrs: {
            "data-vaul-drawer-wrapper": "",
            class: "bg-(--ui-bg)",
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
