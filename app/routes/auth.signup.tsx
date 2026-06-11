import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "~/context/AuthContext";
import { Hammer, Mail, Lock, ArrowRight, Loader2, Check, User } from "lucide-react";

export default function Signup() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const { signUp, user } = useAuth();
    const navigate = useNavigate();

    // If already logged in, redirect
    useEffect(() => {
        if (user) {
            navigate("/");
        }
    }, [user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            setLoading(false);
            return;
        }

        try {
            const result = await signUp(email, password, name);

            if (result.error) {
                setError(result.error);
                setLoading(false);
            } else {
                setSuccess(true);
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
                <div className="w-full max-w-md text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Check your email!</h1>
                    <p className="text-gray-400 mb-6">
                        We sent a confirmation link to <strong>{email}</strong>
                    </p>
                    <Link
                        to="/auth/login"
                        className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300"
                    >
                        <ArrowRight className="w-4 h-4 rotate-180" />
                        Back to login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Hammer className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        Create your account
                    </h1>
                    <p className="text-gray-500 mt-2">Start building amazing apps with AI</p>
                </div>

                {/* Free tier info */}
                <div className="mb-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                    <p className="text-sm text-indigo-300">
                        <strong>Free plan includes:</strong> 5 generations per day, 3 projects
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm text-gray-400 mb-1.5">Your name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
                                placeholder="John Doe"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1.5">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1.5">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
                                placeholder="••••••••"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                Create Account
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>

                <p className="text-center text-gray-500 mt-6">
                    Already have an account?{" "}
                    <Link to="/auth/login" className="text-indigo-400 hover:text-indigo-300">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
