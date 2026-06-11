import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient, createSupabaseAdminClient } from "~/lib/supabase.server";

// Authenticate the request from Supabase session cookies.
export async function getAuthenticatedUser(request: Request): Promise<User | null> {
    try {
        const { supabase } = createSupabaseServerClient(request);
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    } catch (err) {
        console.error("Auth check failed:", err);
        return null;
    }
}

export interface CreditCheckResult {
    ok: boolean;
    remaining: number;
    tier: string;
}

// Server-side credit enforcement (uses the admin client, so it cannot be
// bypassed from the browser). Handles the daily reset and deducts one
// credit atomically enough for this scale.
export async function checkAndUseCredit(userId: string): Promise<CreditCheckResult> {
    const admin = createSupabaseAdminClient();

    const { data: profile, error } = await admin
        .from("profiles")
        .select("tier, credits_used_today, credits_limit, last_credit_reset")
        .eq("id", userId)
        .single();

    if (error || !profile) {
        console.error("Failed to load profile for credit check:", error);
        return { ok: false, remaining: 0, tier: "free" };
    }

    // Admins are unlimited
    if (profile.tier === "admin") {
        return { ok: true, remaining: 999999, tier: profile.tier };
    }

    const now = new Date();
    const lastReset = new Date(profile.last_credit_reset);
    const isNewDay = lastReset.toDateString() !== now.toDateString();

    if (isNewDay) {
        await admin
            .from("profiles")
            .update({ credits_used_today: 1, last_credit_reset: now.toISOString() })
            .eq("id", userId);
        return { ok: true, remaining: profile.credits_limit - 1, tier: profile.tier };
    }

    if (profile.credits_used_today >= profile.credits_limit) {
        return { ok: false, remaining: 0, tier: profile.tier };
    }

    await admin
        .from("profiles")
        .update({ credits_used_today: profile.credits_used_today + 1 })
        .eq("id", userId);

    return {
        ok: true,
        remaining: profile.credits_limit - profile.credits_used_today - 1,
        tier: profile.tier,
    };
}

// Read the user's tier without charging anything.
export async function getUserTier(userId: string): Promise<string> {
    const admin = createSupabaseAdminClient();
    const { data } = await admin
        .from("profiles")
        .select("tier")
        .eq("id", userId)
        .single();
    return data?.tier || "free";
}
