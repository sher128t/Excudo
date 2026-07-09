import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";
import { useProject } from "~/context/ProjectContext";
import { canCreateProject, getProjectLimit } from "~/lib/types";
import { DEFAULT_PROJECT_STYLE, normalizeProjectStyle, type ProjectStyle } from "~/lib/template";
import {
    Hammer, Home, FolderOpen, ArrowRight, Zap, Loader2,
    AlertCircle, Paperclip, X,
    MoreHorizontal, Trash2, ExternalLink, Edit2, LayoutTemplate, Box
} from "lucide-react";
import { UserMenu } from "~/components/UserMenu";
import { FileAttachModal, type AttachedFile } from "~/components/FileAttachModal";
import { OnboardingModal } from "~/components/OnboardingModal";

export type ModelMode = "plan" | "fast" | "thinking";

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
    const { user, profile, loading: authLoading, refreshProfile } = useAuth();
    const { projects, loading: projectsLoading, createNewProject, deleteProjectById, renameProjectById } = useProject();
    const navigate = useNavigate();
    const [prompt, setPrompt] = useState("");
    const [creatingProject, setCreatingProject] = useState(false);
    const [limitError, setLimitError] = useState("");

    // Default mode based on tier: thinking for paid, fast for free
    const canUseThinking = profile?.tier !== "free" && profile?.tier !== undefined;
    const [modelMode, setModelMode] = useState<ModelMode>("fast");
    const [projectStyle, setProjectStyle] = useState<ProjectStyle>(DEFAULT_PROJECT_STYLE);

    // Update default mode when profile loads
    useEffect(() => {
        if (profile) {
            setModelMode(profile.tier === "free" ? "fast" : "thinking");
        }
    }, [profile]);

    // Attachment state
    const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
    const [showAttachModal, setShowAttachModal] = useState(false);

    // Typing animation state
    const [typingText, setTypingText] = useState("");
    const [promptIndex, setPromptIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    // Check if user can create more projects
    const canCreate = profile ? canCreateProject(profile, projects.length) : true;
    const projectLimit = profile ? getProjectLimit(profile) : 3;

    // Onboarding state - show modal if user has no full_name
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [onboardingComplete, setOnboardingComplete] = useState(false);

    // Check if we need to show onboarding
    useEffect(() => {
        if (profile && !onboardingComplete && !profile.full_name) {
            setShowOnboarding(true);
        }
    }, [profile, onboardingComplete]);

    const handleOnboardingComplete = async () => {
        setShowOnboarding(false);
        setOnboardingComplete(true);
        await refreshProfile();
    };

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

    // Pick up the prompt typed on the landing page before signup
    useEffect(() => {
        const landingPrompt = sessionStorage.getItem("landingPrompt");
        if (landingPrompt) {
            sessionStorage.removeItem("landingPrompt");
            setPrompt(landingPrompt);
        }

        const landingProjectStyle = sessionStorage.getItem("landingProjectStyle");
        if (landingProjectStyle) {
            sessionStorage.removeItem("landingProjectStyle");
            setProjectStyle(normalizeProjectStyle(landingProjectStyle));
        }
    }, []);

    // Redirect to landing if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/landing");
        }
    }, [user, authLoading, navigate]);

    const handleStartProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || !user) return;

        // Helper function to generate smart project title
        const generateTitle = async (userPrompt: string): Promise<string> => {
            try {
                const response = await fetch("/api/generate-title", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: userPrompt }),
                });
                if (response.ok) {
                    const data = await response.json();
                    return data.title || userPrompt.slice(0, 40);
                }
            } catch (error) {
                console.error("Failed to generate title:", error);
            }
            // Fallback to truncated prompt
            return userPrompt.slice(0, 40) + (userPrompt.length > 40 ? "..." : "");
        };

        // Plan mode - create project and go to editor with plan mode
        if (modelMode === "plan") {
            if (!canCreate) {
                setLimitError(`You've reached your limit of ${projectLimit} projects. Upgrade to create more!`);
                return;
            }
            setCreatingProject(true);
            try {
                const projectName = await generateTitle(prompt);
                const project = await createNewProject(projectName);
                if (project) {
                    sessionStorage.setItem("initialPrompt", prompt);
                    sessionStorage.setItem("currentProjectId", project.id);
                    sessionStorage.setItem("initialModelMode", "plan");
                    sessionStorage.setItem("initialProjectStyle", projectStyle);
                    navigate("/editor");
                }
            } catch (err) {
                console.error("Failed to create project:", err);
            } finally {
                setCreatingProject(false);
            }
            return;
        }

        if (!canCreate) {
            setLimitError(`You've reached your limit of ${projectLimit} projects. Upgrade to create more!`);
            return;
        }
        setLimitError("");

        setCreatingProject(true);
        try {
            const projectName = await generateTitle(prompt);
            const project = await createNewProject(projectName);

            if (project) {
                sessionStorage.setItem("initialPrompt", prompt);
                sessionStorage.setItem("currentProjectId", project.id);
                sessionStorage.setItem("initialModelMode", modelMode);
                sessionStorage.setItem("initialProjectStyle", projectStyle);
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
        <>
            {/* Onboarding Modal */}
            <OnboardingModal
                isOpen={showOnboarding}
                userId={user.id}
                onComplete={handleOnboardingComplete}
            />
            <div className="h-screen w-screen bg-[#0a0a0f] text-white flex flex-col md:flex-row overflow-hidden">
                {/* Mobile top bar */}
                <div className="md:hidden flex items-center justify-between px-4 h-14 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <Hammer className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-white">Excudo</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link to="/projects" className="text-sm text-gray-400 hover:text-white transition-colors">Projects</Link>
                        <UserMenu />
                    </div>
                </div>

                {/* Minimal Sidebar (desktop) */}
                <aside className="hidden md:flex w-56 bg-[#0a0a0f]/80 backdrop-blur-xl border-r border-white/5 flex-col">
                    {/* Logo */}
                    <div className="p-4">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                <Hammer className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-semibold text-white">Excudo</span>
                        </div>
                    </div>

                    {/* My Workspace */}
                    <div className="px-3 mb-2">
                        <div className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
                            <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded flex items-center justify-center text-xs font-bold">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium truncate flex-1 text-left">{userName}'s workspace</span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 space-y-1">
                        <NavItem icon={Home} label="Home" active />

                        <div className="pt-4 pb-2">
                            <p className="text-[11px] text-gray-500 uppercase tracking-wider px-3 font-medium">Projects</p>
                        </div>
                        <NavItem icon={FolderOpen} label="All projects" href="/projects" />
                    </nav>

                    {/* Bottom */}
                    <div className="p-3 space-y-2">
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
                                                placeholder={`Ask Excudo to create ${typingText}${!isDeleting ? '|' : ''}`}
                                                className="flex-1 bg-transparent text-white text-base placeholder-gray-500 focus:outline-none"
                                                disabled={creatingProject || !canCreate}
                                            />
                                        </div>

                                        {/* Bottom toolbar */}
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t border-white/5 bg-white/[0.02]">
                                            <div className="flex flex-wrap items-center gap-1">
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

                                                <div className="flex items-center bg-white/5 rounded-lg p-1 ml-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setProjectStyle("traditional")}
                                                        className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${projectStyle === "traditional"
                                                            ? "bg-white/10 text-white"
                                                            : "text-gray-400 hover:text-white"
                                                            }`}
                                                    >
                                                        <LayoutTemplate className="w-3 h-3" />
                                                        Classic
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setProjectStyle("immersive3d")}
                                                        className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${projectStyle === "immersive3d"
                                                            ? "bg-white/10 text-white"
                                                            : "text-gray-400 hover:text-white"
                                                            }`}
                                                    >
                                                        <Box className="w-3 h-3" />
                                                        3D
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2">
                                                {/* Mode selector - Plan separate from Build modes */}
                                                <div className="flex items-center gap-2">
                                                    {/* Plan button */}
                                                    <div className="bg-white/5 rounded-lg p-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => setModelMode("plan")}
                                                            className={`px-3 py-1 rounded text-xs font-medium transition-all ${modelMode === "plan"
                                                                ? "bg-white/10 text-white"
                                                                : "text-gray-400 hover:text-white"
                                                                }`}
                                                        >
                                                            Plan
                                                        </button>
                                                    </div>

                                                    {/* Separator */}
                                                    <div className="h-4 w-px bg-white/10" />

                                                    {/* Build modes */}
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
                                                            title={!canUseThinking ? 'Upgrade to use Thinking mode' : ''}
                                                        >
                                                            Thinking
                                                        </button>
                                                    </div>
                                                </div>
                                                {/* Submit button */}
                                                <button
                                                    type="submit"
                                                    disabled={!prompt.trim() || creatingProject || !canCreate}
                                                    className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center disabled:opacity-50 hover:opacity-90 transition-opacity"
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
                                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

                                <div className="relative p-6">
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-6">
                                        <span className="text-sm font-medium text-white border-b-2 border-indigo-500 pb-1">
                                            Recently viewed
                                        </span>
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
                                                    onDelete={() => deleteProjectById(project.id)}
                                                    onRename={(newName) => renameProjectById(project.id, newName)}
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
        </>
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
function ProjectCard({ project, onOpen, onDelete, onRename }: { project: any; onOpen: () => void; onDelete: () => void; onRename: (newName: string) => void }) {
    const [showMenu, setShowMenu] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [newName, setNewName] = useState(project.name || "");
    const timeAgo = getTimeAgo(project.updated_at || project.created_at);

    const handleRename = () => {
        if (newName.trim() && newName !== project.name) {
            onRename(newName.trim());
        }
        setIsRenaming(false);
    };

    return (
        <div className="flex-shrink-0 w-64 group relative">
            <button
                onClick={onOpen}
                className="w-full text-left"
            >
                {/* Thumbnail - redesigned with subtle gradient and project name */}
                <div className="relative aspect-[16/10] rounded-xl overflow-hidden border border-white/5 mb-3 group-hover:border-white/20 transition-colors bg-gradient-to-br from-[#1a1a2e] to-[#12121a]">
                    {project.thumbnail ? (
                        <img
                            src={project.thumbnail}
                            alt={project.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4">
                            <FolderOpen className="w-6 h-6 text-gray-600 mb-2" />
                            <span className="text-sm font-medium text-gray-400 text-center line-clamp-2">
                                {project.name || "Untitled"}
                            </span>
                        </div>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-sm font-medium">Open project</span>
                    </div>
                </div>

                {/* Info - simplified without large initials */}
                <div className="min-w-0">
                    {isRenaming ? (
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onBlur={handleRename}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleRename();
                                if (e.key === "Escape") { setIsRenaming(false); setNewName(project.name || ""); }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                            className="w-full text-sm font-medium text-white bg-white/10 border border-indigo-500/50 rounded px-2 py-1 focus:outline-none"
                        />
                    ) : (
                        <h3 className="text-sm font-medium text-white truncate group-hover:text-indigo-400 transition-colors">
                            {project.name || "Untitled"}
                        </h3>
                    )}
                    <p className="text-xs text-gray-500">{timeAgo}</p>
                </div>
            </button>

            {/* Menu button */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                    onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                    className="p-1.5 bg-black/50 backdrop-blur rounded-lg hover:bg-black/70 transition-colors"
                >
                    <MoreHorizontal className="w-4 h-4" />
                </button>

                {showMenu && (
                    <div className="absolute right-0 top-full mt-1 bg-[#1a1a24] border border-white/10 rounded-lg py-1 min-w-32 z-20">
                        <button
                            onClick={(e) => { e.stopPropagation(); onOpen(); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Open
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsRenaming(true); setShowMenu(false); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
                        >
                            <Edit2 className="w-4 h-4" />
                            Rename
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(); setShowMenu(false); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/5"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </button>
                    </div>
                )}
            </div>
        </div>
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
