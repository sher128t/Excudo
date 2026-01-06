import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

export default function AuthCallback() {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Only run on client
        if (typeof window === "undefined") return;

        const handleCallback = async () => {
            try {
                // Get the hash fragment from the URL (Supabase sends tokens in hash)
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const accessToken = hashParams.get("access_token");
                const refreshToken = hashParams.get("refresh_token");

                // Also check query params (some flows use those)
                const queryParams = new URLSearchParams(window.location.search);
                const errorDesc = queryParams.get("error_description");

                if (errorDesc) {
                    setError(errorDesc);
                    setTimeout(() => navigate("/auth/login"), 3000);
                    return;
                }

                // If we have tokens in the hash, Supabase will auto-set the session
                // Just need to wait a moment and then check
                const { createClient } = await import("~/lib/supabase");
                const supabase = createClient();

                // Give Supabase a moment to process the tokens from the URL
                await new Promise(resolve => setTimeout(resolve, 500));

                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    setError(sessionError.message);
                    setTimeout(() => navigate("/auth/login"), 3000);
                    return;
                }

                if (session) {
                    // Successfully authenticated - go to main app
                    navigate("/");
                } else {
                    // No session yet - try to exchange the tokens if present
                    if (accessToken && refreshToken) {
                        const { error: setError } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken,
                        });
                        if (!setError) {
                            navigate("/");
                            return;
                        }
                    }
                    // Fallback - redirect to login
                    navigate("/auth/login");
                }
            } catch (err) {
                console.error("Callback error:", err);
                setError("Something went wrong. Redirecting to login...");
                setTimeout(() => navigate("/auth/login"), 2000);
            }
        };

        handleCallback();
    }, [navigate]);

    return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
            <div className="text-center">
                {error ? (
                    <>
                        <p className="text-red-400 mb-2">{error}</p>
                        <p className="text-gray-500 text-sm">Redirecting to login...</p>
                    </>
                ) : (
                    <>
                        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-400">Completing sign in...</p>
                    </>
                )}
            </div>
        </div>
    );
}
