import { useState } from "react";
import { User, Loader2, Sparkles } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

interface OnboardingModalProps {
    isOpen: boolean;
    userId: string;
    onComplete: () => void;
}

export function OnboardingModal({ isOpen, userId, onComplete }: OnboardingModalProps) {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError("Please enter your name");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const supabase = createBrowserClient(
                import.meta.env.VITE_SUPABASE_URL,
                import.meta.env.VITE_SUPABASE_ANON_KEY
            );

            const { error: updateError } = await supabase
                .from("profiles")
                .update({ full_name: name.trim() })
                .eq("id", userId);

            if (updateError) {
                console.error("Profile update error:", updateError);
                setError("Failed to save name. Please try again.");
                setLoading(false);
                return;
            }

            onComplete();
        } catch (err) {
            console.error("Error saving name:", err);
            setError("Something went wrong. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-8 max-w-md w-full shadow-2xl">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Welcome to Excudo!</h2>
                    <p className="text-gray-400">What should we call you?</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                            autoFocus
                            className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                        />
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm text-center">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !name.trim()}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <span>Get Started</span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
