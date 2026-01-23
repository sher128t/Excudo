// Database types for TypeScript
export interface Profile {
    id: string;
    email: string;
    full_name?: string;  // User's display name
    tier: "free" | "starter" | "pro" | "teams" | "admin";
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
    thumbnail?: string;  // Base64 screenshot of preview
    created_at: string;
    updated_at: string;
}

export interface Chat {
    id: string;
    project_id: string;
    messages: any[];
    created_at: string;
}

// Pricing tiers matching Bolt.new and Lovable.dev
export const TIER_PRICING = {
    free: {
        price: 0,
        name: "Free",
        credits: 5,     // Daily credits
        projects: 3,
        features: ["3 projects", "5 daily credits", "Community support", "Export code"]
    },
    starter: {
        price: 20,
        name: "Starter",
        credits: 50,    // ~10M tokens equivalent
        projects: 10,
        features: ["10 projects", "50 daily credits", "Email support", "Private projects", "Custom domains"]
    },
    pro: {
        price: 50,
        name: "Pro",
        credits: 150,   // ~26M tokens equivalent
        projects: 50,
        features: ["50 projects", "150 daily credits", "Priority support", "Remove branding", "Team sharing"]
    },
    teams: {
        price: 100,
        name: "Teams",
        credits: 300,   // ~55M tokens equivalent
        projects: 200,
        features: ["200 projects", "300 daily credits", "Dedicated support", "SSO", "Admin controls"]
    },
    admin: {
        price: 0,
        name: "Admin",
        credits: 999999,
        projects: 999999,
        features: ["Unlimited everything"]
    },
};

// Credit limits per tier (daily credits)
export const CREDIT_LIMITS: Record<Profile["tier"], number> = {
    free: 5,
    starter: 50,
    pro: 150,
    teams: 300,
    admin: 999999,
};

// Project limits per tier
export const PROJECT_LIMITS: Record<Profile["tier"], number> = {
    free: 3,
    starter: 10,
    pro: 50,
    teams: 200,
    admin: 999999,
};

// Helper to check if user has credits
export function hasCredits(profile: Profile): boolean {
    if (profile.tier === "admin") return true;
    return profile.credits_used_today < profile.credits_limit;
}

// Helper to get remaining credits
export function getRemainingCredits(profile: Profile): number {
    if (profile.tier === "admin") return Infinity;
    return Math.max(0, profile.credits_limit - profile.credits_used_today);
}

// Helper to check if user can create more projects
export function canCreateProject(profile: Profile, currentProjectCount: number): boolean {
    if (profile.tier === "admin") return true;
    return currentProjectCount < PROJECT_LIMITS[profile.tier];
}

// Helper to get project limit
export function getProjectLimit(profile: Profile): number {
    return PROJECT_LIMITS[profile.tier];
}
