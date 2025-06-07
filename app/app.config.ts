export default defineAppConfig({
    ui: {
        colors: {
            primary: "green",
            neutral: "zinc",
        },
    },
    uiPro: {
        dashboardPanel: {
            slots: {
                body: "flex flex-col gap-4 sm:gap-6 flex-1 overflow-y-auto p-8 sm:p-1",
                handle: "",
            },
            variants: {
                size: {
                    true: {
                        root: "w-full lg:w-(--width)",
                    },
                    false: {
                        root: "flex-1",
                    },
                },
            },
        },
    },
});
