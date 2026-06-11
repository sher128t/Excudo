import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client
export function createSupabaseServerClient(request: Request) {
    const headers = new Headers();
    const cookies = parseCookies(request.headers.get("Cookie") ?? "");

    const supabase = createServerClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return Object.entries(cookies).map(([name, value]) => ({
                        name,
                        value: value || "",
                    }));
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        headers.append("Set-Cookie", `${name}=${value}; Path=/; HttpOnly; SameSite=Lax`);
                    });
                },
            },
        }
    );

    return { supabase, headers };
}

// Parse cookies from header string (split on the FIRST "=" only - cookie
// values like base64 session tokens can themselves contain "=")
function parseCookies(cookieString: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    cookieString.split(";").forEach((cookie) => {
        const trimmed = cookie.trim();
        const eqIndex = trimmed.indexOf("=");
        if (eqIndex > 0) {
            const name = trimmed.slice(0, eqIndex);
            const value = trimmed.slice(eqIndex + 1);
            cookies[name] = value;
        }
    });
    return cookies;
}

// Admin client with service role key (bypasses RLS)
export function createSupabaseAdminClient() {
    return createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}
