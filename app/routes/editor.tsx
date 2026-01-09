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
import { useProject } from "~/context/ProjectContext";
import { useNavigate } from "react-router";

export default function Editor() {
    const { user, loading: authLoading } = useAuth();
    const { currentProject, openProject, loading: projectLoading } = useProject();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<"preview" | "code" | "terminal">("preview");
    const [showPreview, setShowPreview] = useState(true);
    const [showCodePanel, setShowCodePanel] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [projectInitialized, setProjectInitialized] = useState(false);

    // Mount and load project from sessionStorage
    useEffect(() => {
        setIsMounted(true);

        // Load project if we have an ID in sessionStorage
        const projectId = sessionStorage.getItem("currentProjectId");
        if (projectId && !projectInitialized) {
            setProjectInitialized(true);
            openProject(projectId).then(() => {
                console.log("Project loaded:", projectId);
            });
        }
    }, [openProject, projectInitialized]);

    // Redirect to landing if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/landing");
        }
    }, [user, authLoading, navigate]);

    // Show loading while checking auth or loading project
    const isLoading = authLoading || (projectLoading && !currentProject);

    if (isLoading) {
        return (
            <div className="h-screen w-screen bg-[#0a0a0f] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">
                        {authLoading ? "Checking authentication..." : "Loading project..."}
                    </p>
                </div>
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
