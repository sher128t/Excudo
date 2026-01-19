import { useState, useEffect } from "react";
import { useWebContainer } from "~/context/WebContainerContext";
import { Play, RefreshCw, ExternalLink, Copy, Check, Monitor, Loader2, Package, Rocket, AlertCircle } from "lucide-react";

export function Preview() {
    const { serverUrl, serverStatus, serverStatusMessage, startDevServer, webcontainer } = useWebContainer();
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

    const getStatusIcon = () => {
        switch (serverStatus) {
            case "writing-files":
                return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
            case "installing":
                return <Package className="w-5 h-5 text-yellow-400 animate-pulse" />;
            case "starting":
                return <Rocket className="w-5 h-5 text-purple-400 animate-bounce" />;
            case "ready":
                return <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />;
            case "error":
                return <AlertCircle className="w-5 h-5 text-red-400" />;
            default:
                return <Monitor className="w-5 h-5 text-gray-500" />;
        }
    };

    const getStatusColor = () => {
        switch (serverStatus) {
            case "writing-files": return "text-blue-400";
            case "installing": return "text-yellow-400";
            case "starting": return "text-purple-400";
            case "ready": return "text-emerald-400";
            case "error": return "text-red-400";
            default: return "text-gray-500";
        }
    };

    const isWorking = ["writing-files", "installing", "starting"].includes(serverStatus);

    return (
        <div className="flex-1 bg-[#0a0a0f] h-full flex flex-col">
            {/* Toolbar */}
            <div className="h-11 bg-[#12121a] border-b border-[#1e1e2e] flex items-center justify-between px-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getStatusIcon()}
                    {serverUrl ? (
                        <span className="text-sm text-emerald-400">Preview running</span>
                    ) : (
                        <span className={`text-sm ${getStatusColor()}`}>
                            {serverStatusMessage || "Waiting for project..."}
                        </span>
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
                        </>
                    )}
                    {!serverUrl && serverStatus === "idle" && (
                        <button
                            onClick={startDevServer}
                            disabled={!webcontainer}
                            className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 rounded-lg text-xs font-medium flex items-center gap-2 transition-all"
                        >
                            <Play className="w-3 h-3" />
                            <span>Start Server</span>
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
                    <div className="text-center max-w-sm">
                        {isWorking ? (
                            <>
                                <div className="w-20 h-20 bg-[#12121a] rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    {serverStatus === "installing" ? (
                                        <Package className="w-10 h-10 text-yellow-400 animate-pulse" />
                                    ) : serverStatus === "starting" ? (
                                        <Rocket className="w-10 h-10 text-purple-400 animate-bounce" />
                                    ) : (
                                        <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                                    )}
                                </div>
                                <p className={`text-lg font-medium mb-2 ${getStatusColor()}`}>
                                    {serverStatus === "installing" ? "Installing Dependencies" :
                                        serverStatus === "starting" ? "Starting Server" :
                                            "Preparing Project"}
                                </p>
                                <p className="text-sm text-gray-500">{serverStatusMessage}</p>
                                <div className="mt-4 w-48 h-1 bg-[#1e1e2e] rounded-full mx-auto overflow-hidden">
                                    <div className={`h-full rounded-full animate-pulse ${serverStatus === "installing" ? "bg-yellow-500 w-1/2" :
                                        serverStatus === "starting" ? "bg-purple-500 w-3/4" :
                                            "bg-blue-500 w-1/4"
                                        }`} />
                                </div>
                            </>
                        ) : serverStatus === "error" ? (
                            <>
                                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <AlertCircle className="w-8 h-8 text-red-400" />
                                </div>
                                <p className="text-red-400 mb-2">Something went wrong</p>
                                <p className="text-xs text-gray-500">{serverStatusMessage}</p>
                                <button
                                    onClick={startDevServer}
                                    className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm"
                                >
                                    Try Again
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 bg-[#12121a] rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Monitor className="w-8 h-8 text-gray-600" />
                                </div>
                                <p className="text-gray-400 mb-1">App preview will appear here</p>
                                <p className="text-xs text-gray-600">Create some files, then click "Start Server"</p>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
