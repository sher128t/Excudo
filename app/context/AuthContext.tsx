import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
    const [initialized, setInitialized] = useState(false);

    // Initialize Supabase client only on client-side
    useEffect(() => {
        // Only run on client
        if (typeof window === "undefined") {
            setLoading(false);
            setInitialized(true);
            return;
        }

        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

        // Check if env vars are available
        if (!url || !key || url === "your-project-url") {
            console.warn("Supabase not configured. Auth disabled.");
            setLoading(false);
            setInitialized(true);
            return;
        }

        // Dynamically import to avoid SSR issues
        import("~/lib/supabase").then(({ createClient }) => {
            try {
                const client = createClient();
                setSupabase(client);
            } catch (err) {
                console.error("Failed to init Supabase:", err);
                setLoading(false);
                setInitialized(true);
            }
        }).catch(err => {
            console.error("Failed to load Supabase:", err);
            setLoading(false);
            setInitialized(true);
        });
    }, []);

    const fetchProfile = async (userId: string) => {
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
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    // Initialize auth session when Supabase client is ready
    useEffect(() => {
        if (!supabase) return;

        let isMounted = true;

        const initAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (!isMounted) return;

                if (error) {
                    console.error("Error getting session:", error);
                } else if (session) {
                    setSession(session);
                    setUser(session.user);
                    await fetchProfile(session.user.id);
                }
            } catch (err) {
                console.error("Auth init error:", err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                    setInitialized(true);
                }
            }
        };

        initAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!isMounted) return;

                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    await fetchProfile(session.user.id);
                } else {
                    setProfile(null);
                }
            }
        );

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, [supabase]);

    const signIn = async (email: string, password: string) => {
        if (!supabase) return { error: "Auth not configured. Please check env vars." };

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) return { error: error.message };
            return {};
        } catch (err) {
            return { error: "Sign in failed" };
        }
    };

    const signUp = async (email: string, password: string) => {
        if (!supabase) return { error: "Auth not configured. Please check env vars." };

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
            });
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

    // Always render children - don't block on loading
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
