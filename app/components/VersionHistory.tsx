import { useEffect, useState } from "react";
import { History, Loader2, RotateCcw, X, Clock, FileCode, AlertTriangle } from "lucide-react";
import { useProject } from "~/context/ProjectContext";
import { useWebContainer } from "~/context/WebContainerContext";
import { getProjectVersions, getProjectVersion } from "~/lib/projects";
import type { ProjectVersion } from "~/lib/types";

interface VersionHistoryProps {
    isOpen: boolean;
    onClose: () => void;
    onRestored?: () => void;
}

function timeAgo(dateString: string): string {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export function VersionHistory({ isOpen, onClose, onRestored }: VersionHistoryProps) {
    const { currentProject, saveProject } = useProject();
    const { writeFile, deleteFile, serverStatus, startDevServer } = useWebContainer();
    const [versions, setVersions] = useState<ProjectVersion[]>([]);
    const [loading, setLoading] = useState(false);
    const [restoringId, setRestoringId] = useState<string | null>(null);
    const [confirmId, setConfirmId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && currentProject) {
            setLoading(true);
            setError(null);
            getProjectVersions(currentProject.id)
                .then(setVersions)
                .catch(() => setError("Failed to load versions"))
                .finally(() => setLoading(false));
        }
    }, [isOpen, currentProject]);

    const handleRestore = async (versionId: string) => {
        if (!currentProject) return;

        setRestoringId(versionId);
        setError(null);
        try {
            const version = await getProjectVersion(versionId);
            if (!version || !version.files) {
                setError("Could not load version files");
                return;
            }

            const restoredFiles = version.files;
            const currentFiles = currentProject.files || {};

            // Remove files that exist now but not in the restored version
            for (const path of Object.keys(currentFiles)) {
                if (!(path in restoredFiles)) {
                    try {
                        await deleteFile(path);
                    } catch {
                        // File may not exist in the container
                    }
                }
            }

            // Write restored files into the WebContainer (HMR picks them up)
            for (const [path, content] of Object.entries(restoredFiles)) {
                await writeFile(path, content);
            }

            // Persist as current state
            await saveProject({ files: restoredFiles });

            // If the server never started (e.g. fresh page load), start it
            if (serverStatus === "idle") {
                startDevServer();
            }

            onRestored?.();
            onClose();
        } catch (err) {
            console.error("Restore failed:", err);
            setError("Restore failed. Please try again.");
        } finally {
            setRestoringId(null);
            setConfirmId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]" onClick={onClose}>
            <div
                className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl max-w-lg w-full mx-4 shadow-2xl max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-[#1e1e2e]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-xl flex items-center justify-center border border-indigo-500/20">
                            <History className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Version History</h3>
                            <p className="text-xs text-gray-500">Snapshots are saved after every AI edit</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="mx-5 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                        {error}
                    </div>
                )}

                {/* Version list */}
                <div className="flex-1 overflow-y-auto p-5 space-y-2">
                    {loading ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                        </div>
                    ) : versions.length === 0 ? (
                        <div className="text-center py-10">
                            <Clock className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                            <p className="text-sm text-gray-400">No versions yet</p>
                            <p className="text-xs text-gray-600 mt-1">Versions are created automatically when the AI edits your project</p>
                        </div>
                    ) : (
                        versions.map((version, i) => (
                            <div
                                key={version.id}
                                className="flex items-center gap-3 p-3 bg-[#0d0d14] border border-[#1e1e2e] rounded-xl hover:border-indigo-500/30 transition-colors"
                            >
                                <div className="w-8 h-8 bg-[#1e1e2e] rounded-lg flex items-center justify-center flex-shrink-0">
                                    <FileCode className="w-4 h-4 text-gray-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-300 truncate">
                                        {version.label || "Untitled change"}
                                        {i === 0 && <span className="ml-2 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">Latest</span>}
                                    </p>
                                    <p className="text-xs text-gray-600">{timeAgo(version.created_at)}</p>
                                </div>
                                {confirmId === version.id ? (
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <button
                                            onClick={() => handleRestore(version.id)}
                                            disabled={restoringId !== null}
                                            className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                                        >
                                            {restoringId === version.id ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <AlertTriangle className="w-3 h-3" />
                                            )}
                                            Confirm
                                        </button>
                                        <button
                                            onClick={() => setConfirmId(null)}
                                            disabled={restoringId !== null}
                                            className="px-2.5 py-1.5 hover:bg-white/5 text-gray-400 rounded-lg text-xs transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setConfirmId(version.id)}
                                        disabled={restoringId !== null}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-indigo-500/20 text-gray-400 hover:text-indigo-400 rounded-lg text-xs font-medium transition-colors flex-shrink-0 disabled:opacity-50"
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                        Restore
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
