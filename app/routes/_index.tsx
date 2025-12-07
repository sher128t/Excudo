import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
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
        <div className="h-screen w-screen bg-gray-950 text-white flex overflow-hidden">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full">
                <PanelGroup direction="horizontal">
                    {/* Left Panel: Chat & Editor */}
                    <Panel defaultSize={50} minSize={20}>
                        <PanelGroup direction="horizontal">
                            <Panel defaultSize={40} minSize={20}>
                                <ChatInterface />
                            </Panel>
                            <PanelResizeHandle className="w-1 bg-gray-800 hover:bg-blue-500 transition-colors" />
                            <Panel defaultSize={60} minSize={20}>
                                <PanelGroup direction="vertical">
                                    <Panel defaultSize={70} minSize={20}>
                                        {isMounted ? <CodeEditor /> : <div className="h-full bg-[#1e1e1e]" />}
                                    </Panel>
                                    <PanelResizeHandle className="h-1 bg-gray-800 hover:bg-blue-500 transition-colors" />
                                    <Panel defaultSize={30} minSize={10}>
                                        {isMounted ? <Terminal /> : <div className="h-full bg-[#1e1e1e]" />}
                                    </Panel>
                                </PanelGroup>
                            </Panel>
                        </PanelGroup>
                    </Panel>

                    <PanelResizeHandle className="w-1 bg-gray-800 hover:bg-blue-500 transition-colors" />

                    {/* Right Panel: Preview */}
                    <Panel defaultSize={50} minSize={20}>
                        <Preview />
                    </Panel>
                </PanelGroup>
            </div>
        </div>
    );
}
