import { useState, useEffect } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Header } from "~/components/Header";
import { ChatInterface } from "~/components/ChatInterface";
import { CodeEditor } from "~/components/CodeEditor";
import { Terminal } from "~/components/Terminal";
import { Preview } from "~/components/Preview";
import { Sidebar } from "~/components/Sidebar";
import { X, Loader2 } from "lucide-react";
import { useAuth } from "~/context/AuthContext";
import { useNavigate } from "react-router";

export default function Editor() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<"preview" | "code" | "terminal">("preview");
    const [showPreview, setShowPreview] = useState(true);
    const [showCodePanel, setShowCodePanel] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);

        // Check for initial prompt from dashboard
        const initialPrompt = sessionStorage.getItem("initialPrompt");
        if (initialPrompt) {
            sessionStorage.removeItem("initialPrompt");
            // TODO: Auto-submit the prompt
        }
    }, []);

    // Redirect to landing if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            navigate("/landing");
        }
    }, [user, loading, navigate]);

    // Show loading while checking auth
    if (loading) {
        return (
            <div className="h-screen w-screen bg-[#0a0a0f] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    // Don't render if not logged in
    if (!user) {
        return null;
    }

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
                {showCodePanel && (
                    <Sidebar />
                )}

                <PanelGroup direction="horizontal" className="flex-1">
                    <Panel defaultSize={showPreview ? 35 : 100} minSize={25}>
                        <ChatInterface />
                    </Panel>

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
