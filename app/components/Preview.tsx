import { useState } from "react";
import { useWebContainer } from "~/context/WebContainerContext";

export function Preview() {
    const { serverUrl, runCommand } = useWebContainer();
    const [isStarting, setIsStarting] = useState(false);

    const startServer = async () => {
        setIsStarting(true);
        try {
            await runCommand("npx", ["serve", "."]);
        } catch (err) {
            console.error("Failed to start server:", err);
        }
        setIsStarting(false);
    };

    return (
        <div className="flex-1 bg-white h-full flex flex-col">
            <div className="p-2 bg-gray-100 border-b border-gray-200 text-sm text-gray-600 flex items-center justify-between">
                <span className="truncate">{serverUrl || "Waiting for server..."}</span>
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
                        <p className="text-xs mt-2">Click "Start Server" or ask the AI to run a server</p>
                    </div>
                </div>
            )}
        </div>
    );
}
