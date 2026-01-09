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
    signUp: (email: string, password: string) => Promise<{ error?: string }>;
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

    supabaseClient = createBrowserClient(url, key);
    return supabaseClient;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

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

    // Initialize auth on mount
    useEffect(() => {
        if (!supabase) {
            setLoading(false);
            return;
        }

        let mounted = true;

        // Get initial session
        const initSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (!mounted) return;

                if (error) {
                    console.error("Session error:", error);
                    setLoading(false);
                    return;
                }

                if (session) {
                    setSession(session);
                    setUser(session.user);
                    await fetchProfile(session.user.id);
                }

                setLoading(false);
            } catch (err) {
                console.error("Init session error:", err);
                if (mounted) setLoading(false);
            }
        };

        initSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                if (!mounted) return;

                setSession(newSession);
                setUser(newSession?.user ?? null);

                if (newSession?.user) {
                    await fetchProfile(newSession.user.id);
                } else {
                    setProfile(null);
                }
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [supabase, fetchProfile]);

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

    const signUp = async (email: string, password: string) => {
        if (!supabase) return { error: "Auth not configured" };

        try {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) return { error: error.message };
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
