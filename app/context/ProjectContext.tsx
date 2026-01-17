import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { createProject, getProjects, saveProjectData, deleteProject, renameProject, getProject } from "~/lib/projects";
import type { Project } from "~/lib/types";

interface ProjectContextType {
    // Current project
    currentProject: Project | null;
    setCurrentProject: (project: Project | null) => void;

    // All user projects
    projects: Project[];
    loadProjects: () => Promise<void>;

    // Project operations
    createNewProject: (name: string) => Promise<Project | null>;
    saveProject: (data: { files?: Record<string, string>; chat_messages?: any[]; thumbnail?: string }) => Promise<boolean>;
    deleteProjectById: (id: string) => Promise<boolean>;
    renameProjectById: (id: string, name: string) => Promise<boolean>;
    openProject: (id: string) => Promise<Project | null>;

    // State
    loading: boolean;
    saving: boolean;
    lastSaved: Date | null;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [currentProject, setCurrentProject] = useState<Project | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // Load all projects for user
    const loadProjects = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        try {
            const userProjects = await getProjects(user.id);
            setProjects(userProjects);
        } catch (err) {
            console.error("Failed to load projects:", err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Create new project
    const createNewProject = useCallback(async (name: string): Promise<Project | null> => {
        if (!user) return null;

        try {
            const project = await createProject(user.id, name);
            if (project) {
                setProjects(prev => [project, ...prev]);
                setCurrentProject(project);
            }
            return project;
        } catch (err) {
            console.error("Failed to create project:", err);
            return null;
        }
    }, [user]);

    // Save current project (files and/or chat)
    const saveProject = useCallback(async (data: { files?: Record<string, string>; chat_messages?: any[]; thumbnail?: string }): Promise<boolean> => {
        if (!currentProject) return false;

        setSaving(true);
        try {
            const success = await saveProjectData(currentProject.id, data);
            if (success) {
                setLastSaved(new Date());
                // Update local state
                setCurrentProject(prev => prev ? {
                    ...prev,
                    ...(data.files !== undefined ? { files: data.files } : {}),
                    ...(data.chat_messages !== undefined ? { chat_messages: data.chat_messages } : {}),
                    ...(data.thumbnail !== undefined ? { thumbnail: data.thumbnail } : {}),
                } : null);
                setProjects(prev =>
                    prev.map(p => p.id === currentProject.id ? {
                        ...p,
                        ...(data.files !== undefined ? { files: data.files } : {}),
                        ...(data.chat_messages !== undefined ? { chat_messages: data.chat_messages } : {}),
                        updated_at: new Date().toISOString()
                    } : p)
                );
            }
            return success;
        } catch (err) {
            console.error("Failed to save project:", err);
            return false;
        } finally {
            setSaving(false);
        }
    }, [currentProject]);

    // Delete project
    const deleteProjectById = useCallback(async (id: string): Promise<boolean> => {
        try {
            const success = await deleteProject(id);
            if (success) {
                setProjects(prev => prev.filter(p => p.id !== id));
                if (currentProject?.id === id) {
                    setCurrentProject(null);
                }
            }
            return success;
        } catch (err) {
            console.error("Failed to delete project:", err);
            return false;
        }
    }, [currentProject]);

    // Rename project
    const renameProjectById = useCallback(async (id: string, name: string): Promise<boolean> => {
        try {
            const success = await renameProject(id, name);
            if (success) {
                setProjects(prev => prev.map(p => p.id === id ? { ...p, name } : p));
                if (currentProject?.id === id) {
                    setCurrentProject(prev => prev ? { ...prev, name } : null);
                }
            }
            return success;
        } catch (err) {
            console.error("Failed to rename project:", err);
            return false;
        }
    }, [currentProject]);

    // Open project by ID - returns the project so editor can load it
    const openProject = useCallback(async (id: string): Promise<Project | null> => {
        setLoading(true);
        try {
            const project = await getProject(id);
            if (project) {
                setCurrentProject(project);
            }
            return project;
        } catch (err) {
            console.error("Failed to open project:", err);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Load projects when user changes
    useEffect(() => {
        if (user) {
            loadProjects();
        } else {
            setProjects([]);
            setCurrentProject(null);
        }
    }, [user, loadProjects]);

    return (
        <ProjectContext.Provider value={{
            currentProject,
            setCurrentProject,
            projects,
            loadProjects,
            createNewProject,
            saveProject,
            deleteProjectById,
            renameProjectById,
            openProject,
            loading,
            saving,
            lastSaved,
        }}>
            {children}
        </ProjectContext.Provider>
    );
}

export function useProject() {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error("useProject must be used within ProjectProvider");
    }
    return context;
}
