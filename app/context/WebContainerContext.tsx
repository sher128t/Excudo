import {
    createContext,
    useContext,
    useEffect,
    useState,
    useRef,
    useCallback,
    type ReactNode,
} from "react";
import { WebContainer } from "@webcontainer/api";

export type ServerStatus = "idle" | "writing-files" | "installing" | "starting" | "ready" | "error";

interface WebContainerContextType {
    webcontainer: WebContainer | null;
    isLoading: boolean;
    error: Error | null;
    serverUrl: string | null;
    serverStatus: ServerStatus;
    serverStatusMessage: string;
    writeFile: (path: string, content: string) => Promise<void>;
    readFile: (path: string) => Promise<string>;
    runCommand: (cmd: string, args: string[]) => Promise<number>;
    registerTerminal: (writer: (data: string) => void) => void;
    loadProjectFiles: (files: Record<string, string>) => Promise<void>;
    startDevServer: () => Promise<void>;
    resetContainer: () => Promise<void>;
}

const WebContainerContext = createContext<WebContainerContextType | null>(null);

export function WebContainerProvider({ children }: { children: ReactNode }) {
    const [webcontainer, setWebcontainer] = useState<WebContainer | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [serverUrl, setServerUrl] = useState<string | null>(null);
    const [serverStatus, setServerStatus] = useState<ServerStatus>("idle");
    const [serverStatusMessage, setServerStatusMessage] = useState("");
    const booted = useRef(false);
    const terminalWriter = useRef<((data: string) => void) | null>(null);

    useEffect(() => {
        async function boot() {
            if (booted.current) return;
            booted.current = true;

            try {
                console.log("Booting WebContainer...");
                const instance = await WebContainer.boot();
                setWebcontainer(instance);
                setIsLoading(false);
                console.log("WebContainer booted successfully!");

                instance.on("server-ready", (port, url) => {
                    console.log(`Server ready at ${url}`);
                    setServerUrl(url);
                    setServerStatus("ready");
                    setServerStatusMessage("Server running");
                });
            } catch (err) {
                console.error("Failed to boot WebContainer:", err);
                setError(err instanceof Error ? err : new Error("Unknown error"));
                setIsLoading(false);
            }
        }

        boot();
    }, []);

    const writeFile = async (path: string, content: string) => {
        if (!webcontainer) throw new Error("WebContainer not booted");

        // Create parent directories if they don't exist
        const parts = path.split('/').filter(Boolean);
        if (parts.length > 1) {
            const dirPath = parts.slice(0, -1).join('/');
            try {
                await webcontainer.fs.mkdir(dirPath, { recursive: true });
            } catch (e) {
                // Directory might already exist, ignore error
            }
        }

        await webcontainer.fs.writeFile(path, content);
    };

    const readFile = async (path: string) => {
        if (!webcontainer) throw new Error("WebContainer not booted");
        const content = await webcontainer.fs.readFile(path, "utf-8");
        return content;
    };

    const runCommand = async (cmd: string, args: string[]): Promise<number> => {
        if (!webcontainer) throw new Error("WebContainer not booted");

        // Write command to terminal
        terminalWriter.current?.(`> ${cmd} ${args.join(" ")}\r\n`);

        const process = await webcontainer.spawn(cmd, args);

        process.output.pipeTo(
            new WritableStream({
                write(data) {
                    console.log(`[${cmd}]`, data);
                    terminalWriter.current?.(data);
                },
            })
        );

        return await process.exit;
    };

    const registerTerminal = (writer: (data: string) => void) => {
        terminalWriter.current = writer;
    };

    // Load project files into WebContainer
    const loadProjectFiles = useCallback(async (files: Record<string, string>) => {
        if (!webcontainer || Object.keys(files).length === 0) return;

        setServerStatus("writing-files");
        setServerStatusMessage("Writing project files...");

        try {
            let fileCount = 0;
            const totalFiles = Object.keys(files).length;

            for (const [path, content] of Object.entries(files)) {
                await writeFile(path, content);
                fileCount++;
                setServerStatusMessage(`Writing files... (${fileCount}/${totalFiles})`);
            }

            console.log(`Wrote ${fileCount} files to WebContainer`);
        } catch (err) {
            console.error("Error writing project files:", err);
            setServerStatus("error");
            setServerStatusMessage("Failed to write files");
        }
    }, [webcontainer]);

    // Start dev server (install deps + npm run dev)
    const startDevServer = useCallback(async () => {
        if (!webcontainer) return;

        try {
            // Check if package.json exists
            let hasPackageJson = false;
            try {
                await webcontainer.fs.readFile("package.json", "utf-8");
                hasPackageJson = true;
            } catch {
                hasPackageJson = false;
            }

            if (!hasPackageJson) {
                setServerStatus("idle");
                setServerStatusMessage("No package.json found");
                return;
            }

            // Install dependencies
            setServerStatus("installing");
            setServerStatusMessage("Installing dependencies...");

            const installExitCode = await runCommand("npm", ["install"]);

            if (installExitCode !== 0) {
                setServerStatus("error");
                setServerStatusMessage("Failed to install dependencies");
                return;
            }

            // Start dev server
            setServerStatus("starting");
            setServerStatusMessage("Starting dev server...");

            // Don't await - server runs indefinitely
            const process = await webcontainer.spawn("npm", ["run", "dev"]);

            process.output.pipeTo(
                new WritableStream({
                    write(data) {
                        console.log("[dev]", data);
                        terminalWriter.current?.(data);
                    },
                })
            );

        } catch (err) {
            console.error("Error starting dev server:", err);
            setServerStatus("error");
            setServerStatusMessage("Failed to start server");
        }
    }, [webcontainer, runCommand]);

    // Reset container - clear all files and reset state for new project
    const resetContainer = useCallback(async () => {
        if (!webcontainer) return;

        console.log("Resetting WebContainer for new project...");
        setServerUrl(null);
        setServerStatus("idle");
        setServerStatusMessage("");

        try {
            // Get list of all files/folders in root
            const entries = await webcontainer.fs.readdir("/");

            // Delete each entry
            for (const entry of entries) {
                try {
                    await webcontainer.fs.rm(`/${entry}`, { recursive: true });
                } catch (e) {
                    // Ignore errors for individual files
                }
            }

            console.log("WebContainer reset complete");
        } catch (err) {
            console.error("Error resetting WebContainer:", err);
        }
    }, [webcontainer]);

    return (
        <WebContainerContext.Provider
            value={{
                webcontainer,
                isLoading,
                error,
                serverUrl,
                serverStatus,
                serverStatusMessage,
                writeFile,
                readFile,
                runCommand,
                registerTerminal,
                loadProjectFiles,
                startDevServer,
                resetContainer,
            }}
        >
            {children}
        </WebContainerContext.Provider>
    );
}

export function useWebContainer() {
    const context = useContext(WebContainerContext);
    if (!context) {
        throw new Error(
            "useWebContainer must be used within a WebContainerProvider"
        );
    }
    return context;
}
