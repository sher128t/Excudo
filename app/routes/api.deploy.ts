import type { Route } from "./+types/api.deploy";
import { createSupabaseServerClient, createSupabaseAdminClient } from "~/lib/supabase.server";

const NETLIFY_API = "https://api.netlify.com/api/v1";

function jsonResponse(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

export async function action({ request }: Route.ActionArgs) {
    try {
        const token = process.env.NETLIFY_AUTH_TOKEN;
        if (!token) {
            return jsonResponse({ error: "Deployment is not configured (missing NETLIFY_AUTH_TOKEN)" }, 500);
        }

        // Authenticate the user from cookies
        const { supabase } = createSupabaseServerClient(request);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return jsonResponse({ error: "Not authenticated" }, 401);
        }

        const formData = await request.formData();
        const projectId = formData.get("projectId");
        const zipFile = formData.get("zip");

        if (typeof projectId !== "string" || !(zipFile instanceof Blob)) {
            return jsonResponse({ error: "Missing projectId or zip" }, 400);
        }

        // Verify the project belongs to this user
        const admin = createSupabaseAdminClient();
        const { data: project, error: projectError } = await admin
            .from("projects")
            .select("id, user_id, name, netlify_site_id")
            .eq("id", projectId)
            .single();

        if (projectError || !project || project.user_id !== user.id) {
            return jsonResponse({ error: "Project not found" }, 404);
        }

        const netlifyHeaders = { Authorization: `Bearer ${token}` };

        // Create the Netlify site on first deploy
        let siteId: string | null = project.netlify_site_id;
        let siteUrl: string | null = null;

        if (!siteId) {
            const siteName = `excudo-${projectId.slice(0, 8)}-${Math.random().toString(36).slice(2, 7)}`;
            const createRes = await fetch(`${NETLIFY_API}/sites`, {
                method: "POST",
                headers: { ...netlifyHeaders, "Content-Type": "application/json" },
                body: JSON.stringify({ name: siteName }),
            });

            if (!createRes.ok) {
                const text = await createRes.text();
                console.error("Netlify site creation failed:", text);
                return jsonResponse({ error: "Failed to create deployment site" }, 502);
            }

            const site = await createRes.json();
            siteId = site.id as string;
            siteUrl = (site.ssl_url || site.url) as string;

            await admin
                .from("projects")
                .update({ netlify_site_id: siteId })
                .eq("id", projectId);
        }

        // Upload the ZIP of the built site
        const zipBuffer = await zipFile.arrayBuffer();
        const deployRes = await fetch(`${NETLIFY_API}/sites/${siteId}/deploys`, {
            method: "POST",
            headers: { ...netlifyHeaders, "Content-Type": "application/zip" },
            body: zipBuffer,
        });

        if (!deployRes.ok) {
            const text = await deployRes.text();
            console.error("Netlify deploy failed:", text);
            return jsonResponse({ error: "Failed to upload deployment" }, 502);
        }

        const deploy = await deployRes.json();
        const deployId = deploy.id as string;

        // Poll until the deploy is live (max ~60s)
        let url: string = deploy.ssl_url || deploy.url || siteUrl || "";
        let state: string = deploy.state;
        const deadline = Date.now() + 60_000;

        while (state !== "ready" && Date.now() < deadline) {
            await new Promise((r) => setTimeout(r, 2000));
            const statusRes = await fetch(`${NETLIFY_API}/deploys/${deployId}`, { headers: netlifyHeaders });
            if (!statusRes.ok) break;
            const status = await statusRes.json();
            state = status.state;
            url = status.ssl_url || status.url || url;
            if (state === "error") {
                return jsonResponse({ error: "Deployment failed on Netlify" }, 502);
            }
        }

        // Persist the live URL
        await admin
            .from("projects")
            .update({ deploy_url: url, updated_at: new Date().toISOString() })
            .eq("id", projectId);

        return jsonResponse({ url, state });
    } catch (err) {
        console.error("Deploy API error:", err);
        return jsonResponse({ error: err instanceof Error ? err.message : "Unknown server error" }, 500);
    }
}
