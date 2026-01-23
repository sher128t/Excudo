import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { User, Session, SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "~/lib/types";

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error?: string }>;
    signUp: (email: string, password: string, fullName?: string) => Promise<{ error?: string }>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Create supabase client once at module level (only on client)
let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
    if (typeof window === "undefined") return null;

    if (supabaseClient) return supabaseClient;

    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !key || url === "your-project-url") {
        console.warn("Supabase not configured");
        return null;
    }

    try {
        supabaseClient = createBrowserClient(url, key);
        return supabaseClient;
    } catch (err) {
        console.error("Failed to create Supabase client:", err);
        return null;
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [initialized, setInitialized] = useState(false);

    const supabase = getSupabaseClient();

    const fetchProfile = useCallback(async (userId: string) => {
        if (!supabase) return;

        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single();

            if (!error && data) {
                setProfile(data as Profile);
            }
        } catch (err) {
            console.error("Error fetching profile:", err);
        }
    }, [supabase]);

    const refreshProfile = useCallback(async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    }, [user, fetchProfile]);

    // Initialize auth on mount with timeout protection
    useEffect(() => {
        if (initialized) return;

        // If no supabase, finish loading immediately
        if (!supabase) {
            setLoading(false);
            setInitialized(true);
            return;
        }

        let mounted = true;

        // Timeout to prevent infinite loading - set loading false after 5 seconds max
        const timeout = setTimeout(() => {
            if (mounted && loading) {
                console.warn("Auth initialization timeout - forcing completion");
                setLoading(false);
                setInitialized(true);
            }
        }, 5000);

        // Get initial session
        const initSession = async () => {
            try {
                const { data: { session: currentSession }, error } = await supabase.auth.getSession();

                if (!mounted) return;

                if (error) {
                    console.error("Session error:", error);
                } else if (currentSession) {
                    setSession(currentSession);
                    setUser(currentSession.user);
                    // Fetch profile in background, don't wait
                    fetchProfile(currentSession.user.id);
                }
            } catch (err) {
                console.error("Init session error:", err);
            } finally {
                if (mounted) {
                    setLoading(false);
                    setInitialized(true);
                    clearTimeout(timeout);
                }
            }
        };

        initSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                if (!mounted) return;

                console.log("Auth state change:", event);

                setSession(newSession);
                setUser(newSession?.user ?? null);

                if (newSession?.user) {
                    fetchProfile(newSession.user.id);
                } else {
                    setProfile(null);
                }

                // Ensure loading is false after any auth change
                setLoading(false);
            }
        );

        return () => {
            mounted = false;
            clearTimeout(timeout);
            subscription.unsubscribe();
        };
    }, [supabase, fetchProfile, initialized, loading]);

    const signIn = async (email: string, password: string) => {
        if (!supabase) return { error: "Auth not configured" };

        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) return { error: error.message };
            return {};
        } catch (err) {
            return { error: "Sign in failed" };
        }
    };

    const signUp = async (email: string, password: string, fullName?: string) => {
        if (!supabase) return { error: "Auth not configured" };

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName || email.split("@")[0],
                    }
                }
            });
            if (error) return { error: error.message };

            // Update profile with full_name if user was created
            if (data.user && fullName) {
                await supabase
                    .from("profiles")
                    .update({ full_name: fullName })
                    .eq("id", data.user.id);
            }

            return {};
        } catch (err) {
            return { error: "Sign up failed" };
        }
    };

    const signOut = async () => {
        if (!supabase) return;
        try {
            await supabase.auth.signOut();
        } catch (err) {
            console.error("Sign out error:", err);
        }
        setUser(null);
        setProfile(null);
        setSession(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            session,
            loading,
            signIn,
            signUp,
            signOut,
            refreshProfile,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
}
