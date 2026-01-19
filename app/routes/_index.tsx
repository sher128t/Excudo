import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function Index() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading) {
            if (user) {
                // Logged in - go to dashboard
                navigate("/dashboard", { replace: true });
            } else {
                // Not logged in - go to landing
                navigate("/landing", { replace: true });
            }
        }
    }, [user, loading, navigate]);

    // Show loading spinner while determining auth state
    return (
        <div className="h-screen w-screen bg-[#0a0a0f] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
    );
}
