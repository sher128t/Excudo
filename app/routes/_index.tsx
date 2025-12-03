import { Sidebar } from "~/components/Sidebar";
import { CodeEditor } from "~/components/CodeEditor";
import { Preview } from "~/components/Preview";
import { Terminal } from "~/components/Terminal";
import { ChatInterface } from "~/components/ChatInterface";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

export default function Index() {
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
                                        <CodeEditor />
                                    </Panel>
                                    <PanelResizeHandle className="h-1 bg-gray-800 hover:bg-blue-500 transition-colors" />
                                    <Panel defaultSize={30} minSize={10}>
                                        <Terminal />
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
