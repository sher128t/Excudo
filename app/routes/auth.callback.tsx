import { useEffect } from "react";
import { useNavigate } from "react-router";
import { createClient } from "~/lib/supabase";

export default function AuthCallback() {
    const navigate = useNavigate();

    useEffect(() => {
        const supabase = createClient();

        // Handle the OAuth callback
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                navigate("/");
            } else {
                navigate("/auth/login");
            }
        });
    }, [navigate]);

    return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Completing sign in...</p>
            </div>
        </div>
    );
}
