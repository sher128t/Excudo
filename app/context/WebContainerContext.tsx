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

export interface CommandResult {
    exitCode: number;
    output: string;
}

interface WebContainerContextType {
    webcontainer: WebContainer | null;
    isLoading: boolean;
    error: Error | null;
    serverUrl: string | null;
    serverStatus: ServerStatus;
    serverStatusMessage: string;
    buildError: string | null;
    clearBuildError: () => void;
    writeFile: (path: string, content: string) => Promise<void>;
    readFile: (path: string) => Promise<string>;
    deleteFile: (path: string) => Promise<void>;
    listFiles: () => Promise<string[]>;
    runCommand: (cmd: string, args: string[]) => Promise<number>;
    runShellCommand: (command: string) => Promise<CommandResult>;
    registerTerminal: (writer: (data: string) => void) => void;
    loadProjectFiles: (files: Record<string, string>) => Promise<void>;
    startDevServer: () => Promise<void>;
    resetContainer: () => Promise<void>;
}

const WebContainerContext = createContext<WebContainerContextType | null>(null);

// Directories that should never be listed or persisted
const IGNORED_DIRS = new Set(["node_modules", ".git", "dist", ".cache", ".npm"]);

// Strip ANSI escape codes so captured errors are readable
function stripAnsi(text: string): string {
    // eslint-disable-next-line no-control-regex
    return text.replace(/\u001b\[[0-9;?]*[a-zA-Z]/g, "").replace(/\u001b\][^\u0007]*\u0007/g, "");
}

const ERROR_PATTERNS = [
    /Failed to resolve import/i,
    /Internal server error/i,
    /\[plugin:vite/i,
    /Pre-transform error/i,
    /SyntaxError/,
    /ReferenceError/,
    /Cannot find module/i,
    /Module not found/i,
    /Unexpected token/i,
    /ERROR:/,
];

const ERROR_CLEAR_PATTERNS = [
    /hmr update/i,
    /page reload/i,
    /ready in/i,
];

export function WebContainerProvider({ children }: { children: ReactNode }) {
    const [webcontainer, setWebcontainer] = useState<WebContainer | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [serverUrl, setServerUrl] = useState<string | null>(null);
    const [serverStatus, setServerStatus] = useState<ServerStatus>("idle");
    const [serverStatusMessage, setServerStatusMessage] = useState("");
    const [buildError, setBuildError] = useState<string | null>(null);
    const booted = useRef(false);
    const terminalWriter = useRef<((data: string) => void) | null>(null);
    // Rolling buffer of recent dev-server output, used to give error context to the AI
    const outputBufferRef = useRef<string>("");

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
                    setBuildError(null);
                });
            } catch (err) {
                console.error("Failed to boot WebContainer:", err);
                setError(err instanceof Error ? err : new Error("Unknown error"));
                setIsLoading(false);
            }
        }

        boot();
    }, []);

    const clearBuildError = useCallback(() => setBuildError(null), []);

    // Inspect dev-server output for build/runtime errors so the AI can fix them
    const inspectOutput = useCallback((data: string) => {
        const clean = stripAnsi(data);
        outputBufferRef.current = (outputBufferRef.current + clean).slice(-6000);

        if (ERROR_CLEAR_PATTERNS.some((p) => p.test(clean))) {
            setBuildError(null);
            return;
        }
        if (ERROR_PATTERNS.some((p) => p.test(clean))) {
            // Capture the recent output tail as error context
            const context = outputBufferRef.current.slice(-2500).trim();
            setBuildError(context);
        }
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

    const deleteFile = async (path: string) => {
        if (!webcontainer) throw new Error("WebContainer not booted");
        await webcontainer.fs.rm(path, { recursive: true });
    };

    // Recursively list all project files (excluding node_modules etc.)
    const listFiles = useCallback(async (): Promise<string[]> => {
        if (!webcontainer) throw new Error("WebContainer not booted");

        const results: string[] = [];
        const walk = async (dir: string) => {
            const entries = await webcontainer.fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (IGNORED_DIRS.has(entry.name) || entry.name.startsWith(".")) continue;
                const fullPath = dir === "/" ? `/${entry.name}` : `${dir}/${entry.name}`;
                if (entry.isDirectory()) {
                    await walk(fullPath);
                } else {
                    results.push(fullPath.replace(/^\//, ""));
                }
            }
        };

        await walk("/");
        return results.sort();
    }, [webcontainer]);

    const runCommand = async (cmd: string, args: string[]): Promise<number> => {
        if (!webcontainer) throw new Error("WebContainer not booted");

        // Write command to terminal
        terminalWriter.current?.(`> ${cmd} ${args.join(" ")}\r\n`);

        const process = await webcontainer.spawn(cmd, args);
        let output = "";

        process.output.pipeTo(
            new WritableStream({
                write(data) {
                    console.log(`[${cmd}]`, data);
                    output += data;
                    terminalWriter.current?.(data);
                },
            })
        );

        const exitCode = await process.exit;
        if (exitCode !== 0) {
            const cleanOutput = stripAnsi(output).slice(-2500).trim();
            if (cleanOutput) setBuildError(cleanOutput);
        }
        return exitCode;
    };

    // Run a full shell command (supports &&, pipes, quotes) and capture output
    const runShellCommand = useCallback(async (command: string): Promise<CommandResult> => {
        if (!webcontainer) throw new Error("WebContainer not booted");

        terminalWriter.current?.(`> ${command}\r\n`);

        const process = await webcontainer.spawn("jsh", ["-c", command]);

        let output = "";
        process.output.pipeTo(
            new WritableStream({
                write(data) {
                    output += data;
                    terminalWriter.current?.(data);
                },
            })
        );

        const exitCode = await process.exit;
        return { exitCode, output: stripAnsi(output) };
    }, [webcontainer]);

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

            setBuildError(null);
            outputBufferRef.current = "";

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
                        inspectOutput(data);
                    },
                })
            );

        } catch (err) {
            console.error("Error starting dev server:", err);
            setServerStatus("error");
            setServerStatusMessage("Failed to start server");
        }
    }, [webcontainer, runCommand, inspectOutput]);

    // Reset container - clear all files and reset state for new project
    const resetContainer = useCallback(async () => {
        if (!webcontainer) return;

        console.log("Resetting WebContainer for new project...");
        setServerUrl(null);
        setServerStatus("idle");
        setServerStatusMessage("");
        setBuildError(null);
        outputBufferRef.current = "";

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
                buildError,
                clearBuildError,
                writeFile,
                readFile,
                deleteFile,
                listFiles,
                runCommand,
                runShellCommand,
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
