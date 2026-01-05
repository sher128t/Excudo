import { useState } from "react";
import { useWebContainer } from "~/context/WebContainerContext";
import { Play, RefreshCw, ExternalLink, Copy, Check, Monitor, Smartphone, Tablet } from "lucide-react";

export function Preview() {
    const { serverUrl, runCommand, webcontainer } = useWebContainer();
    const [isStarting, setIsStarting] = useState(false);
    const [status, setStatus] = useState("");
    const [copied, setCopied] = useState(false);
    const [iframeKey, setIframeKey] = useState(0);

    const copyUrl = async () => {
        if (serverUrl) {
            await navigator.clipboard.writeText(serverUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const refreshIframe = () => {
        setIframeKey(prev => prev + 1);
    };

    const startServer = async () => {
        if (!webcontainer) return;

        setIsStarting(true);
        try {
            let packageJson: any = null;
            try {
                const content = await webcontainer.fs.readFile("package.json", "utf-8");
                packageJson = JSON.parse(content);
            } catch {
                packageJson = null;
            }

            if (packageJson) {
                setStatus("Installing dependencies...");
                await runCommand("npm", ["install"]);

                const scripts = packageJson.scripts || {};
                const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

                setStatus("Starting dev server...");

                if (scripts.dev) {
                    runCommand("npm", ["run", "dev"]);
                } else if (scripts.start) {
                    runCommand("npm", ["start"]);
                } else if (deps.vite || deps["@vitejs/plugin-react"]) {
                    runCommand("npx", ["vite"]);
                } else if (deps.next) {
                    runCommand("npx", ["next", "dev"]);
                } else if (deps.express || deps.fastify || deps.koa) {
                    let entryPoint = packageJson.main;

                    if (!entryPoint) {
                        const commonFiles = ["server.js", "app.js", "index.js", "main.js"];
                        for (const file of commonFiles) {
                            try {
                                await webcontainer.fs.readFile(file, "utf-8");
                                entryPoint = file;
                                break;
                            } catch {
                                // File doesn't exist
                            }
                        }
                    }

                    if (entryPoint) {
                        runCommand("node", [entryPoint]);
                    } else {
                        setStatus("Error: No entry point found");
                    }
                } else {
                    runCommand("npx", ["-y", "serve", "."]);
                }
            } else {
                setStatus("Starting static server...");
                runCommand("npx", ["-y", "serve", "."]);
            }
        } catch (err) {
            console.error("Failed to start server:", err);
            setStatus("Error starting server");
        }
    };

    return (
        <div className="flex-1 bg-[#0a0a0f] h-full flex flex-col">
            {/* Toolbar */}
            <div className="h-11 bg-[#12121a] border-b border-[#1e1e2e] flex items-center justify-between px-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {serverUrl ? (
                        <>
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-sm text-gray-400 truncate">{serverUrl}</span>
                        </>
                    ) : (
                        <span className="text-sm text-gray-500">{status || "Waiting for server..."}</span>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    {serverUrl && (
                        <>
                            <button
                                onClick={refreshIframe}
                                className="p-1.5 hover:bg-white/5 rounded transition-colors"
                                title="Refresh"
                            >
                                <RefreshCw className="w-4 h-4 text-gray-400" />
                            </button>
                            <button
                                onClick={copyUrl}
                                className="p-1.5 hover:bg-white/5 rounded transition-colors"
                                title="Copy URL"
                            >
                                {copied ? (
                                    <Check className="w-4 h-4 text-emerald-400" />
                                ) : (
                                    <Copy className="w-4 h-4 text-gray-400" />
                                )}
                            </button>
                            <a
                                href={serverUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 hover:bg-white/5 rounded transition-colors"
                                title="Open in new tab"
                            >
                                <ExternalLink className="w-4 h-4 text-gray-400" />
                            </a>
                        </>
                    )}
                    {!serverUrl && (
                        <button
                            onClick={startServer}
                            disabled={isStarting}
                            className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 rounded-lg text-xs font-medium flex items-center gap-2 transition-all"
                        >
                            {isStarting ? (
                                <>
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    <span>Starting...</span>
                                </>
                            ) : (
                                <>
                                    <Play className="w-3 h-3" />
                                    <span>Start Server</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Preview Area */}
            {serverUrl ? (
                <iframe
                    key={iframeKey}
                    src={serverUrl}
                    className="flex-1 w-full h-full border-none bg-white"
                />
            ) : (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-[#12121a] rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Monitor className="w-8 h-8 text-gray-600" />
                        </div>
                        <p className="text-gray-400 mb-1">App preview will appear here</p>
                        <p className="text-xs text-gray-600">Create some files, then click "Start Server"</p>
                    </div>
                </div>
            )}
        </div>
    );
}


