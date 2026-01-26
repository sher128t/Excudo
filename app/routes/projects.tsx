import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";
import { useProject } from "~/context/ProjectContext";
import {
    Hammer, Search, FolderOpen, Plus, ArrowLeft, Loader2,
    Grid3X3, List, MoreHorizontal, Trash2, Pencil, ExternalLink
} from "lucide-react";
import { UserMenu } from "~/components/UserMenu";

export default function Projects() {
    const { user, loading: authLoading } = useAuth();
    const { projects, loading: projectsLoading, deleteProjectById, createNewProject } = useProject();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [sortBy, setSortBy] = useState<"edited" | "created" | "name">("edited");
    const [creatingProject, setCreatingProject] = useState(false);

    // Redirect to landing if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/landing");
        }
    }, [user, authLoading, navigate]);

    const handleOpenProject = (projectId: string) => {
        sessionStorage.setItem("currentProjectId", projectId);
        navigate("/editor");
    };

    const handleCreateProject = async () => {
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

    // Filter and sort projects
    const filteredProjects = projects
        .filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === "edited") {
                return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
            }
            if (sortBy === "created") {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
            return (a.name || "").localeCompare(b.name || "");
        });

    if (authLoading) {
        return (
            <div className="h-screen w-screen bg-[#0a0a0f] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="h-screen w-screen bg-[#0a0a0f] text-white flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <div className="flex items-center gap-4">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-pink-600 rounded-lg flex items-center justify-center">
                            <Hammer className="w-4 h-4 text-white" />
                        </div>
                    </Link>
                    <div className="flex items-center gap-2 text-gray-400">
                        <Link to="/" className="hover:text-white transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <h1 className="text-lg font-semibold text-white">Projects</h1>
                        <span className="text-sm text-gray-500">•••</span>
                    </div>
                </div>
                <UserMenu />
            </header>

            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-4">
                {/* Search */}
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search projects..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/20"
                    />
                </div>

                {/* Filters and view toggle */}
                <div className="flex items-center gap-3">
                    {/* Sort dropdown */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20 appearance-none cursor-pointer"
                    >
                        <option value="edited">Last edited</option>
                        <option value="created">Date created</option>
                        <option value="name">Name</option>
                    </select>

                    {/* View toggle */}
                    <div className="flex bg-white/5 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-1.5 rounded ${viewMode === "grid" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}
                        >
                            <Grid3X3 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-1.5 rounded ${viewMode === "list" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Projects Grid/List */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
                {projectsLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    </div>
                ) : (
                    <div className={viewMode === "grid"
                        ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                        : "space-y-2"
                    }>
                        {/* Create new project card */}
                        <button
                            onClick={handleCreateProject}
                            disabled={creatingProject}
                            className={viewMode === "grid"
                                ? "aspect-[4/3] bg-white/5 border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-white/10 hover:border-white/20 transition-colors group"
                                : "w-full flex items-center gap-4 px-4 py-3 bg-white/5 border border-dashed border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-colors"
                            }
                        >
                            {creatingProject ? (
                                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                            ) : (
                                <>
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                        <Plus className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <span className="text-sm text-gray-400">Create new project</span>
                                </>
                            )}
                        </button>

                        {/* Project cards */}
                        {filteredProjects.map((project) => (
                            viewMode === "grid" ? (
                                <ProjectGridCard
                                    key={project.id}
                                    project={project}
                                    onOpen={() => handleOpenProject(project.id)}
                                    onDelete={() => deleteProjectById(project.id)}
                                />
                            ) : (
                                <ProjectListItem
                                    key={project.id}
                                    project={project}
                                    onOpen={() => handleOpenProject(project.id)}
                                    onDelete={() => deleteProjectById(project.id)}
                                />
                            )
                        ))}
                    </div>
                )}

                {!projectsLoading && filteredProjects.length === 0 && searchQuery && (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                        <Search className="w-12 h-12 mb-4 opacity-50" />
                        <p>No projects found matching "{searchQuery}"</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function ProjectGridCard({ project, onOpen, onDelete }: { project: any; onOpen: () => void; onDelete: () => void }) {
    const [showMenu, setShowMenu] = useState(false);
    const timeAgo = getTimeAgo(project.updated_at || project.created_at);

    return (
        <div className="group relative">
            <button onClick={onOpen} className="w-full text-left">
                {/* Thumbnail */}
                <div className="aspect-[4/3] bg-[#1a1a24] rounded-xl overflow-hidden border border-white/5 mb-3 group-hover:border-white/20 transition-colors relative">
                    {project.thumbnail ? (
                        <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-600/20 to-purple-600/20">
                            <FolderOpen className="w-10 h-10 text-gray-600" />
                        </div>
                    )}
                    {/* Published badge example */}
                    {project.published && (
                        <span className="absolute bottom-2 left-2 text-xs bg-emerald-500 text-white px-2 py-0.5 rounded">
                            Published
                        </span>
                    )}
                </div>

                {/* Info */}
                <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {(project.name || "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-medium text-white truncate">{project.name || "Untitled"}</h3>
                        <p className="text-xs text-gray-500">Edited {timeAgo}</p>
                    </div>
                </div>
            </button>

            {/* Menu button */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                    className="p-1.5 bg-black/50 backdrop-blur rounded-lg hover:bg-black/70 transition-colors"
                >
                    <MoreHorizontal className="w-4 h-4" />
                </button>

                {showMenu && (
                    <div className="absolute right-0 top-full mt-1 bg-[#1a1a24] border border-white/10 rounded-lg py-1 min-w-32 z-10">
                        <button
                            onClick={(e) => { e.stopPropagation(); onOpen(); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Open
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

function ProjectListItem({ project, onOpen, onDelete }: { project: any; onOpen: () => void; onDelete: () => void }) {
    const timeAgo = getTimeAgo(project.updated_at || project.created_at);

    return (
        <div className="flex items-center gap-4 px-4 py-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/5 hover:border-white/10 transition-colors group">
            {/* Thumbnail */}
            <div className="w-16 h-12 bg-[#1a1a24] rounded-lg overflow-hidden flex-shrink-0">
                {project.thumbnail ? (
                    <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-600/20 to-purple-600/20">
                        <FolderOpen className="w-5 h-5 text-gray-600" />
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-white truncate">{project.name || "Untitled"}</h3>
                <p className="text-xs text-gray-500">Edited {timeAgo}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={onOpen} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                </button>
                <button onClick={onDelete} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4 text-red-400" />
                </button>
            </div>
        </div>
    );
}

function getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)} weeks ago`;
    return `${Math.floor(seconds / 2592000)} months ago`;
}
