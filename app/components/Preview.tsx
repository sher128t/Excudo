import { useState } from "react";
import { useWebContainer } from "~/context/WebContainerContext";

export function Preview() {
    const { serverUrl, runCommand, webcontainer } = useWebContainer();
    const [isStarting, setIsStarting] = useState(false);
    const [status, setStatus] = useState("");

    const startServer = async () => {
        if (!webcontainer) return;

        setIsStarting(true);
        try {
            // Try to read package.json to understand the project
            let packageJson: any = null;
            try {
                const content = await webcontainer.fs.readFile("package.json", "utf-8");
                packageJson = JSON.parse(content);
            } catch {
                packageJson = null;
            }

            if (packageJson) {
                // It's an npm project - install dependencies first
                setStatus("Installing dependencies...");
                await runCommand("npm", ["install"]);

                // Determine the best command to run based on scripts and dependencies
                const scripts = packageJson.scripts || {};
                const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

                setStatus("Starting dev server...");

                if (scripts.dev) {
                    // Has a dev script - use it (works for Vite, Next.js, etc.)
                    runCommand("npm", ["run", "dev"]);
                } else if (scripts.start) {
                    // Has a start script - use it (works for Create React App, Express, etc.)
                    runCommand("npm", ["start"]);
                } else if (deps.vite || deps["@vitejs/plugin-react"]) {
                    // Has Vite as dependency but no script - run directly
                    runCommand("npx", ["vite"]);
                } else if (deps.next) {
                    // Has Next.js as dependency but no script
                    runCommand("npx", ["next", "dev"]);
                } else if (deps.express || deps.fastify || deps.koa) {
                    // Backend framework - try to find and run main file
                    const main = packageJson.main || "index.js";
                    runCommand("node", [main]);
                } else {
                    // Unknown npm project - try npx serve as fallback
                    runCommand("npx", ["-y", "serve", "."]);
                }
            } else {
                // No package.json - serve static files
                setStatus("Starting static server...");
                runCommand("npx", ["-y", "serve", "."]);
            }
        } catch (err) {
            console.error("Failed to start server:", err);
            setStatus("Error starting server");
        }
    };

    return (
        <div className="flex-1 bg-white h-full flex flex-col">
            <div className="p-2 bg-gray-100 border-b border-gray-200 text-sm text-gray-600 flex items-center justify-between">
                <span className="truncate">{serverUrl || status || "Waiting for server..."}</span>
                {!serverUrl && (
                    <button
                        onClick={startServer}
                        disabled={isStarting}
                        className="ml-2 px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:opacity-50"
                    >
                        {isStarting ? "Starting..." : "Start Server"}
                    </button>
                )}
            </div>
            {serverUrl ? (
                <iframe src={serverUrl} className="flex-1 w-full h-full border-none" />
            ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                        <p>App preview will appear here</p>
                        <p className="text-xs mt-2">Create some files, then click "Start Server"</p>
                    </div>
                </div>
            )}
        </div>
    );
}

