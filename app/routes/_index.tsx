import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Header } from "~/components/Header";
import { Sidebar } from "~/components/Sidebar";
import { ChatInterface } from "~/components/ChatInterface";
import { CodeEditor } from "~/components/CodeEditor";
import { Terminal } from "~/components/Terminal";
import { Preview } from "~/components/Preview";
import { useEffect, useState } from "react";

export default function Index() {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    return (
        <div className="h-screen w-screen bg-[#0a0a0f] text-white flex flex-col overflow-hidden">
            {/* Header */}
            <Header />

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <Sidebar />

                {/* Workspace */}
                <div className="flex-1 flex flex-col h-full">
                    <PanelGroup direction="horizontal">
                        {/* Left Panel: Chat & Editor */}
                        <Panel defaultSize={50} minSize={20}>
                            <PanelGroup direction="horizontal">
                                <Panel defaultSize={40} minSize={20}>
                                    <ChatInterface />
                                </Panel>
                                <PanelResizeHandle className="w-1 bg-[#1e1e2e] hover:bg-indigo-500/50 transition-colors cursor-col-resize" />
                                <Panel defaultSize={60} minSize={20}>
                                    <PanelGroup direction="vertical">
                                        <Panel defaultSize={70} minSize={20}>
                                            {isMounted ? <CodeEditor /> : <div className="h-full bg-[#1e1e1e]" />}
                                        </Panel>
                                        <PanelResizeHandle className="h-1 bg-[#1e1e2e] hover:bg-indigo-500/50 transition-colors cursor-row-resize" />
                                        <Panel defaultSize={30} minSize={10}>
                                            {isMounted ? <Terminal /> : <div className="h-full bg-[#1e1e1e]" />}
                                        </Panel>
                                    </PanelGroup>
                                </Panel>
                            </PanelGroup>
                        </Panel>

                        <PanelResizeHandle className="w-1 bg-[#1e1e2e] hover:bg-indigo-500/50 transition-colors cursor-col-resize" />

                        {/* Right Panel: Preview */}
                        <Panel defaultSize={50} minSize={20}>
                            <Preview />
                        </Panel>
                    </PanelGroup>
                </div>
            </div>
        </div>
    );
}

