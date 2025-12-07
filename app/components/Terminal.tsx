import { useEffect, useRef } from "react";
import "xterm/css/xterm.css";
import { useWebContainer } from "~/context/WebContainerContext";

export function Terminal() {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<any>(null);
    const { registerTerminal } = useWebContainer();

    useEffect(() => {
        if (!terminalRef.current || xtermRef.current) return;

        const initTerminal = async () => {
            const { Terminal: XTerm } = await import("xterm");
            const { FitAddon } = await import("xterm-addon-fit");

            const term = new XTerm({
                cursorBlink: true,
                theme: {
                    background: "#1e1e1e",
                },
                fontSize: 12,
                fontFamily: "Menlo, Monaco, 'Courier New', monospace",
            });

            const fitAddon = new FitAddon();
            term.loadAddon(fitAddon);

            term.open(terminalRef.current!);
            fitAddon.fit();

            xtermRef.current = term;

            // Register terminal writer
            registerTerminal((data) => {
                term.write(data);
            });

            // Handle resize
            const handleResize = () => fitAddon.fit();
            window.addEventListener("resize", handleResize);

            // Cleanup
            return () => {
                window.removeEventListener("resize", handleResize);
                term.dispose();
            };
        };

        initTerminal();
    }, [registerTerminal]);

    return <div ref={terminalRef} className="h-full w-full bg-[#1e1e1e]" />;
}
