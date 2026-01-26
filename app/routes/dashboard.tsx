import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";
import { useProject } from "~/context/ProjectContext";
import { canCreateProject, getProjectLimit } from "~/lib/types";
import {
    Hammer, Home, Search, FolderOpen, Clock, Star, Compass,
    BookOpen, Sparkles, Plus, ArrowRight, Zap, Loader2,
    AlertCircle, Paperclip, X, ChevronRight, Layout, Share2
} from "lucide-react";
import { UserMenu } from "~/components/UserMenu";
import { FileAttachModal, type AttachedFile } from "~/components/FileAttachModal";

export type ModelMode = "fast" | "thinking";

// Typing animation prompts
const TYPING_PROMPTS = [
    "an internal tool that...",
    "a landing page for my startup",
    "a portfolio website",
    "a SaaS dashboard",
    "an e-commerce store",
    "a mobile app UI",
];

export default function Dashboard() {
    const { user, profile, loading: authLoading } = useAuth();
    const { projects, loading: projectsLoading, createNewProject } = useProject();
    const navigate = useNavigate();
    const [prompt, setPrompt] = useState("");
    const [creatingProject, setCreatingProject] = useState(false);
    const [limitError, setLimitError] = useState("");
    const [modelMode, setModelMode] = useState<ModelMode>("fast");

    // Attachment state
    const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
    const [showAttachModal, setShowAttachModal] = useState(false);

    // Typing animation state
    const [typingText, setTypingText] = useState("");
    const [promptIndex, setPromptIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    // Check if user can use thinking mode
    const canUseThinking = profile?.tier !== "free";

    // Check if user can create more projects
    const canCreate = profile ? canCreateProject(profile, projects.length) : true;
    const projectLimit = profile ? getProjectLimit(profile) : 3;

    // Typing animation effect
    useEffect(() => {
        const currentPrompt = TYPING_PROMPTS[promptIndex];
        const typingSpeed = isDeleting ? 30 : 80;

        const timeout = setTimeout(() => {
            if (!isDeleting) {
                if (typingText.length < currentPrompt.length) {
                    setTypingText(currentPrompt.slice(0, typingText.length + 1));
                } else {
                    setTimeout(() => setIsDeleting(true), 2000);
                }
            } else {
                if (typingText.length > 0) {
                    setTypingText(typingText.slice(0, -1));
                } else {
                    setIsDeleting(false);
                    setPromptIndex((prev) => (prev + 1) % TYPING_PROMPTS.length);
                }
            }
        }, typingSpeed);

        return () => clearTimeout(timeout);
    }, [typingText, isDeleting, promptIndex]);

    // Get user's display name
    const userName = profile?.full_name || profile?.email?.split("@")[0] || user?.email?.split("@")[0] || "there";

    // Redirect to landing if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/landing");
        }
    }, [user, authLoading, navigate]);

    const handleStartProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || !user) return;

        if (!canCreate) {
            setLimitError(`You've reached your limit of ${projectLimit} projects. Upgrade to create more!`);
            return;
        }
        setLimitError("");

        setCreatingProject(true);
        try {
            const projectName = prompt.slice(0, 50) + (prompt.length > 50 ? "..." : "");
            const project = await createNewProject(projectName);

            if (project) {
                sessionStorage.setItem("initialPrompt", prompt);
                sessionStorage.setItem("currentProjectId", project.id);
                sessionStorage.setItem("initialModelMode", modelMode);
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
        <div className="h-screen w-screen bg-[#0a0a0f] text-white flex overflow-hidden">
            {/* Minimal Sidebar */}
            <aside className="w-56 bg-[#0a0a0f]/80 backdrop-blur-xl border-r border-white/5 flex flex-col">
                {/* Logo */}
                <div className="p-4">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-pink-600 rounded-lg flex items-center justify-center">
                            <Hammer className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-white">Forge</span>
                    </div>
                </div>

                {/* My Workspace Dropdown */}
                <div className="px-3 mb-2">
                    <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                        <div className="w-6 h-6 bg-gradient-to-br from-pink-500 to-orange-500 rounded flex items-center justify-center text-xs font-bold">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium truncate flex-1 text-left">{userName}'s workspace</span>
                        <ChevronRight className="w-4 h-4 text-gray-500 rotate-90" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 space-y-1">
                    <NavItem icon={Home} label="Home" active />
                    <NavItem icon={Search} label="Search" />

                    <div className="pt-4 pb-2">
                        <p className="text-[11px] text-gray-500 uppercase tracking-wider px-3 font-medium">Projects</p>
                    </div>
                    <NavItem icon={Clock} label="Recent" />
                    <NavItem icon={FolderOpen} label="All projects" href="/projects" />
                    <NavItem icon={Star} label="Starred" />
                    <NavItem icon={Share2} label="Shared with me" />

                    <div className="pt-4 pb-2">
                        <p className="text-[11px] text-gray-500 uppercase tracking-wider px-3 font-medium">Resources</p>
                    </div>
                    <NavItem icon={Compass} label="Discover" />
                    <NavItem icon={Layout} label="Templates" />
                    <NavItem icon={BookOpen} label="Learn" />
                </nav>

                {/* Bottom */}
                <div className="p-3 space-y-2">
                    <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm">
                        <Share2 className="w-4 h-4" />
                        <span>Share Forge</span>
                        <span className="ml-auto text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">3 credits</span>
                    </button>
                    <Link
                        to="/pricing"
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 hover:border-indigo-500/50 transition-colors text-sm"
                    >
                        <Zap className="w-4 h-4 text-indigo-400" />
                        <span className="text-indigo-300">Upgrade to Pro</span>
                    </Link>
                    <div className="flex items-center gap-2 px-1 pt-2">
                        <UserMenu />
                        <span className="text-xs text-gray-500 truncate">{user.email}</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Aurora Gradient Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Top blue glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-blue-600/30 blur-[120px] rounded-full" />
                    {/* Center pink/magenta glow */}
                    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-pink-600/40 blur-[120px] rounded-full" />
                    {/* Bottom warm glow */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1400px] h-[400px] bg-orange-600/20 blur-[120px] rounded-full" />
                </div>

                {/* Scrollable Content */}
                <div className="relative z-10 flex-1 flex flex-col overflow-y-auto">
                    {/* Hero Section - Centered */}
                    <div className="flex-1 flex flex-col items-center justify-center px-8 py-16 min-h-[55vh]">
                        <div className="w-full max-w-2xl text-center">
                            {/* Greeting */}
                            <h1 className="text-4xl md:text-5xl font-semibold mb-12 text-white">
                                What's on your mind, {userName}?
                            </h1>

                            {/* Attached Images Preview */}
                            {attachedFiles.length > 0 && (
                                <div className="flex gap-2 mb-4 justify-center flex-wrap">
                                    {attachedFiles.map((file) => (
                                        <div key={file.id} className="relative group">
                                            <img
                                                src={file.dataUrl}
                                                alt={file.name}
                                                className="w-16 h-16 object-cover rounded-lg border border-white/10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setAttachedFiles(prev => prev.filter(f => f.id !== file.id))}
                                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Prompt Input - Glassmorphism Style */}
                            <form onSubmit={handleStartProject}>
                                <div className={`relative bg-[#1a1a24]/80 backdrop-blur-xl border rounded-2xl overflow-hidden ${limitError ? 'border-red-500/50' : 'border-white/10'}`}>
                                    {/* Main input row */}
                                    <div className="flex items-center px-4 py-4">
                                        <input
                                            type="text"
                                            value={prompt}
                                            onChange={(e) => { setPrompt(e.target.value); setLimitError(""); }}
                                            placeholder={`Ask Forge to create ${typingText}${!isDeleting ? '|' : ''}`}
                                            className="flex-1 bg-transparent text-white text-base placeholder-gray-500 focus:outline-none"
                                            disabled={creatingProject || !canCreate}
                                        />
                                    </div>

                                    {/* Bottom toolbar */}
                                    <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 bg-white/[0.02]">
                                        <div className="flex items-center gap-1">
                                            {/* Plus button */}
                                            <button
                                                type="button"
                                                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                            {/* Attach button */}
                                            <button
                                                type="button"
                                                onClick={() => setShowAttachModal(true)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${attachedFiles.length > 0
                                                        ? 'text-indigo-400 bg-indigo-500/10'
                                                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                                                    }`}
                                            >
                                                <Paperclip className="w-4 h-4" />
                                                <span>Attach</span>
                                            </button>
                                            {/* Theme button */}
                                            <button
                                                type="button"
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-sm"
                                            >
                                                <Sparkles className="w-4 h-4" />
                                                <span>Theme</span>
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* Mode selector */}
                                            <div className="flex items-center bg-white/5 rounded-lg p-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setModelMode("fast")}
                                                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${modelMode === "fast"
                                                            ? "bg-white/10 text-white"
                                                            : "text-gray-400 hover:text-white"
                                                        }`}
                                                >
                                                    Fast
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => canUseThinking && setModelMode("thinking")}
                                                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${modelMode === "thinking"
                                                            ? "bg-white/10 text-white"
                                                            : "text-gray-400 hover:text-white"
                                                        } ${!canUseThinking ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    Thinking
                                                </button>
                                            </div>
                                            {/* Submit button */}
                                            <button
                                                type="submit"
                                                disabled={!prompt.trim() || creatingProject || !canCreate}
                                                className="w-8 h-8 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center disabled:opacity-50 hover:opacity-90 transition-opacity"
                                            >
                                                {creatingProject ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <ArrowRight className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Error message */}
                                {limitError && (
                                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                        <p className="text-sm text-red-400">{limitError}</p>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>

                    {/* Projects Section - Bottom Card */}
                    <div className="px-8 pb-8">
                        <div className="relative bg-[#0f0f14]/90 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden">
                            {/* Subtle gradient border effect at top */}
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pink-500/50 to-transparent" />

                            <div className="relative p-6">
                                {/* Header with tabs */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-6">
                                        <button className="text-sm font-medium text-white border-b-2 border-orange-500 pb-1">
                                            Recently viewed
                                        </button>
                                        <button className="text-sm text-gray-400 hover:text-white transition-colors pb-1 border-b-2 border-transparent">
                                            My projects
                                        </button>
                                        <button className="text-sm text-gray-400 hover:text-white transition-colors pb-1 border-b-2 border-transparent">
                                            Templates
                                        </button>
                                    </div>
                                    <Link
                                        to="/projects"
                                        className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
                                    >
                                        Browse all
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>

                                {/* Projects horizontal scroll */}
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
                                    <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2">
                                        {projects.slice(0, 6).map((project) => (
                                            <ProjectCard
                                                key={project.id}
                                                project={project}
                                                onOpen={() => handleOpenProject(project.id)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* File Attach Modal */}
            <FileAttachModal
                isOpen={showAttachModal}
                onClose={() => setShowAttachModal(false)}
                onAttach={(files) => setAttachedFiles(prev => [...prev, ...files])}
            />
        </div>
    );
}

// Navigation item component
function NavItem({ icon: Icon, label, active, href }: { icon: any; label: string; active?: boolean; href?: string }) {
    const className = `w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${active
            ? "bg-white/10 text-white"
            : "text-gray-400 hover:text-white hover:bg-white/5"
        }`;

    if (href) {
        return (
            <Link to={href} className={className}>
                <Icon className="w-4 h-4" />
                <span>{label}</span>
            </Link>
        );
    }

    return (
        <button className={className}>
            <Icon className="w-4 h-4" />
            <span>{label}</span>
        </button>
    );
}

// Project card component
function ProjectCard({ project, onOpen }: { project: any; onOpen: () => void }) {
    const timeAgo = getTimeAgo(project.updated_at || project.created_at);

    return (
        <button
            onClick={onOpen}
            className="flex-shrink-0 w-64 group text-left"
        >
            {/* Thumbnail */}
            <div className="relative aspect-[16/10] bg-[#1a1a24] rounded-xl overflow-hidden border border-white/5 mb-3 group-hover:border-white/20 transition-colors">
                {project.thumbnail ? (
                    <img
                        src={project.thumbnail}
                        alt={project.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-600/20 to-purple-600/20">
                        <FolderOpen className="w-8 h-8 text-gray-600" />
                    </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-sm font-medium">Open project</span>
                </div>
            </div>

            {/* Info */}
            <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {(project.name || "U").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                    <h3 className="text-sm font-medium text-white truncate group-hover:text-indigo-400 transition-colors">
                        {project.name || "Untitled"}
                    </h3>
                    <p className="text-xs text-gray-500">{timeAgo}</p>
                </div>
            </div>
        </button>
    );
}

function getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
}
