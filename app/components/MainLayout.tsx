import { useState, useEffect } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Header } from "./Header";
import { ChatInterface } from "./ChatInterface";
import { CodeEditor } from "./CodeEditor";
import { Terminal } from "./Terminal";
import { Preview } from "./Preview";
import { Sidebar } from "./Sidebar";
import { X } from "lucide-react";

export function MainLayout() {
    const [activeTab, setActiveTab] = useState<"preview" | "code" | "terminal">("preview");
    const [showPreview, setShowPreview] = useState(true);
    const [showCodePanel, setShowCodePanel] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    return (
        <div className="h-screen w-screen bg-[#0a0a0f] text-white flex flex-col overflow-hidden">
            <Header
                activeTab={activeTab}
                onTabChange={(tab) => {
                    setActiveTab(tab);
                    if (tab === "code" || tab === "terminal") {
                        setShowCodePanel(true);
                    }
                }}
                showPreview={showPreview}
                onTogglePreview={() => setShowPreview(!showPreview)}
            />

            <div className="flex-1 flex overflow-hidden">
                {/* Optional: Files sidebar - can be toggled */}
                {showCodePanel && (
                    <Sidebar />
                )}

                <PanelGroup direction="horizontal" className="flex-1">
                    {/* Chat Panel - Always visible */}
                    <Panel defaultSize={showPreview ? 35 : 100} minSize={25}>
                        <ChatInterface />
                    </Panel>

                    {/* Preview Panel - Toggle based on showPreview */}
                    {showPreview && (
                        <>
                            <PanelResizeHandle className="w-1 bg-[#1e1e2e] hover:bg-indigo-500/50 transition-colors cursor-col-resize" />
                            <Panel defaultSize={65} minSize={30}>
                                {activeTab === "preview" && <Preview />}
                                {activeTab === "code" && (
                                    <div className="h-full flex flex-col">
                                        <div className="flex items-center justify-between px-3 py-2 bg-[#12121a] border-b border-[#1e1e2e]">
                                            <span className="text-sm text-gray-400">Source Code</span>
                                            <button
                                                onClick={() => {
                                                    setActiveTab("preview");
                                                    setShowCodePanel(false);
                                                }}
                                                className="p-1 hover:bg-white/5 rounded"
                                            >
                                                <X className="w-4 h-4 text-gray-400" />
                                            </button>
                                        </div>
                                        <PanelGroup direction="vertical" className="flex-1">
                                            <Panel defaultSize={70}>
                                                {isMounted && <CodeEditor />}
                                            </Panel>
                                            <PanelResizeHandle className="h-1 bg-[#1e1e2e] hover:bg-indigo-500/50 transition-colors cursor-row-resize" />
                                            <Panel defaultSize={30}>
                                                {isMounted && <Terminal />}
                                            </Panel>
                                        </PanelGroup>
                                    </div>
                                )}
                                {activeTab === "terminal" && (
                                    <div className="h-full flex flex-col">
                                        <div className="flex items-center justify-between px-3 py-2 bg-[#12121a] border-b border-[#1e1e2e]">
                                            <span className="text-sm text-gray-400">Terminal</span>
                                            <button
                                                onClick={() => {
                                                    setActiveTab("preview");
                                                    setShowCodePanel(false);
                                                }}
                                                className="p-1 hover:bg-white/5 rounded"
                                            >
                                                <X className="w-4 h-4 text-gray-400" />
                                            </button>
                                        </div>
                                        <div className="flex-1">
                                            {isMounted && <Terminal />}
                                        </div>
                                    </div>
                                )}
                            </Panel>
                        </>
                    )}
                </PanelGroup>
            </div>
        </div>
    );
}
