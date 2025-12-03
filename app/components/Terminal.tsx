import { useEffect, useRef } from "react";
import { Terminal as XTerm } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import { useWebContainer } from "~/context/WebContainerContext";

export function Terminal() {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<XTerm | null>(null);
    const { registerTerminal } = useWebContainer();

    useEffect(() => {
        if (!terminalRef.current || xtermRef.current) return;

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

        term.open(terminalRef.current);
        fitAddon.fit();

        xtermRef.current = term;

        // Register terminal writer
        registerTerminal((data) => {
            term.write(data);
        });

        // Handle resize
        const handleResize = () => fitAddon.fit();
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            term.dispose();
        };
    }, [registerTerminal]);

    return <div ref={terminalRef} className="h-full w-full bg-[#1e1e1e]" />;
}
