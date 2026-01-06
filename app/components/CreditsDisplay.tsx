import { useAuth } from "~/context/AuthContext";
import { Zap, Crown, Infinity } from "lucide-react";
import { getRemainingCredits } from "~/lib/types";

export function CreditsDisplay() {
    const { profile } = useAuth();

    if (!profile) return null;

    const isAdmin = profile.tier === "admin";
    const remaining = getRemainingCredits(profile);

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#12121a] border border-[#1e1e2e] rounded-lg">
            {isAdmin ? (
                <>
                    <Crown className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-yellow-400 font-medium">Admin</span>
                </>
            ) : (
                <>
                    <Zap className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm text-gray-300">
                        <span className="font-medium text-white">{remaining}</span>
                        <span className="text-gray-500"> / {profile.credits_limit}</span>
                    </span>
                </>
            )}
        </div>
    );
}
