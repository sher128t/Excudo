import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";
import { useProject } from "~/context/ProjectContext";
import {
    Hammer, Home, Search, FolderOpen, Clock, Star, Users, Compass,
    BookOpen, Sparkles, Plus, ArrowRight, Zap, Loader2, MoreHorizontal,
    Trash2, Pencil, ExternalLink
} from "lucide-react";
import { CreditsDisplay } from "~/components/CreditsDisplay";
import { UserMenu } from "~/components/UserMenu";

export default function Dashboard() {
    const { user, profile, loading: authLoading } = useAuth();
    const { projects, loading: projectsLoading, createNewProject, deleteProjectById } = useProject();
    const navigate = useNavigate();
    const [prompt, setPrompt] = useState("");
    const [activeTab, setActiveTab] = useState<"recent" | "projects" | "templates">("recent");
    const [creatingProject, setCreatingProject] = useState(false);

    // Redirect to landing if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/landing");
        }
    }, [user, authLoading, navigate]);

    const handleStartProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || !user) return;

        setCreatingProject(true);
        try {
            // Create new project with the prompt as name
            const projectName = prompt.slice(0, 50) + (prompt.length > 50 ? "..." : "");
            const project = await createNewProject(projectName);

            if (project) {
                // Store prompt and project ID for editor
                sessionStorage.setItem("initialPrompt", prompt);
                sessionStorage.setItem("currentProjectId", project.id);
                navigate("/editor");
            }
        } catch (err) {
            console.error("Failed to create project:", err);
        } finally {
            setCreatingProject(false);
        }
    };

    const handleBlankProject = async () => {
        if (!user) return;

        setCreatingProject(true);
        try {
            const project = await createNewProject("Untitled Project");
            if (project) {
                sessionStorage.setItem("currentProjectId", project.id);
                navigate("/editor");
            }
        } catch (err) {
            console.error("Failed to create project:", err);
        } finally {
            setCreatingProject(false);
        }
    };

    const handleOpenProject = (projectId: string) => {
        sessionStorage.setItem("currentProjectId", projectId);
        navigate("/editor");
    };

    if (authLoading) {
        return (
            <div className="h-screen w-screen bg-[#0a0a0f] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="h-screen w-screen bg-[#0a0a0f] text-white flex">
            {/* Sidebar */}
            <aside className="w-64 bg-[#0a0a0f] border-r border-[#1e1e2e] flex flex-col">
                {/* Logo */}
                <div className="p-4 border-b border-[#1e1e2e]">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Hammer className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            Forge
                        </span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1">
                    <SidebarItem icon={Home} label="Home" active />
                    <SidebarItem icon={Search} label="Search" />

                    <div className="pt-4 pb-2">
                        <p className="text-xs text-gray-500 uppercase tracking-wider px-3">Projects</p>
                    </div>
                    <SidebarItem icon={Clock} label="Recent" badge={projects.length} />
                    <SidebarItem icon={FolderOpen} label="All projects" />
                    <SidebarItem icon={Star} label="Starred" />
                    <SidebarItem icon={Users} label="Shared with me" />

                    <div className="pt-4 pb-2">
                        <p className="text-xs text-gray-500 uppercase tracking-wider px-3">Resources</p>
                    </div>
                    <SidebarItem icon={Compass} label="Discover" />
                    <SidebarItem icon={BookOpen} label="Templates" />
                </nav>

                {/* Bottom */}
                <div className="p-4 border-t border-[#1e1e2e] space-y-3">
                    <CreditsDisplay />
                    <div className="flex items-center gap-2">
                        <UserMenu />
                        <span className="text-sm text-gray-400 truncate">{user.email}</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Hero Area */}
                <div className="relative flex-1 flex flex-col items-center justify-center p-8 overflow-hidden">
                    {/* Gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 via-purple-900/10 to-transparent" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-r from-indigo-600/20 to-purple-600/20 blur-3xl rounded-full" />

                    <div className="relative z-10 w-full max-w-2xl text-center">
                        <h1 className="text-4xl font-bold mb-8">
                            Let's build something, <span className="text-indigo-400">{profile?.email?.split("@")[0] || user.email?.split("@")[0] || "Builder"}</span>
                        </h1>

                        {/* Prompt Input */}
                        <form onSubmit={handleStartProject} className="relative">
                            <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-2 flex items-center gap-2">
                                <input
                                    type="text"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Ask Forge to create a dashboard for..."
                                    className="flex-1 bg-transparent px-4 py-3 text-white placeholder-gray-500 focus:outline-none"
                                    disabled={creatingProject}
                                />
                                <div className="flex items-center gap-2 pr-2">
                                    <button
                                        type="submit"
                                        disabled={!prompt.trim() || creatingProject}
                                        className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg disabled:opacity-50"
                                    >
                                        {creatingProject ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <ArrowRight className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>

                        {/* Quick Actions */}
                        <div className="flex items-center justify-center gap-3 mt-6">
                            <button
                                onClick={handleBlankProject}
                                disabled={creatingProject}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-[#1e1e2e] rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
                            >
                                <Sparkles className="w-4 h-4 text-indigo-400" />
                                Blank Project
                            </button>
                            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-[#1e1e2e] rounded-lg text-sm flex items-center gap-2">
                                <Zap className="w-4 h-4 text-purple-400" />
                                Use Template
                            </button>
                        </div>
                    </div>
                </div>

                {/* Projects Section */}
                <div className="bg-[#12121a] border-t border-[#1e1e2e] p-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setActiveTab("recent")}
                                    className={`text-sm pb-1 ${activeTab === "recent" ? "font-medium text-white border-b-2 border-indigo-500" : "text-gray-400 hover:text-white"}`}
                                >
                                    Recently Viewed
                                </button>
                                <button
                                    onClick={() => setActiveTab("projects")}
                                    className={`text-sm pb-1 ${activeTab === "projects" ? "font-medium text-white border-b-2 border-indigo-500" : "text-gray-400 hover:text-white"}`}
                                >
                                    My projects ({projects.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab("templates")}
                                    className={`text-sm pb-1 ${activeTab === "templates" ? "font-medium text-white border-b-2 border-indigo-500" : "text-gray-400 hover:text-white"}`}
                                >
                                    Templates
                                </button>
                            </div>
                        </div>

                        {/* Project Grid */}
                        {projectsLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                            </div>
                        ) : projects.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                <FolderOpen className="w-12 h-12 mb-4 opacity-50" />
                                <p>No projects yet. Start building something amazing!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {projects.slice(0, 8).map((project) => (
                                    <ProjectCard
                                        key={project.id}
                                        project={project}
                                        onOpen={() => handleOpenProject(project.id)}
                                        onDelete={() => deleteProjectById(project.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

function SidebarItem({ icon: Icon, label, active, badge }: { icon: any; label: string; active?: boolean; badge?: number }) {
    return (
        <button className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${active
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}>
            <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                <span>{label}</span>
            </div>
            {badge !== undefined && badge > 0 && (
                <span className="text-xs text-gray-500">{badge}</span>
            )}
        </button>
    );
}

function ProjectCard({ project, onOpen, onDelete }: { project: any; onOpen: () => void; onDelete: () => void }) {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const timeAgo = (date: string) => {
        const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (seconds < 60) return "just now";
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    return (
        <div className="group bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl overflow-hidden hover:border-indigo-500/30 transition-colors">
            {/* Preview placeholder */}
            <div
                onClick={onOpen}
                className="h-32 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 flex items-center justify-center cursor-pointer"
            >
                <Hammer className="w-8 h-8 text-indigo-500/30" />
            </div>

            {/* Info */}
            <div className="p-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <h3
                            onClick={onOpen}
                            className="text-sm font-medium truncate cursor-pointer hover:text-indigo-400"
                        >
                            {project.name}
                        </h3>
                        <p className="text-xs text-gray-500">{timeAgo(project.updated_at)}</p>
                    </div>
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-1 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {showMenu && (
                            <div className="absolute right-0 top-full mt-1 w-36 bg-[#12121a] border border-[#1e1e2e] rounded-lg shadow-xl py-1 z-50">
                                <button
                                    onClick={() => { onOpen(); setShowMenu(false); }}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 flex items-center gap-2"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Open
                                </button>
                                <button
                                    onClick={() => { onDelete(); setShowMenu(false); }}
                                    className="w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
