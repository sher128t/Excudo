import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function Index() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const hasRedirectedRef = useRef(false);

    useEffect(() => {
        if (loading || hasRedirectedRef.current) return;

        hasRedirectedRef.current = true;

        if (user) {
            // Logged in - go to dashboard (use hard redirect to ensure fresh state)
            window.location.href = "/dashboard";
        } else {
            // Not logged in - go to landing
            window.location.href = "/landing";
        }
    }, [user, loading]);

    // Show loading spinner while determining auth state
    return (
        <div className="h-screen w-screen bg-[#0a0a0f] flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-500 text-sm">Loading...</p>
            </div>
        </div>
    );
}
