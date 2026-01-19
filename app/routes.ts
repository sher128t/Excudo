import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/_index.tsx"),  // Index redirects based on auth state
    route("dashboard", "routes/dashboard.tsx"),  // Dashboard route
    route("editor", "routes/editor.tsx"),  // Editor/workspace route
    route("api/chat", "routes/api.chat.ts"),
    route("auth/login", "routes/auth.login.tsx"),
    route("auth/signup", "routes/auth.signup.tsx"),
    route("auth/callback", "routes/auth.callback.tsx"),
    route("landing", "routes/landing.tsx"),
] satisfies RouteConfig;
