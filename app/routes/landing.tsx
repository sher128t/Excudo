import { Link, useNavigate } from "react-router";
import { useState } from "react";
import {
    Hammer, Sparkles, Zap, Shield, ArrowRight, Check, Code, Globe,
    Layers, Rocket, Star, Users, ChevronRight, Play, Github, Twitter
} from "lucide-react";

export default function Landing() {
    const [prompt, setPrompt] = useState("");
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;
        sessionStorage.setItem("landingPrompt", prompt);
        navigate("/auth/signup");
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
            {/* Animated background gradient */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                            <Hammer className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-xl">Forge</span>
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
                            className="px-4 py-2 bg-white text-black hover:bg-gray-100 rounded-lg font-medium text-sm transition-all"
                        >
                            Get Started Free
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-full text-indigo-300 text-sm mb-8">
                        <Sparkles className="w-4 h-4" />
                        <span>Now powered by Claude AI</span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
                        Idea to app
                        <br />
                        <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            in seconds
                        </span>
                    </h1>

                    <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Describe your vision in plain English. Forge builds production-ready React apps
                        with live preview, no coding required.
                    </p>

                    {/* Prompt Input */}
                    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-8">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
                            <div className="relative bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-2 flex items-center gap-2">
                                <input
                                    type="text"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Create a fitness tracking app with workout plans..."
                                    className="flex-1 bg-transparent px-4 py-3 text-lg text-white placeholder-gray-500 focus:outline-none"
                                />
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-medium text-lg flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/25"
                                >
                                    <Zap className="w-5 h-5" />
                                    <span className="hidden sm:inline">Start Building</span>
                                </button>
                            </div>
                        </div>
                    </form>

                    {/* Social Proof */}
                    <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 border-2 border-[#0a0a0f]" />
                                ))}
                            </div>
                            <span>500+ builders</span>
                        </div>
                        <div className="w-px h-4 bg-gray-700" />
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(i => (
                                <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                            ))}
                            <span className="ml-1">4.9/5</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-20 px-6 border-t border-white/5">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to ship fast</h2>
                        <p className="text-gray-400 max-w-xl mx-auto">From idea to deploy in minutes, not weeks. Forge handles the complexity so you can focus on what matters.</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { icon: Sparkles, title: "AI-Powered Generation", desc: "Describe your app in plain English. Claude understands context." },
                            { icon: Zap, title: "Instant Preview", desc: "See changes in real-time. No refreshing, no waiting." },
                            { icon: Code, title: "Production Code", desc: "Clean React + Tailwind code you can export and customize." },
                            { icon: Layers, title: "Component Library", desc: "Modern UI components with animations and interactions." },
                            { icon: Globe, title: "One-Click Deploy", desc: "Deploy to your own domain with Vercel or Netlify." },
                            { icon: Shield, title: "Secure by Default", desc: "Your projects are private. Export anytime." },
                        ].map((feature, i) => (
                            <div key={i} className="group p-6 bg-gradient-to-br from-white/5 to-transparent border border-white/5 rounded-2xl hover:border-indigo-500/30 transition-all">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <feature.icon className="w-6 h-6 text-indigo-400" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                                <p className="text-gray-400 text-sm">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-20 px-6 border-t border-white/5">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">How it works</h2>
                        <p className="text-gray-400">Three steps to your next great app</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { step: "01", title: "Describe Your Vision", desc: "Tell Forge what you want to build in plain English. Be as detailed as you like." },
                            { step: "02", title: "Watch It Build", desc: "AI generates your app in real-time. See files created, preview updates instantly." },
                            { step: "03", title: "Iterate & Deploy", desc: "Refine with follow-up prompts. Export code or deploy with one click." },
                        ].map((item, i) => (
                            <div key={i} className="relative">
                                <div className="text-6xl font-bold bg-gradient-to-b from-white/10 to-transparent bg-clip-text text-transparent mb-4">{item.step}</div>
                                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                                <p className="text-gray-400">{item.desc}</p>
                                {i < 2 && <ChevronRight className="hidden md:block absolute top-8 -right-4 w-8 h-8 text-gray-700" />}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Template Gallery */}
            <section id="templates" className="py-20 px-6 border-t border-white/5">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Start with a template</h2>
                        <p className="text-gray-400">Or create something completely new</p>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { name: "SaaS Landing", colors: "from-blue-600 to-cyan-500" },
                            { name: "E-commerce Store", colors: "from-pink-600 to-rose-500" },
                            { name: "Portfolio Site", colors: "from-purple-600 to-violet-500" },
                            { name: "Dashboard UI", colors: "from-green-600 to-emerald-500" },
                        ].map((template, i) => (
                            <Link
                                key={i}
                                to="/auth/signup"
                                className="group relative h-48 rounded-2xl overflow-hidden"
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${template.colors} opacity-80 group-hover:opacity-100 transition-opacity`} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute bottom-4 left-4 right-4">
                                    <p className="font-medium text-white">{template.name}</p>
                                    <p className="text-sm text-white/70">Click to start</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section id="pricing" className="py-20 px-6 border-t border-white/5">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, transparent pricing</h2>
                        <p className="text-gray-400">Start free, upgrade when you need more</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {/* Free */}
                        <div className="p-8 bg-[#12121a] border border-[#1e1e2e] rounded-2xl">
                            <h3 className="text-xl font-semibold mb-2">Free</h3>
                            <p className="text-gray-400 text-sm mb-6">Perfect for getting started</p>
                            <div className="text-4xl font-bold mb-6">$0<span className="text-lg text-gray-500 font-normal">/mo</span></div>
                            <ul className="space-y-3 mb-8">
                                {["3 projects", "5 daily credits", "Community support", "Export code", "Public projects only"].map((item, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                                        <Check className="w-4 h-4 text-green-500" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link to="/auth/signup" className="block text-center py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium transition-all">
                                Get Started
                            </Link>
                        </div>
                        {/* Starter */}
                        <div className="p-8 bg-[#12121a] border border-[#1e1e2e] rounded-2xl">
                            <h3 className="text-xl font-semibold mb-2">Starter</h3>
                            <p className="text-gray-400 text-sm mb-6">For indie developers</p>
                            <div className="text-4xl font-bold mb-6">$20<span className="text-lg text-gray-500 font-normal">/mo</span></div>
                            <ul className="space-y-3 mb-8">
                                {["10 projects", "50 daily credits", "Email support", "Private projects", "Custom domains"].map((item, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                                        <Check className="w-4 h-4 text-green-500" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link to="/auth/signup" className="block text-center py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium transition-all">
                                Start Starter
                            </Link>
                        </div>
                        {/* Pro */}
                        <div className="relative p-8 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-2xl">
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full text-xs font-medium">
                                Most Popular
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Pro</h3>
                            <p className="text-gray-400 text-sm mb-6">For serious builders</p>
                            <div className="text-4xl font-bold mb-6">$50<span className="text-lg text-gray-500 font-normal">/mo</span></div>
                            <ul className="space-y-3 mb-8">
                                {["50 projects", "150 daily credits", "Priority support", "Remove branding", "Team sharing", "One-click deploy"].map((item, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                                        <Check className="w-4 h-4 text-indigo-400" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link to="/auth/signup" className="block text-center py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/25">
                                Start Pro Trial
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-20 px-6 border-t border-white/5">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to build something amazing?</h2>
                    <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                        Join thousands of builders who are shipping faster with Forge.
                        No credit card required to start.
                    </p>
                    <Link
                        to="/auth/signup"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-medium text-lg transition-all shadow-lg shadow-indigo-500/25"
                    >
                        Start Building Free
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-white/5">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <Hammer className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold">Forge</span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                            <a href="#" className="hover:text-white transition-colors">Terms</a>
                            <a href="#" className="hover:text-white transition-colors">Privacy</a>
                            <a href="#" className="hover:text-white transition-colors">Contact</a>
                        </div>
                        <div className="flex items-center gap-4">
                            <a href="#" className="text-gray-500 hover:text-white transition-colors">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-gray-500 hover:text-white transition-colors">
                                <Github className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                    <div className="text-center mt-8 text-sm text-gray-600">
                        © 2025 Forge. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
