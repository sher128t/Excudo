// Database types for TypeScript
export interface Profile {
    id: string;
    email: string;
    tier: "free" | "pro" | "enterprise" | "admin";
    credits_used_today: number;
    credits_limit: number;
    last_credit_reset: string;
    created_at: string;
}

export interface Project {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    files: Record<string, string>;
    chat_messages?: any[];  // Store chat history
    created_at: string;
    updated_at: string;
}

export interface Chat {
    id: string;
    project_id: string;
    messages: any[];
    created_at: string;
}

// Credit limits per tier
export const CREDIT_LIMITS: Record<Profile["tier"], number> = {
    free: 5,
    pro: 100,
    enterprise: 500,
    admin: 999999, // Unlimited for admin
};

// Helper to check if user has credits
export function hasCredits(profile: Profile): boolean {
    if (profile.tier === "admin") return true; // Admin always has credits
    return profile.credits_used_today < profile.credits_limit;
}

// Helper to get remaining credits
export function getRemainingCredits(profile: Profile): number {
    if (profile.tier === "admin") return Infinity;
    return Math.max(0, profile.credits_limit - profile.credits_used_today);
}
