import {
    createContext,
    useContext,
    useEffect,
    useState,
    useRef,
    type ReactNode,
} from "react";
import { WebContainer } from "@webcontainer/api";

interface WebContainerContextType {
    webcontainer: WebContainer | null;
    isLoading: boolean;
    error: Error | null;
    serverUrl: string | null;
    writeFile: (path: string, content: string) => Promise<void>;
    readFile: (path: string) => Promise<string>;
    runCommand: (cmd: string, args: string[]) => Promise<void>;
    registerTerminal: (writer: (data: string) => void) => void;
}

const WebContainerContext = createContext<WebContainerContextType | null>(null);

export function WebContainerProvider({ children }: { children: ReactNode }) {
    const [webcontainer, setWebcontainer] = useState<WebContainer | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [serverUrl, setServerUrl] = useState<string | null>(null);
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
        await webcontainer.fs.writeFile(path, content);
    };

    const readFile = async (path: string) => {
        if (!webcontainer) throw new Error("WebContainer not booted");
        const content = await webcontainer.fs.readFile(path, "utf-8");
        return content;
    };

    const runCommand = async (cmd: string, args: string[]) => {
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

        await process.exit;
    };

    const registerTerminal = (writer: (data: string) => void) => {
        terminalWriter.current = writer;
    };

    return (
        <WebContainerContext.Provider
            value={{
                webcontainer,
                isLoading,
                error,
                serverUrl,
                writeFile,
                readFile,
                runCommand,
                registerTerminal,
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
