import { createClient } from "~/lib/supabase";
import type { Profile } from "~/lib/types";

// Use a credit (client-side)
export async function useCredit(userId: string): Promise<{ success: boolean; remaining: number }> {
    const supabase = createClient();

    // Get current profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    if (!profile) {
        return { success: false, remaining: 0 };
    }

    // Admin has unlimited credits
    if (profile.tier === "admin") {
        return { success: true, remaining: 999999 };
    }

    // Check if we need to reset credits (new day)
    const lastReset = new Date(profile.last_credit_reset);
    const now = new Date();
    const isNewDay = lastReset.toDateString() !== now.toDateString();

    if (isNewDay) {
        // Reset credits for new day
        const { data: updated } = await supabase
            .from("profiles")
            .update({
                credits_used_today: 1,
                last_credit_reset: now.toISOString(),
            })
            .eq("id", userId)
            .select()
            .single();

        return {
            success: true,
            remaining: (updated?.credits_limit ?? profile.credits_limit) - 1
        };
    }

    // Check if user has credits remaining
    if (profile.credits_used_today >= profile.credits_limit) {
        return { success: false, remaining: 0 };
    }

    // Deduct one credit
    const { data: updated } = await supabase
        .from("profiles")
        .update({
            credits_used_today: profile.credits_used_today + 1,
        })
        .eq("id", userId)
        .select()
        .single();

    return {
        success: true,
        remaining: (updated?.credits_limit ?? profile.credits_limit) - (updated?.credits_used_today ?? profile.credits_used_today + 1)
    };
}

// Get user's remaining credits
export async function getCredits(userId: string): Promise<number> {
    const supabase = createClient();

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    if (!profile) return 0;
    if (profile.tier === "admin") return 999999;

    // Check for day reset
    const lastReset = new Date(profile.last_credit_reset);
    const now = new Date();
    if (lastReset.toDateString() !== now.toDateString()) {
        return profile.credits_limit; // Full credits on new day
    }

    return Math.max(0, profile.credits_limit - profile.credits_used_today);
}
