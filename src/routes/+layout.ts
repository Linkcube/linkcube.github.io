import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = () => {
    return {
        groups: [
            {
                title: "Home",
                slug: "/",
                items: []
            },
            {
                title: "Professional Experience",
                slug: "/professional-experience",
                items: []
            },
            {
                title: "Projects",
                slug: "/projects",
                items: [
                    {
                        title: "Shizu Assistance",
                        slug: "/shizu-assistance"
                    },
                    {
                        title: "Scanlation Harmonia",
                        slug: "/scanlation-harmonia"
                    },
                    {
                        title: "Svelte Components",
                        slug: "/svelte-components"
                    },
                    {
                        title: "Radio Archiver",
                        slug: "/radio-archiver"
                    },
                    {
                        title: "Old Python Projects",
                        slug: "/old-python-projects"
                    }
                ]
            },
            {
                title: "Past Performances",
                slug: "/performances",
                items: []
            }
        ]
    };
};