import { Link, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import {
    Hammer, Sparkles, Zap, Shield, ArrowRight, Check, Code, Globe,
    Layers, Rocket, Star, Users, ChevronRight, Play, Github, Twitter,
    Cpu, Palette, Lock, Clock, Cloud, Smartphone
} from "lucide-react";

// Animated floating particles component
function FloatingParticles() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(50)].map((_, i) => (
                <div
                    key={i}
                    className="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 5}s`,
                        animationDuration: `${10 + Math.random() * 20}s`,
                    }}
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

export default function Landing() {
    const [prompt, setPrompt] = useState("");
    const [currentWord, setCurrentWord] = useState(0);
    const navigate = useNavigate();

    const rotatingWords = ["apps", "websites", "dashboards", "portfolios", "landing pages"];

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
        navigate("/auth/signup");
    };

    return (
        <div className="min-h-screen bg-[#030308] text-white overflow-x-hidden">
            {/* Animated backgrounds */}
            <div className="fixed inset-0 pointer-events-none">
                {/* Gradient orbs */}
                <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-600/30 rounded-full blur-[200px] animate-pulse" />
                <div className="absolute top-[20%] right-[-15%] w-[600px] h-[600px] bg-purple-600/25 rounded-full blur-[180px] animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute bottom-[-10%] left-[30%] w-[700px] h-[700px] bg-pink-600/20 rounded-full blur-[200px] animate-pulse" style={{ animationDelay: '2s' }} />
                <GridBackground />
                <FloatingParticles />
            </div>

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-[#030308]/60 backdrop-blur-2xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <Hammer className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-xl bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Forge</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-gray-400 hover:text-white transition-colors text-sm">Features</a>
                        <a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors text-sm">How it Works</a>
                        <a href="#templates" className="text-gray-400 hover:text-white transition-colors text-sm">Templates</a>
                        <a href="#pricing" className="text-gray-400 hover:text-white transition-colors text-sm">Pricing</a>
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
                    </div>
                </div>
            </header>

            {/* Hero Section - Expanded */}
            <section className="relative min-h-screen flex items-center justify-center px-6 pt-16">
                <div className="max-w-5xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-white/10 rounded-full text-sm mb-10 backdrop-blur-sm">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-gray-300">Now powered by Claude AI</span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>

                    {/* Headline with rotating words */}
                    <h1 className="text-6xl md:text-8xl font-bold mb-8 leading-[1.1] tracking-tight">
                        <span className="text-white">Build </span>
                        <span className="relative inline-block min-w-[280px] md:min-w-[400px]">
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

                    {/* Prompt Input - Bigger and more prominent */}
                    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto mb-12">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
                            <div className="relative bg-[#0a0a15]/90 border border-white/10 rounded-2xl p-2 flex items-center gap-3 backdrop-blur-xl">
                                <div className="pl-4">
                                    <Sparkles className="w-5 h-5 text-indigo-400" />
                                </div>
                                <input
                                    type="text"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Create a fitness tracking app with workout plans..."
                                    className="flex-1 bg-transparent py-4 text-lg text-white placeholder-gray-500 focus:outline-none"
                                />
                                <button
                                    type="submit"
                                    className="px-8 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400 rounded-xl font-semibold text-lg flex items-center gap-2 transition-all shadow-lg shadow-purple-500/25"
                                >
                                    <Zap className="w-5 h-5" />
                                    <span className="hidden sm:inline">Build Now</span>
                                </button>
                            </div>
                        </div>
                        <p className="text-gray-500 text-sm mt-4">No credit card required • Free forever tier available</p>
                    </form>

                    {/* Social Proof - Enhanced */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 border-2 border-[#030308] flex items-center justify-center text-xs font-bold" />
                                ))}
                            </div>
                            <div className="text-left">
                                <p className="text-white font-semibold">2,500+</p>
                                <p className="text-gray-500">Active builders</p>
                            </div>
                        </div>
                        <div className="hidden sm:block w-px h-12 bg-white/10" />
                        <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                ))}
                            </div>
                            <div className="text-left">
                                <p className="text-white font-semibold">4.9/5</p>
                                <p className="text-gray-500">From 500+ reviews</p>
                            </div>
                        </div>
                        <div className="hidden sm:block w-px h-12 bg-white/10" />
                        <div className="text-left">
                            <p className="text-white font-semibold">10,000+</p>
                            <p className="text-gray-500">Apps created</p>
                        </div>
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                    <div className="w-6 h-10 border-2 border-white/20 rounded-full flex items-start justify-center p-2">
                        <div className="w-1 h-2 bg-white/40 rounded-full animate-scroll" />
                    </div>
                </div>
            </section>

            {/* Tech Logos Bar */}
            <section className="py-12 px-6 border-t border-white/5">
                <div className="max-w-6xl mx-auto">
                    <p className="text-center text-gray-500 text-sm mb-8">Built with modern technologies you trust</p>
                    <div className="flex flex-wrap items-center justify-center gap-12 opacity-50">
                        {["React", "Tailwind", "Vite", "TypeScript", "Node.js"].map((tech) => (
                            <span key={tech} className="text-lg font-semibold text-gray-400">{tech}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Grid - Enhanced */}
            <section id="features" className="py-32 px-6 relative">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-20">
                        <span className="text-indigo-400 font-medium text-sm uppercase tracking-wider">Features</span>
                        <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">Everything you need to ship fast</h2>
                        <p className="text-gray-400 max-w-xl mx-auto text-lg">From idea to deploy in minutes, not weeks. Forge handles the complexity so you can focus on what matters.</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { icon: Sparkles, title: "AI-Powered Generation", desc: "Describe your app in plain English. Claude understands context and builds exactly what you need.", color: "from-indigo-500 to-purple-500" },
                            { icon: Zap, title: "Real-Time Preview", desc: "See changes instantly as the AI writes code. No refreshing, no waiting.", color: "from-yellow-500 to-orange-500" },
                            { icon: Code, title: "Production-Ready Code", desc: "Clean React + Tailwind code you can export, customize, and deploy anywhere.", color: "from-green-500 to-emerald-500" },
                            { icon: Layers, title: "Component Library", desc: "Modern UI components with smooth animations and delightful interactions.", color: "from-pink-500 to-rose-500" },
                            { icon: Globe, title: "One-Click Deploy", desc: "Deploy to your own domain with Vercel, Netlify, or any hosting provider.", color: "from-blue-500 to-cyan-500" },
                            { icon: Lock, title: "Secure & Private", desc: "Your projects are private by default. Export your code anytime, no lock-in.", color: "from-purple-500 to-pink-500" },
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

            {/* How It Works - Enhanced */}
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
                            { step: "01", title: "Describe Your Vision", desc: "Tell Forge what you want to build in plain English. Be as detailed or simple as you like.", icon: Sparkles },
                            { step: "02", title: "Watch AI Build", desc: "AI generates your app in real-time. See files created and preview updates instantly.", icon: Cpu },
                            { step: "03", title: "Iterate & Deploy", desc: "Refine with follow-up prompts. Export code or deploy with one click when ready.", icon: Rocket },
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

            {/* Template Gallery - Enhanced */}
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
                        <p className="text-gray-400 text-lg">Start free, scale as you grow</p>
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
                            <Link to="/auth/signup" className="block text-center py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium transition-all">
                                Start Starter
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
                            <Link to="/auth/signup" className="block text-center py-3.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 rounded-xl font-medium transition-all shadow-lg shadow-purple-500/25">
                                Start Pro Trial
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
                            <Link to="/auth/signup" className="block text-center py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium transition-all">
                                Contact Sales
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA - More impactful */}
            <section className="py-32 px-6 relative">
                <div className="max-w-4xl mx-auto text-center relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 rounded-3xl blur-3xl" />
                    <div className="relative bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-3xl p-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to build something amazing?</h2>
                        <p className="text-gray-400 mb-10 max-w-xl mx-auto text-lg">
                            Join thousands of builders shipping faster with Forge.
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
                            <span className="font-bold text-lg">Forge</span>
                        </div>
                        <div className="flex items-center gap-8 text-sm text-gray-500">
                            <a href="#" className="hover:text-white transition-colors">Terms</a>
                            <a href="#" className="hover:text-white transition-colors">Privacy</a>
                            <a href="#" className="hover:text-white transition-colors">Contact</a>
                            <a href="#" className="hover:text-white transition-colors">Blog</a>
                        </div>
                        <div className="flex items-center gap-4">
                            <a href="#" className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors">
                                <Twitter className="w-5 h-5 text-gray-400" />
                            </a>
                            <a href="#" className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors">
                                <Github className="w-5 h-5 text-gray-400" />
                            </a>
                        </div>
                    </div>
                    <div className="text-center mt-12 text-sm text-gray-600">
                        © 2025 Forge. All rights reserved.
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
                .animate-float { animation: float linear infinite; }
                .animate-scroll { animation: scroll 1.5s ease-in-out infinite; }
                .animate-gradient { 
                    background-size: 200% 200%;
                    animation: gradient 3s ease infinite;
                }
            `}</style>
        </div>
    );
}
