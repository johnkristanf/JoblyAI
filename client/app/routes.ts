import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
    index("./landing.tsx"),

    layout("./layout/authenticated.tsx", [
        route("job/search", "./pages/job_search.tsx")
    ])
] satisfies RouteConfig;
