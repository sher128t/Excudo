import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/_index.tsx"),
    route("api/chat", "routes/api.chat.ts"),
    route("auth/login", "routes/auth.login.tsx"),
    route("auth/signup", "routes/auth.signup.tsx"),
    route("auth/callback", "routes/auth.callback.tsx"),
    route("landing", "routes/landing.tsx"),
] satisfies RouteConfig;

