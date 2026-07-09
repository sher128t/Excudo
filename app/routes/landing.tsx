import { Link, useNavigate } from "react-router";
import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import type { Route } from "./+types/landing";
import type { ProjectStyle } from "~/lib/template";
import {
    Hammer, Sparkles, Zap, ArrowRight, Check, Globe,
    Rocket, Github, Twitter, Cpu, Lock, Menu, X,
    FileCode, Terminal, History, ChevronDown, LayoutTemplate, Box
} from "lucide-react";

const LandingScene = lazy(() => import("~/components/landing3d/LandingScene"));
const MiniBuildScene = lazy(() => import("~/components/landing3d/MiniBuildScene"));

export const meta: Route.MetaFunction = () => [
    { title: "Excudo - Build apps with AI, right in your browser" },
    { name: "description", content: "Describe your idea and watch AI build a working React app live in your browser. Edit, iterate, and publish to the web in minutes - no setup required." },
    { property: "og:title", content: "Excudo - Build apps with AI" },
    { property: "og:description", content: "Describe your idea and watch AI build a working app live in your browser. Publish to the web in one click." },
];

// Animated floating particles component (positions memoized so they don't
// jump on every re-render)
function FloatingParticles() {
    const particles = useMemo(
        () =>
            Array.from({ length: 50 }, () => ({
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${10 + Math.random() * 20}s`,
            })),
        []
    );

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((style, i) => (
                <div
                    key={i}
                    className="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
                    style={style}
                />
            ))}
        </div>
    );
}

// Animated grid background
function GridBackground() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '60px 60px',
                    maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)',
                    WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)',
                }}
            />
        </div>
    );
}

function CssSceneMock() {
    return (
        <div className="relative h-full bg-gradient-to-b from-[#0b0b1e] to-black overflow-hidden">
            <div
                className="absolute inset-0 opacity-60"
                style={{
                    backgroundImage: "radial-gradient(1px 1px at 20% 30%, white, transparent), radial-gradient(1px 1px at 60% 15%, white, transparent), radial-gradient(1.5px 1.5px at 80% 40%, white, transparent), radial-gradient(1px 1px at 35% 70%, white, transparent), radial-gradient(1px 1px at 70% 80%, white, transparent), radial-gradient(1.5px 1.5px at 10% 85%, white, transparent)",
                }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                    <div className="absolute -inset-8 bg-indigo-500/40 rounded-full blur-3xl" />
                    <div
                        className="relative w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 shadow-2xl shadow-indigo-500/50 animate-float-slow"
                        style={{ transform: "rotate(12deg)" }}
                    />
                </div>
            </div>
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <div className="w-14 h-2.5 rounded bg-white/70" />
                <div className="flex gap-2">
                    <div className="w-8 h-2 rounded bg-white/20" />
                    <div className="w-8 h-2 rounded bg-white/20" />
                </div>
            </div>
            <div className="absolute bottom-5 left-0 right-0 flex flex-col items-center gap-2.5 px-6">
                <div className="w-1/2 h-3.5 rounded bg-white/80" />
                <div className="w-1/3 h-2 rounded bg-white/30" />
                <div className="w-24 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 mt-1" />
            </div>
        </div>
    );
}

// Animated "watch it build" product demo mockup
function BuildDemo({ show3d }: { show3d: boolean }) {
    const steps = [
        { icon: FileCode, text: "createFile src/components/Scene.jsx" },
        { icon: FileCode, text: "createFile src/components/FloatingIsland.jsx" },
        { icon: FileCode, text: "createFile src/components/Overlay.jsx" },
        { icon: FileCode, text: "updateFile src/App.jsx" },
        { icon: Terminal, text: "Dev server running - preview ready" },
    ];

    return (
        <div className="relative max-w-5xl mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-pink-500/30 rounded-3xl blur-2xl" />
            <div className="relative bg-[#0a0a15]/95 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
                {/* Window chrome */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/60" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                        <div className="w-3 h-3 rounded-full bg-green-500/60" />
                    </div>
                    <span className="text-xs text-gray-500 ml-3">excudo.app/editor</span>
                </div>
                <div className="grid md:grid-cols-5">
                    {/* Chat side */}
                    <div className="md:col-span-2 p-5 border-b md:border-b-0 md:border-r border-white/5 text-left">
                        <div className="flex justify-end mb-4">
                            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl px-3.5 py-2 text-sm text-white max-w-[90%]">
                                Build a landing page for my coffee shop
                            </div>
                        </div>
                        <div className="space-y-2">
                            {steps.map((step, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-2.5 px-3 py-2 bg-white/[0.03] border border-white/5 rounded-lg text-xs text-gray-400 opacity-0 animate-step-in"
                                    style={{ animationDelay: `${0.6 + i * 0.7}s` }}
                                >
                                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                        <Check className="w-2.5 h-2.5 text-emerald-400" />
                                    </span>
                                    <step.icon className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                                    <span className="truncate font-mono">{step.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Preview side */}
                    <div className="md:col-span-3 p-5">
                        <div
                            className="h-64 md:h-72 rounded-xl overflow-hidden border border-white/10 opacity-0 animate-step-in"
                            style={{ animationDelay: "4s" }}
                        >
                            {show3d ? (
                                <Suspense fallback={<CssSceneMock />}>
                                    <MiniBuildScene />
                                </Suspense>
                            ) : (
                                <CssSceneMock />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// FAQ item with expand/collapse
function FaqItem({ question, answer }: { question: string; answer: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border border-white/10 rounded-2xl bg-white/[0.02] overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-white/[0.02] transition-colors"
            >
                <span className="font-medium text-white">{question}</span>
                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ml-4 ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className="px-6 pb-5 text-gray-400 text-sm leading-relaxed">{answer}</div>
            )}
        </div>
    );
}

export default function Landing() {
    const [prompt, setPrompt] = useState("");
    const [currentWord, setCurrentWord] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [projectStyle, setProjectStyle] = useState<ProjectStyle>("immersive3d");
    const [show3d, setShow3d] = useState(false);
    const navigate = useNavigate();

    const rotatingWords = ["3D websites", "apps", "portfolios", "product showcases", "dashboards"];

    useEffect(() => {
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setShow3d(true);
        }
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentWord((prev) => (prev + 1) % rotatingWords.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;
        sessionStorage.setItem("landingPrompt", prompt);
        sessionStorage.setItem("landingProjectStyle", projectStyle);
        navigate("/auth/signup");
    };

    const navLinks = [
        { href: "#demo", label: "Demo" },
        { href: "#features", label: "Features" },
        { href: "#how-it-works", label: "How it Works" },
        { href: "#pricing", label: "Pricing" },
        { href: "#faq", label: "FAQ" },
    ];

    return (
        <div className="min-h-screen bg-[#030308] text-white overflow-x-hidden">
            {/* Animated backgrounds */}
            <div className="fixed inset-0 pointer-events-none">
                {/* Gradient orbs */}
                <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-600/30 rounded-full blur-[200px] animate-pulse" />
                <div className="absolute top-[20%] right-[-15%] w-[600px] h-[600px] bg-purple-600/25 rounded-full blur-[180px] animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute bottom-[-10%] left-[30%] w-[700px] h-[700px] bg-pink-600/20 rounded-full blur-[200px] animate-pulse" style={{ animationDelay: '2s' }} />
                {!show3d && <GridBackground />}
                {!show3d && <FloatingParticles />}
            </div>

            {show3d && (
                <Suspense fallback={null}>
                    <LandingScene />
                </Suspense>
            )}
            {show3d && <div className="fixed inset-0 pointer-events-none bg-[#030308]/10" />}

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-[#030308]/60 backdrop-blur-2xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <Hammer className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-xl bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Excudo</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map(link => (
                            <a key={link.href} href={link.href} className="text-gray-400 hover:text-white transition-colors text-sm">{link.label}</a>
                        ))}
                    </div>
                    <div className="flex items-center gap-3">
                        <Link to="/auth/login" className="text-gray-400 hover:text-white transition-colors text-sm hidden sm:block">
                            Sign In
                        </Link>
                        <Link
                            to="/auth/signup"
                            className="px-5 py-2.5 bg-white text-black hover:bg-gray-100 rounded-full font-medium text-sm transition-all shadow-lg shadow-white/10"
                        >
                            Get Started Free
                        </Link>
                        {/* Mobile menu toggle */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 hover:bg-white/5 rounded-lg transition-colors"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
                {/* Mobile nav drawer */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-white/5 bg-[#030308]/95 backdrop-blur-2xl px-6 py-4 space-y-1">
                        {navLinks.map(link => (
                            <a
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block px-3 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm"
                            >
                                {link.label}
                            </a>
                        ))}
                        <Link
                            to="/auth/login"
                            className="block px-3 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm"
                        >
                            Sign In
                        </Link>
                    </div>
                )}
            </header>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center px-6 pt-24 pb-16">
                <div className="max-w-5xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-white/10 rounded-full text-sm mb-10 backdrop-blur-sm">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-gray-300">From idea to live app in minutes</span>
                    </div>

                    {/* Headline with rotating words */}
                    <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold mb-8 leading-[1.1] tracking-tight">
                        <span className="text-white">Build </span>
                        <span className="relative inline-block">
                            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
                                {rotatingWords[currentWord]}
                            </span>
                        </span>
                        <br />
                        <span className="text-white">with just words</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                        Describe your vision. Watch AI build it live.
                        <span className="text-white font-medium"> No coding required.</span>
                    </p>

                    {/* Prompt Input */}
                    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto mb-12">
                        <div className="flex justify-center mb-4">
                            <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-1 backdrop-blur-xl">
                                <button
                                    type="button"
                                    onClick={() => setProjectStyle("traditional")}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${projectStyle === "traditional"
                                        ? "bg-white text-black"
                                        : "text-gray-400 hover:text-white"
                                        }`}
                                >
                                    <LayoutTemplate className="w-4 h-4" />
                                    Classic
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setProjectStyle("immersive3d")}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${projectStyle === "immersive3d"
                                        ? "bg-white text-black"
                                        : "text-gray-400 hover:text-white"
                                        }`}
                                >
                                    <Box className="w-4 h-4" />
                                    3D
                                </button>
                            </div>
                        </div>
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
                            <div className="relative bg-[#0a0a15]/90 border border-white/10 rounded-2xl p-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 backdrop-blur-xl">
                                <div className="hidden sm:block pl-4">
                                    <Sparkles className="w-5 h-5 text-indigo-400" />
                                </div>
                                <input
                                    type="text"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder={projectStyle === "immersive3d"
                                        ? "Create an interactive 3D portfolio with scroll effects..."
                                        : "Create a fitness tracking app with workout plans..."
                                    }
                                    className="flex-1 bg-transparent px-4 sm:px-0 py-4 text-base sm:text-lg text-white placeholder-gray-500 focus:outline-none min-w-0"
                                />
                                <button
                                    type="submit"
                                    className="px-6 sm:px-8 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400 rounded-xl font-semibold text-base sm:text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/25"
                                >
                                    <Zap className="w-5 h-5" />
                                    <span>Build Now</span>
                                </button>
                            </div>
                        </div>
                        <p className="text-gray-500 text-sm mt-4">No credit card required • Free tier included</p>
                    </form>

                    {/* Honest product highlights instead of fabricated stats */}
                    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-400">
                        <span className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Powered by Claude AI</span>
                        <span className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Runs entirely in your browser</span>
                        <span className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Export or publish anytime</span>
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden sm:block">
                    <div className="w-6 h-10 border-2 border-white/20 rounded-full flex items-start justify-center p-2">
                        <div className="w-1 h-2 bg-white/40 rounded-full animate-scroll" />
                    </div>
                </div>
            </section>

            {/* Product Demo */}
            <section id="demo" className="py-24 px-6 relative">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-14">
                        <span className="text-indigo-400 font-medium text-sm uppercase tracking-wider">See it in action</span>
                        <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">Watch your idea become a live experience</h2>
                        <p className="text-gray-400 max-w-xl mx-auto text-lg">Type a prompt, watch the AI create every file, and see your site running live - all in one screen.</p>
                    </div>
                    <BuildDemo show3d={show3d} />
                </div>
            </section>

            {/* Tech Logos Bar */}
            <section className="py-12 px-6 border-t border-white/5">
                <div className="max-w-6xl mx-auto">
                    <p className="text-center text-gray-500 text-sm mb-8">Apps are built on a modern, portable stack</p>
                    <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-50">
                        {["React", "Tailwind", "Vite", "Node.js", "Netlify"].map((tech) => (
                            <span key={tech} className="text-lg font-semibold text-gray-400">{tech}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-32 px-6 relative">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-20">
                        <span className="text-indigo-400 font-medium text-sm uppercase tracking-wider">Features</span>
                        <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">Everything you need to ship fast</h2>
                        <p className="text-gray-400 max-w-xl mx-auto text-lg">From idea to deploy in minutes, not weeks. Excudo handles the complexity so you can focus on what matters.</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { icon: Sparkles, title: "AI-Powered Generation", desc: "Describe your app in plain English. Claude understands context and builds exactly what you need.", color: "from-indigo-500 to-purple-500" },
                            { icon: Zap, title: "Real-Time Preview", desc: "See changes instantly as the AI writes code. The app runs live in your browser as it's built.", color: "from-yellow-500 to-orange-500" },
                            { icon: Cpu, title: "AI Error Fixing", desc: "Build errors are detected automatically. One click and the AI finds the root cause and fixes it.", color: "from-red-500 to-orange-500" },
                            { icon: History, title: "Version History", desc: "Every AI edit is snapshotted. Roll back to any previous version of your project instantly.", color: "from-pink-500 to-rose-500" },
                            { icon: Globe, title: "One-Click Publish", desc: "Publish your app to a live URL in seconds, straight from the editor. Share it with anyone.", color: "from-blue-500 to-cyan-500" },
                            { icon: Lock, title: "Your Code, No Lock-In", desc: "Projects are private by default. Download clean React + Tailwind code as a ZIP anytime.", color: "from-purple-500 to-pink-500" },
                        ].map((feature, i) => (
                            <div key={i} className="group p-8 bg-gradient-to-br from-white/5 to-transparent border border-white/5 rounded-3xl hover:border-white/20 transition-all duration-500 hover:-translate-y-1">
                                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                                    <feature.icon className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-32 px-6 relative">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-20">
                        <span className="text-indigo-400 font-medium text-sm uppercase tracking-wider">Process</span>
                        <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">Three steps to launch</h2>
                        <p className="text-gray-400 text-lg">From idea to live app in under a minute</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 relative">
                        {/* Connection line */}
                        <div className="hidden md:block absolute top-16 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-30" />

                        {[
                            { step: "01", title: "Describe Your Vision", desc: "Tell Excudo what you want to build in plain English. Be as detailed or simple as you like.", icon: Sparkles },
                            { step: "02", title: "Watch AI Build", desc: "AI generates your app in real-time. See files created and preview updates instantly.", icon: Cpu },
                            { step: "03", title: "Iterate & Publish", desc: "Refine with follow-up prompts. Publish to a live URL or export the code when ready.", icon: Rocket },
                        ].map((item, i) => (
                            <div key={i} className="relative text-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/30">
                                    <item.icon className="w-8 h-8 text-white" />
                                </div>
                                <div className="text-6xl font-bold bg-gradient-to-b from-white/20 to-transparent bg-clip-text text-transparent mb-4">{item.step}</div>
                                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                                <p className="text-gray-400">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Template Gallery */}
            <section id="templates" className="py-32 px-6 relative">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-20">
                        <span className="text-indigo-400 font-medium text-sm uppercase tracking-wider">Templates</span>
                        <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">Start with inspiration</h2>
                        <p className="text-gray-400 text-lg">Or create something completely new from scratch</p>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { name: "SaaS Landing", desc: "Modern startup page", colors: "from-blue-600 to-cyan-500" },
                            { name: "E-commerce", desc: "Online store", colors: "from-pink-600 to-rose-500" },
                            { name: "Portfolio", desc: "Personal showcase", colors: "from-purple-600 to-violet-500" },
                            { name: "Dashboard", desc: "Admin interface", colors: "from-green-600 to-emerald-500" },
                        ].map((template, i) => (
                            <Link
                                key={i}
                                to="/auth/signup"
                                className="group relative h-56 rounded-3xl overflow-hidden"
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${template.colors} opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105`} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute bottom-6 left-6 right-6">
                                    <p className="font-semibold text-lg text-white mb-1">{template.name}</p>
                                    <p className="text-sm text-white/70">{template.desc}</p>
                                </div>
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowRight className="w-5 h-5 text-white" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing - All 4 tiers */}
            <section id="pricing" className="py-32 px-6 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <span className="text-indigo-400 font-medium text-sm uppercase tracking-wider">Pricing</span>
                        <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">Simple, transparent pricing</h2>
                        <p className="text-gray-400 text-lg">Start free, scale as you grow. Paid plans are coming soon.</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Free */}
                        <div className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:border-white/20 transition-all">
                            <h3 className="text-xl font-semibold mb-2">Free</h3>
                            <p className="text-gray-400 text-sm mb-6">Get started</p>
                            <div className="text-4xl font-bold mb-6">$0<span className="text-lg text-gray-500 font-normal">/mo</span></div>
                            <ul className="space-y-3 mb-8">
                                {["3 projects", "5 daily credits", "Community support", "Export code"].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                                        <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link to="/auth/signup" className="block text-center py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium transition-all">
                                Get Started
                            </Link>
                        </div>
                        {/* Starter */}
                        <div className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:border-white/20 transition-all">
                            <h3 className="text-xl font-semibold mb-2">Starter</h3>
                            <p className="text-gray-400 text-sm mb-6">Indie developers</p>
                            <div className="text-4xl font-bold mb-6">$20<span className="text-lg text-gray-500 font-normal">/mo</span></div>
                            <ul className="space-y-3 mb-8">
                                {["10 projects", "50 daily credits", "Email support", "Private projects", "Custom domains"].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                                        <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link to="/pricing" className="block text-center py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium transition-all">
                                Coming Soon
                            </Link>
                        </div>
                        {/* Pro - Highlighted */}
                        <div className="relative p-8 bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-pink-600/20 border border-indigo-500/30 rounded-3xl">
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full text-xs font-semibold shadow-lg">
                                Most Popular
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Pro</h3>
                            <p className="text-gray-400 text-sm mb-6">Serious builders</p>
                            <div className="text-4xl font-bold mb-6">$50<span className="text-lg text-gray-500 font-normal">/mo</span></div>
                            <ul className="space-y-3 mb-8">
                                {["50 projects", "150 daily credits", "Priority support", "Remove branding", "Team sharing", "Deploy integrations"].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                                        <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link to="/pricing" className="block text-center py-3.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 rounded-xl font-medium transition-all shadow-lg shadow-purple-500/25">
                                Coming Soon
                            </Link>
                        </div>
                        {/* Teams */}
                        <div className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:border-white/20 transition-all">
                            <h3 className="text-xl font-semibold mb-2">Teams</h3>
                            <p className="text-gray-400 text-sm mb-6">Organizations</p>
                            <div className="text-4xl font-bold mb-6">$100<span className="text-lg text-gray-500 font-normal">/mo</span></div>
                            <ul className="space-y-3 mb-8">
                                {["200 projects", "300 daily credits", "Dedicated support", "SSO", "Admin controls", "Custom integrations"].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                                        <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link to="/pricing" className="block text-center py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium transition-all">
                                Coming Soon
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="py-32 px-6 relative">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-14">
                        <span className="text-indigo-400 font-medium text-sm uppercase tracking-wider">FAQ</span>
                        <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">Common questions</h2>
                    </div>
                    <div className="space-y-3">
                        <FaqItem
                            question="Do I need to know how to code?"
                            answer="No. You describe what you want in plain English and the AI builds it. If you do know code, you can open the built-in editor and tweak anything yourself - it's a full Monaco editor with a terminal."
                        />
                        <FaqItem
                            question="What kind of apps can I build?"
                            answer="Excudo builds React + Tailwind web apps: landing pages, portfolios, dashboards, e-commerce fronts, interactive tools and immersive 3D experiences. Apps run live in your browser as they're generated."
                        />
                        <FaqItem
                            question="Who owns the code?"
                            answer="You do. Download your full project as a ZIP at any time and run it anywhere - it's standard React + Vite + Tailwind with no proprietary dependencies or lock-in."
                        />
                        <FaqItem
                            question="How does publishing work?"
                            answer="Click Publish in the editor and your app is built and deployed to a free live URL in seconds. Republish anytime to push updates."
                        />
                        <FaqItem
                            question="What happens if the AI makes a mistake?"
                            answer="Build errors are detected automatically and you can fix them with one click - the AI reads the error, finds the cause, and patches the code. Every AI edit is also snapshotted, so you can roll back to any earlier version."
                        />
                        <FaqItem
                            question="Is there really a free plan?"
                            answer="Yes - 3 projects and 5 AI generations per day, free, no credit card. Paid plans with higher limits are coming soon."
                        />
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32 px-6 relative">
                <div className="max-w-4xl mx-auto text-center relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 rounded-3xl blur-3xl" />
                    <div className="relative bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-3xl p-10 md:p-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to build something amazing?</h2>
                        <p className="text-gray-400 mb-10 max-w-xl mx-auto text-lg">
                            Describe your idea and watch it come to life.
                            Start for free, no credit card required.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                to="/auth/signup"
                                className="px-10 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 rounded-full font-semibold text-lg transition-all shadow-lg shadow-purple-500/25 flex items-center gap-2"
                            >
                                Start Building Free
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                to="/auth/login"
                                className="px-10 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-semibold text-lg transition-all"
                            >
                                Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-16 px-6 border-t border-white/5">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                                <Hammer className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-lg">Excudo</span>
                        </div>
                        <div className="flex items-center gap-8 text-sm text-gray-500">
                            <a href="#features" className="hover:text-white transition-colors">Features</a>
                            <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
                            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
                        </div>
                        <div className="flex items-center gap-4">
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors" aria-label="Twitter">
                                <Twitter className="w-5 h-5 text-gray-400" />
                            </a>
                            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors" aria-label="GitHub">
                                <Github className="w-5 h-5 text-gray-400" />
                            </a>
                        </div>
                    </div>
                    <div className="text-center mt-12 text-sm text-gray-600">
                        © {new Date().getFullYear()} Excudo. All rights reserved.
                    </div>
                </div>
            </footer>

            {/* Custom CSS for animations */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
                    10% { opacity: 0.5; }
                    50% { transform: translateY(-100px) translateX(20px); opacity: 0.3; }
                    90% { opacity: 0.1; }
                }
                @keyframes scroll {
                    0%, 100% { transform: translateY(0); opacity: 1; }
                    50% { transform: translateY(4px); opacity: 0.5; }
                }
                @keyframes gradient {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                @keyframes step-in {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0) rotate(12deg); }
                    50% { transform: translateY(-12px) rotate(18deg); }
                }
                .animate-float { animation: float linear infinite; }
                .animate-float-slow { animation: float-slow 5s ease-in-out infinite; }
                .animate-scroll { animation: scroll 1.5s ease-in-out infinite; }
                .animate-gradient { 
                    background-size: 200% 200%;
                    animation: gradient 3s ease infinite;
                }
                .animate-step-in { animation: step-in 0.5s ease-out forwards; }
            `}</style>
        </div>
    );
}
