import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "~/context/AuthContext";
import { Hammer, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [loginSuccess, setLoginSuccess] = useState(false);
    const { signIn, user } = useAuth();
    const navigate = useNavigate();
    const hasNavigatedRef = useRef(false);

    // Redirect when user state changes (after successful login)
    useEffect(() => {
        if (user && !hasNavigatedRef.current) {
            hasNavigatedRef.current = true;
            navigate("/dashboard", { replace: true });
        }
    }, [user, navigate]);

    // Also handle navigation after login success with polling
    useEffect(() => {
        if (!loginSuccess) return;

        // Poll for user state change
        const checkUser = setInterval(() => {
            if (user && !hasNavigatedRef.current) {
                hasNavigatedRef.current = true;
                clearInterval(checkUser);
                navigate("/dashboard", { replace: true });
            }
        }, 100);

        // Timeout after 5 seconds - force reload if stuck
        const timeout = setTimeout(() => {
            clearInterval(checkUser);
            if (!hasNavigatedRef.current) {
                window.location.href = "/dashboard";
            }
        }, 5000);

        return () => {
            clearInterval(checkUser);
            clearTimeout(timeout);
        };
    }, [loginSuccess, user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await signIn(email, password);

            if (result.error) {
                setError(result.error);
                setLoading(false);
            } else {
                // Success - mark as successful and let the effect handle navigation
                setLoginSuccess(true);
                // Keep loading state true while waiting for redirect
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Hammer className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        Welcome back to Forge
                    </h1>
                    <p className="text-gray-500 mt-2">Sign in to continue building</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {loginSuccess && (
                        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Signing in...
                        </div>
                    )}

                    <div>
                        <label className="block text-sm text-gray-400 mb-1.5">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loginSuccess}
                                className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 disabled:opacity-50"
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
                                disabled={loginSuccess}
                                className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 disabled:opacity-50"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || loginSuccess}
                        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                Sign In
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>

                <p className="text-center text-gray-500 mt-6">
                    Don't have an account?{" "}
                    <Link to="/auth/signup" className="text-indigo-400 hover:text-indigo-300">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
