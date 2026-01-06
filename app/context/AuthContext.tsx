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

    // Initialize Supabase client only on client-side
    useEffect(() => {
        // Only run on client
        if (typeof window === "undefined") {
            setLoading(false);
            return;
        }

        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

        // Check if env vars are available
        if (!url || !key || url === "your-project-url") {
            console.warn("Supabase not configured. Auth disabled.");
            setLoading(false);
            return;
        }

        // Dynamically import to avoid SSR issues
        import("~/lib/supabase").then(({ createClient }) => {
            const client = createClient();
            setSupabase(client);
        });
    }, []);

    const fetchProfile = async (userId: string) => {
        if (!supabase) return;

        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

        if (!error && data) {
            setProfile(data as Profile);
        }
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    useEffect(() => {
        if (!supabase) return;

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            }
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    await fetchProfile(session.user.id);
                } else {
                    setProfile(null);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, [supabase]);

    const signIn = async (email: string, password: string) => {
        if (!supabase) return { error: "Auth not configured" };

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) return { error: error.message };
        return {};
    };

    const signUp = async (email: string, password: string) => {
        if (!supabase) return { error: "Auth not configured" };

        const { error } = await supabase.auth.signUp({
            email,
            password,
        });
        if (error) return { error: error.message };
        return {};
    };

    const signOut = async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
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
