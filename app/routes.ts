import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [index("routes/home.tsx"), route("tidslinje", "routes/tidslinje.tsx")] satisfies RouteConfig;
