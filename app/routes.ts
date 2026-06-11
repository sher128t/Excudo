import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/_index.tsx"),  // Index redirects based on auth state
    route("dashboard", "routes/dashboard.tsx"),  // Dashboard route
    route("projects", "routes/projects.tsx"),  // All projects page
    route("editor", "routes/editor.tsx"),  // Editor/workspace route
    route("api/chat", "routes/api.chat.ts"),
    route("api/generate-title", "routes/api.generate-title.ts"),
    route("api/deploy", "routes/api.deploy.ts"),
    route("auth/login", "routes/auth.login.tsx"),
    route("auth/signup", "routes/auth.signup.tsx"),
    route("auth/callback", "routes/auth.callback.tsx"),
    route("landing", "routes/landing.tsx"),
    route("pricing", "routes/pricing.tsx"),
] satisfies RouteConfig;

