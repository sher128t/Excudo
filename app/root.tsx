import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";

export function headers() {
  return {
    "Cross-Origin-Embedder-Policy": "require-corp",
    "Cross-Origin-Opener-Policy": "same-origin",
  };
}

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export const meta: Route.MetaFunction = () => [
  { title: "Excudo - AI App Builder" },
  { name: "description", content: "Build apps with AI. Describe your idea, watch it come to life right in your browser, then publish it to the web." },
  { name: "theme-color", content: "#030308" },
  { property: "og:type", content: "website" },
  { property: "og:site_name", content: "Excudo" },
  { property: "og:title", content: "Excudo - AI App Builder" },
  { property: "og:description", content: "Build apps with AI. Describe your idea, watch it come to life right in your browser, then publish it to the web." },
  { name: "twitter:card", content: "summary_large_image" },
  { name: "twitter:title", content: "Excudo - AI App Builder" },
  { name: "twitter:description", content: "Build apps with AI. Describe your idea, watch it come to life right in your browser." },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

import { WebContainerProvider } from "./context/WebContainerContext";
import { AuthProvider } from "./context/AuthContext";
import { ProjectProvider } from "./context/ProjectContext";

export default function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <WebContainerProvider>
          <Outlet />
        </WebContainerProvider>
      </ProjectProvider>
    </AuthProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="min-h-screen bg-[#030308] text-white flex items-center justify-center p-6">
      <div className="text-center max-w-lg">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/30">
          <span className="text-2xl font-bold">!</span>
        </div>
        <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{message}</h1>
        <p className="text-gray-400 mb-8">{details}</p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-medium transition-all shadow-lg shadow-purple-500/20"
        >
          Back to home
        </a>
        {stack && (
          <pre className="w-full p-4 mt-8 overflow-x-auto text-left text-xs text-gray-500 bg-white/5 border border-white/10 rounded-xl">
            <code>{stack}</code>
          </pre>
        )}
      </div>
    </main>
  );
}
