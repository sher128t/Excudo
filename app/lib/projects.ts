import { createBrowserClient } from "@supabase/ssr";
import type { Project } from "~/lib/types";

// Get client-side Supabase client
function getClient() {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !key) {
        throw new Error("Supabase not configured");
    }

    return createBrowserClient(url, key);
}

// Create a new project
export async function createProject(userId: string, name: string): Promise<Project | null> {
    const supabase = getClient();

    const { data, error } = await supabase
        .from("projects")
        .insert({
            user_id: userId,
            name,
            files: {},
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating project:", error);
        return null;
    }

    return data as Project;
}

// Get all projects for a user
export async function getProjects(userId: string): Promise<Project[]> {
    const supabase = getClient();

    const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

    if (error) {
        console.error("Error fetching projects:", error);
        return [];
    }

    return data as Project[];
}

// Get a single project
export async function getProject(projectId: string): Promise<Project | null> {
    const supabase = getClient();

    const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

    if (error) {
        console.error("Error fetching project:", error);
        return null;
    }

    return data as Project;
}

// Update project (files and/or chat messages and/or thumbnail)
export async function saveProjectData(
    projectId: string,
    data: { files?: Record<string, string>; chat_messages?: any[]; thumbnail?: string }
): Promise<boolean> {
    const supabase = getClient();

    const updateData: any = {
        updated_at: new Date().toISOString(),
    };

    if (data.files !== undefined) {
        updateData.files = data.files;
    }
    if (data.chat_messages !== undefined) {
        updateData.chat_messages = data.chat_messages;
    }
    if (data.thumbnail !== undefined) {
        updateData.thumbnail = data.thumbnail;
    }

    const { error } = await supabase
        .from("projects")
        .update(updateData)
        .eq("id", projectId);

    if (error) {
        console.error("Error saving project:", error);
        return false;
    }

    return true;
}

// Backward compat - save just files
export async function saveProjectFiles(projectId: string, files: Record<string, string>): Promise<boolean> {
    return saveProjectData(projectId, { files });
}

// Delete a project
export async function deleteProject(projectId: string): Promise<boolean> {
    const supabase = getClient();

    const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

    if (error) {
        console.error("Error deleting project:", error);
        return false;
    }

    return true;
}

// Rename a project
export async function renameProject(projectId: string, name: string): Promise<boolean> {
    const supabase = getClient();

    const { error } = await supabase
        .from("projects")
        .update({ name, updated_at: new Date().toISOString() })
        .eq("id", projectId);

    if (error) {
        console.error("Error renaming project:", error);
        return false;
    }

    return true;
}
