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
                slug: "/industry",
                items: [
                    {
                        title: "Front End",
                        slug: "/delphix-front-end"
                    },
                    {
                        title: "Cloud",
                        slug: "/delphix-cloud"
                    },
                    {
                        title: "Back End",
                        slug: "/delphix-back-end"
                    },
                    {
                        title: "Infrastructure",
                        slug: "/delphix-infrastructure"
                    }
                ]
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
                        title: "Radio Archive",
                        slug: "/radio-archive"
                    }
                ]
            }
        ]
    };
};