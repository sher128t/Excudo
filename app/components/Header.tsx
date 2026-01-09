import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import {
    Hammer, Settings, ChevronDown, Code, Terminal as TerminalIcon,
    BarChart3, Cloud, Palette, Shield, Zap, Share2,
    Maximize2, Minimize2, Eye, EyeOff, Home
} from "lucide-react";
import { CreditsDisplay } from "./CreditsDisplay";
import { UserMenu } from "./UserMenu";

interface HeaderProps {
    activeTab: "preview" | "code" | "terminal";
    onTabChange: (tab: "preview" | "code" | "terminal") => void;
    showPreview: boolean;
    onTogglePreview: () => void;
}

interface DropdownProps {
    label: string;
    icon: React.ReactNode;
    items: { label: string; action?: () => void; disabled?: boolean }[];
}

function Dropdown({ label, icon, items }: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-white/5 rounded-md text-sm text-gray-400 hover:text-white transition-colors"
            >
                {icon}
                <span>{label}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-[#12121a] border border-[#1e1e2e] rounded-lg shadow-xl py-1 z-50">
                    {items.map((item, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                item.action?.();
                                setIsOpen(false);
                            }}
                            disabled={item.disabled}
                            className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export function Header({ activeTab, onTabChange, showPreview, onTogglePreview }: HeaderProps) {
    return (
        <header className="h-12 bg-[#0a0a0f] border-b border-[#1e1e2e] flex items-center justify-between px-4">
            {/* Logo and Home */}
            <div className="flex items-center gap-4">
                <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Hammer className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        Forge
                    </span>
                </Link>

                {/* Back to Dashboard */}
                <Link
                    to="/"
                    className="flex items-center gap-1.5 px-2 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                >
                    <Home className="w-4 h-4" />
                    <span>Dashboard</span>
                </Link>

                {/* Primary Toggle */}
                <div className="flex items-center bg-[#12121a] rounded-lg p-1 border border-[#1e1e2e]">
                    <button
                        onClick={onTogglePreview}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${showPreview
                            ? "bg-indigo-500/20 text-indigo-400"
                            : "text-gray-400 hover:text-white"
                            }`}
                    >
                        <Eye className="w-4 h-4" />
                        <span>Preview</span>
                    </button>
                </div>
            </div>

            {/* Center - Tab Menus */}
            <div className="flex items-center gap-1">
                <Dropdown
                    label="Code"
                    icon={<Code className="w-4 h-4" />}
                    items={[
                        { label: "View Source Code", action: () => onTabChange("code") },
                        { label: "Download Project", disabled: true },
                        { label: "Export to GitHub", disabled: true },
                    ]}
                />
                <Dropdown
                    label="Terminal"
                    icon={<TerminalIcon className="w-4 h-4" />}
                    items={[
                        { label: "Open Terminal", action: () => onTabChange("terminal") },
                        { label: "Run Command", disabled: true },
                    ]}
                />
                <Dropdown
                    label="Design"
                    icon={<Palette className="w-4 h-4" />}
                    items={[
                        { label: "Change Theme", disabled: true },
                        { label: "Edit Colors", disabled: true },
                        { label: "Typography", disabled: true },
                    ]}
                />
                <Dropdown
                    label="Analytics"
                    icon={<BarChart3 className="w-4 h-4" />}
                    items={[
                        { label: "Page Views", disabled: true },
                        { label: "Performance", disabled: true },
                    ]}
                />
            </div>

            {/* Right - Actions */}
            <div className="flex items-center gap-3">
                <CreditsDisplay />
                <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 rounded-lg text-sm text-gray-400 hover:text-white transition-colors">
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                </button>
                <UserMenu />
            </div>
        </header>
    );
}
