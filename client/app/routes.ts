import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
    index("./landing.tsx"),

    layout("./layout/authenticated.tsx", [
        route("job/search", "./pages/job-search.tsx"),
        route("saved/jobs", "./pages/saved-jobs.tsx")
    ])
] satisfies RouteConfig;
