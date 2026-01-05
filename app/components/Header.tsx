import { Hammer, Settings, FolderPlus, Sparkles } from "lucide-react";

export function Header() {
    return (
        <header className="h-12 bg-gradient-to-r from-[#0a0a0f] to-[#12121a] border-b border-[#1e1e2e] flex items-center justify-between px-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Hammer className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        Forge
                    </span>
                </div>
                <span className="text-xs text-gray-500 border-l border-gray-700 pl-3 ml-1">
                    AI-Powered App Builder
                </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-white/5 rounded-lg transition-colors group">
                    <FolderPlus className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                </button>
                <button className="p-2 hover:bg-white/5 rounded-lg transition-colors group">
                    <Settings className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                </button>
                <div className="ml-2 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Pro</span>
                </div>
            </div>
        </header>
    );
}
