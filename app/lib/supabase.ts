import { createBrowserClient } from "@supabase/ssr";

// Client-side Supabase client
export function createClient() {
    return createBrowserClient(
        import.meta.env.VITE_SUPABASE_URL!,
        import.meta.env.VITE_SUPABASE_ANON_KEY!
    );
}
