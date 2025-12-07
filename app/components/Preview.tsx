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
            // Check if package.json exists (indicates npm project)
            let hasPackageJson = false;
            try {
                await webcontainer.fs.readFile("package.json", "utf-8");
                hasPackageJson = true;
            } catch {
                hasPackageJson = false;
            }

            if (hasPackageJson) {
                // It's a React/Vite/npm project - need to install and run dev server
                setStatus("Installing dependencies...");
                await runCommand("npm", ["install"]);
                setStatus("Starting dev server...");
                // Use npx vite directly since package.json might not have scripts
                runCommand("npx", ["vite"]);
            } else {
                // Simple static files - use serve
                setStatus("Starting static server...");
                await runCommand("npx", ["-y", "serve", "."]);
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

