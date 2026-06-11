import { Link } from "react-router";
import type { Route } from "./+types/pricing";
import { Hammer, Check, ArrowLeft, Sparkles } from "lucide-react";
import { TIER_PRICING } from "~/lib/types";
import { useAuth } from "~/context/AuthContext";

export const meta: Route.MetaFunction = () => [
    { title: "Pricing - Excudo" },
    { name: "description", content: "Simple, transparent pricing for Excudo. Start free with 3 projects and 5 daily AI generations - paid plans coming soon." },
];

const TIER_ORDER = ["free", "starter", "pro", "teams"] as const;

const TIER_TAGLINES: Record<(typeof TIER_ORDER)[number], string> = {
    free: "Get started",
    starter: "Indie developers",
    pro: "Serious builders",
    teams: "Organizations",
};

export default function Pricing() {
    const { user, profile } = useAuth();

    return (
        <div className="min-h-screen bg-[#030308] text-white">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] bg-indigo-600/20 rounded-full blur-[200px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[180px]" />
            </div>

            {/* Header */}
            <header className="relative z-10 border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <Hammer className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-xl">Excudo</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        {user ? (
                            <Link
                                to="/dashboard"
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link to="/auth/login" className="text-gray-400 hover:text-white transition-colors text-sm">
                                    Sign In
                                </Link>
                                <Link
                                    to="/auth/signup"
                                    className="px-5 py-2.5 bg-white text-black hover:bg-gray-100 rounded-full font-medium text-sm transition-all"
                                >
                                    Get Started Free
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Pricing content */}
            <main className="relative z-10 max-w-7xl mx-auto px-6 py-20">
                <div className="text-center mb-16">
                    <span className="text-indigo-400 font-medium text-sm uppercase tracking-wider">Pricing</span>
                    <h1 className="text-4xl md:text-6xl font-bold mt-4 mb-6 tracking-tight">Simple, transparent pricing</h1>
                    <p className="text-gray-400 text-lg max-w-xl mx-auto">
                        Start free, no credit card required. Paid plans launch soon - everyone currently gets the free tier.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {TIER_ORDER.map((tierKey) => {
                        const tier = TIER_PRICING[tierKey];
                        const isPro = tierKey === "pro";
                        const isCurrent = profile?.tier === tierKey;
                        const isFree = tierKey === "free";

                        return (
                            <div
                                key={tierKey}
                                className={`relative p-8 rounded-3xl transition-all ${isPro
                                    ? "bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-pink-600/20 border border-indigo-500/30"
                                    : "bg-white/5 border border-white/10 hover:border-white/20"
                                    }`}
                            >
                                {isPro && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full text-xs font-semibold shadow-lg whitespace-nowrap">
                                        Most Popular
                                    </div>
                                )}
                                <h3 className="text-xl font-semibold mb-2">{tier.name}</h3>
                                <p className="text-gray-400 text-sm mb-6">{TIER_TAGLINES[tierKey]}</p>
                                <div className="text-4xl font-bold mb-6">
                                    ${tier.price}
                                    <span className="text-lg text-gray-500 font-normal">/mo</span>
                                </div>
                                <ul className="space-y-3 mb-8">
                                    {tier.features.map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                                            <Check className={`w-4 h-4 flex-shrink-0 ${isPro ? "text-indigo-400" : "text-green-400"}`} />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                                {isCurrent ? (
                                    <div className="block text-center py-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl font-medium">
                                        Current plan
                                    </div>
                                ) : isFree ? (
                                    <Link
                                        to={user ? "/dashboard" : "/auth/signup"}
                                        className="block text-center py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium transition-all"
                                    >
                                        {user ? "Go to Dashboard" : "Get Started"}
                                    </Link>
                                ) : (
                                    <div
                                        className={`block text-center py-3.5 rounded-xl font-medium cursor-not-allowed opacity-70 ${isPro
                                            ? "bg-gradient-to-r from-indigo-500/50 via-purple-500/50 to-pink-500/50"
                                            : "bg-white/5 border border-white/10"
                                            }`}
                                    >
                                        Coming Soon
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Note */}
                <div className="mt-16 max-w-2xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                        <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                        <p className="text-sm text-indigo-300">
                            Paid subscriptions are launching soon. Until then, everyone gets the Free plan - 3 projects and 5 AI generations per day.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
