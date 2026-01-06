import { useState, useRef, useEffect } from "react";
import { useAuth } from "~/context/AuthContext";
import { User, LogOut, Settings, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router";

export function UserMenu() {
    const { user, profile, signOut } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    if (!user) {
        return (
            <button
                onClick={() => navigate("/auth/login")}
                className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg text-sm font-medium transition-all"
            >
                Sign In
            </button>
        );
    }

    const handleSignOut = async () => {
        await signOut();
        navigate("/auth/login");
    };

    const tierColors: Record<string, string> = {
        free: "text-gray-400",
        pro: "text-indigo-400",
        enterprise: "text-purple-400",
        admin: "text-yellow-400",
    };

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/5 rounded-lg transition-colors"
            >
                <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                </div>
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-[#12121a] border border-[#1e1e2e] rounded-xl shadow-xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-[#1e1e2e]">
                        <p className="text-sm text-white truncate">{user.email}</p>
                        <p className={`text-xs capitalize ${tierColors[profile?.tier || "free"]}`}>
                            {profile?.tier || "free"} Plan
                        </p>
                    </div>

                    <div className="py-1">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                // Could navigate to settings
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            <Settings className="w-4 h-4" />
                            Settings
                        </button>
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
