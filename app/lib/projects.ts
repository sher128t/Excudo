import { createClient } from "~/lib/supabase";
import type { Project } from "~/lib/types";

// Create a new project
export async function createProject(userId: string, name: string): Promise<Project | null> {
    const supabase = createClient();

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
    const supabase = createClient();

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
    const supabase = createClient();

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

// Update project files
export async function saveProjectFiles(projectId: string, files: Record<string, string>): Promise<boolean> {
    const supabase = createClient();

    const { error } = await supabase
        .from("projects")
        .update({
            files,
            updated_at: new Date().toISOString(),
        })
        .eq("id", projectId);

    if (error) {
        console.error("Error saving project:", error);
        return false;
    }

    return true;
}

// Delete a project
export async function deleteProject(projectId: string): Promise<boolean> {
    const supabase = createClient();

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
    const supabase = createClient();

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
