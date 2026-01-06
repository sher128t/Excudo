import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";
import {
    Hammer, Home, Search, FolderOpen, Clock, Star, Users, Compass,
    BookOpen, Sparkles, Plus, ArrowRight, Zap, Loader2
} from "lucide-react";
import { CreditsDisplay } from "~/components/CreditsDisplay";
import { UserMenu } from "~/components/UserMenu";

export default function Dashboard() {
    const { user, profile, loading } = useAuth();
    const navigate = useNavigate();
    const [prompt, setPrompt] = useState("");

    // Redirect to landing if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            navigate("/landing");
        }
    }, [user, loading, navigate]);

    const handleStartProject = (e: React.FormEvent) => {
        e.preventDefault();
        if (prompt.trim()) {
            // Store prompt for use in editor, then navigate
            sessionStorage.setItem("initialPrompt", prompt);
            navigate("/editor");
        }
    };

    if (loading) {
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
                    <SidebarItem icon={Clock} label="Recent" />
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
                {/* Hero Area with gradient */}
                <div className="relative flex-1 flex flex-col items-center justify-center p-8 overflow-hidden">
                    {/* Gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 via-purple-900/10 to-transparent" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-r from-indigo-600/20 to-purple-600/20 blur-3xl rounded-full" />

                    {/* Content */}
                    <div className="relative z-10 w-full max-w-2xl text-center">
                        <h1 className="text-4xl font-bold mb-8">
                            Let's build something, <span className="text-indigo-400">{profile?.email?.split("@")[0] || "Builder"}</span>
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
                                />
                                <div className="flex items-center gap-2 pr-2">
                                    <button type="button" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white border border-[#1e1e2e] rounded-lg hover:bg-white/5">
                                        <Plus className="w-4 h-4 inline mr-1" />
                                        Attach
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!prompt.trim()}
                                        className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg disabled:opacity-50"
                                    >
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </form>

                        {/* Quick Actions */}
                        <div className="flex items-center justify-center gap-3 mt-6">
                            <button
                                onClick={() => navigate("/editor")}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-[#1e1e2e] rounded-lg text-sm flex items-center gap-2"
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
                                <button className="text-sm font-medium text-white border-b-2 border-indigo-500 pb-1">
                                    Recently Viewed
                                </button>
                                <button className="text-sm text-gray-400 hover:text-white pb-1">
                                    My projects
                                </button>
                                <button className="text-sm text-gray-400 hover:text-white pb-1">
                                    Templates
                                </button>
                            </div>
                            <button className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                                Browse all
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Empty State */}
                        <div className="flex items-center justify-center py-12 text-gray-500">
                            <p>No projects yet. Start building something amazing!</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function SidebarItem({ icon: Icon, label, active }: { icon: any; label: string; active?: boolean }) {
    return (
        <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${active
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}>
            <Icon className="w-4 h-4" />
            <span>{label}</span>
        </button>
    );
}
