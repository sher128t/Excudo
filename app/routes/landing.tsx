import { Link } from "react-router";
import { Hammer, Sparkles, Zap, Shield, ArrowRight, Check } from "lucide-react";

export default function Landing() {
    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-[#1e1e2e]">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Hammer className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            Forge
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/auth/login" className="text-gray-400 hover:text-white transition-colors">
                            Sign In
                        </Link>
                        <Link
                            to="/auth/signup"
                            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg font-medium transition-all"
                        >
                            Get Started Free
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-sm mb-6">
                        <Sparkles className="w-4 h-4" />
                        <span>AI-Powered App Builder</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                        Build apps with{" "}
                        <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            just a prompt
                        </span>
                    </h1>
                    <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                        Describe your app idea and watch Forge create it in real-time.
                        No coding required. Deploy in minutes.
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        <Link
                            to="/auth/signup"
                            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-medium text-lg flex items-center gap-2 transition-all"
                        >
                            Start Building
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            to="/auth/login"
                            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium text-lg transition-all"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-20 px-6 border-t border-[#1e1e2e]">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12">
                        Everything you need to build fast
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="p-6 bg-[#12121a] rounded-2xl border border-[#1e1e2e]">
                            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-4">
                                <Sparkles className="w-6 h-6 text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">AI-Powered</h3>
                            <p className="text-gray-400">
                                Describe your app in plain English. Our AI handles the code.
                            </p>
                        </div>
                        <div className="p-6 bg-[#12121a] rounded-2xl border border-[#1e1e2e]">
                            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4">
                                <Zap className="w-6 h-6 text-purple-400" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Real-Time Preview</h3>
                            <p className="text-gray-400">
                                See your app come to life instantly as the AI builds it.
                            </p>
                        </div>
                        <div className="p-6 bg-[#12121a] rounded-2xl border border-[#1e1e2e]">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4">
                                <Shield className="w-6 h-6 text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Production Ready</h3>
                            <p className="text-gray-400">
                                Export clean React code. Deploy anywhere.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section className="py-20 px-6 border-t border-[#1e1e2e]">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-4">Simple pricing</h2>
                    <p className="text-gray-400 text-center mb-12">Start free. Upgrade when you need more.</p>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Free */}
                        <div className="p-6 bg-[#12121a] rounded-2xl border border-[#1e1e2e]">
                            <h3 className="text-lg font-semibold mb-1">Free</h3>
                            <div className="text-3xl font-bold mb-4">$0<span className="text-lg text-gray-500">/mo</span></div>
                            <ul className="space-y-3 mb-6">
                                <li className="flex items-center gap-2 text-gray-400">
                                    <Check className="w-4 h-4 text-emerald-400" />
                                    5 generations per day
                                </li>
                                <li className="flex items-center gap-2 text-gray-400">
                                    <Check className="w-4 h-4 text-emerald-400" />
                                    1 project
                                </li>
                            </ul>
                            <Link
                                to="/auth/signup"
                                className="block w-full py-2 text-center bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                Get Started
                            </Link>
                        </div>

                        {/* Pro */}
                        <div className="p-6 bg-gradient-to-b from-indigo-500/10 to-purple-500/10 rounded-2xl border border-indigo-500/30 relative">
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full text-xs font-medium">
                                Popular
                            </div>
                            <h3 className="text-lg font-semibold mb-1">Pro</h3>
                            <div className="text-3xl font-bold mb-4">$20<span className="text-lg text-gray-500">/mo</span></div>
                            <ul className="space-y-3 mb-6">
                                <li className="flex items-center gap-2 text-gray-400">
                                    <Check className="w-4 h-4 text-emerald-400" />
                                    100 generations per day
                                </li>
                                <li className="flex items-center gap-2 text-gray-400">
                                    <Check className="w-4 h-4 text-emerald-400" />
                                    Unlimited projects
                                </li>
                                <li className="flex items-center gap-2 text-gray-400">
                                    <Check className="w-4 h-4 text-emerald-400" />
                                    Priority support
                                </li>
                            </ul>
                            <button className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg font-medium transition-all">
                                Coming Soon
                            </button>
                        </div>

                        {/* Enterprise */}
                        <div className="p-6 bg-[#12121a] rounded-2xl border border-[#1e1e2e]">
                            <h3 className="text-lg font-semibold mb-1">Enterprise</h3>
                            <div className="text-3xl font-bold mb-4">$50<span className="text-lg text-gray-500">/mo</span></div>
                            <ul className="space-y-3 mb-6">
                                <li className="flex items-center gap-2 text-gray-400">
                                    <Check className="w-4 h-4 text-emerald-400" />
                                    500 generations per day
                                </li>
                                <li className="flex items-center gap-2 text-gray-400">
                                    <Check className="w-4 h-4 text-emerald-400" />
                                    Custom domains
                                </li>
                                <li className="flex items-center gap-2 text-gray-400">
                                    <Check className="w-4 h-4 text-emerald-400" />
                                    API access
                                </li>
                            </ul>
                            <button className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                                Coming Soon
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-6 border-t border-[#1e1e2e]">
                <div className="max-w-6xl mx-auto text-center text-gray-500 text-sm">
                    &copy; 2026 Forge. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
