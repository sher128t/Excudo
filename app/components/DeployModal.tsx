import { useState } from "react";
import JSZip from "jszip";
import { Rocket, Loader2, X, Check, Copy, ExternalLink, AlertCircle, Hammer, Package, UploadCloud } from "lucide-react";
import { useProject } from "~/context/ProjectContext";
import { useWebContainer } from "~/context/WebContainerContext";

type DeployStage = "idle" | "building" | "packaging" | "uploading" | "live" | "error";

interface DeployModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function DeployModal({ isOpen, onClose }: DeployModalProps) {
    const { currentProject, setCurrentProject } = useProject();
    const { webcontainer, runShellCommand } = useWebContainer();
    const [stage, setStage] = useState<DeployStage>("idle");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [liveUrl, setLiveUrl] = useState<string | null>(currentProject?.deploy_url || null);
    const [copied, setCopied] = useState(false);

    const isWorking = ["building", "packaging", "uploading"].includes(stage);

    // Recursively collect all files under a directory in the WebContainer
    const collectFiles = async (dir: string, zip: JSZip, base: string) => {
        if (!webcontainer) return;
        const entries = await webcontainer.fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = `${dir}/${entry.name}`;
            const relPath = fullPath.slice(base.length + 1);
            if (entry.isDirectory()) {
                await collectFiles(fullPath, zip, base);
            } else {
                const data = await webcontainer.fs.readFile(fullPath);
                zip.file(relPath, data);
            }
        }
    };

    const handleDeploy = async () => {
        if (!currentProject || !webcontainer) return;

        setErrorMessage(null);
        try {
            // 1. Build the app
            setStage("building");
            const { exitCode, output } = await runShellCommand("npm run build");
            if (exitCode !== 0) {
                setStage("error");
                setErrorMessage(`Build failed:\n${output.slice(-500)}`);
                return;
            }

            // 2. Zip the dist folder
            setStage("packaging");
            const zip = new JSZip();
            await collectFiles("dist", zip, "dist");
            const blob = await zip.generateAsync({ type: "blob" });

            // 3. Upload to the deploy API
            setStage("uploading");
            const formData = new FormData();
            formData.append("projectId", currentProject.id);
            formData.append("zip", blob, "site.zip");

            const res = await fetch("/api/deploy", { method: "POST", body: formData });
            const data = await res.json();

            if (!res.ok) {
                setStage("error");
                setErrorMessage(data.error || "Deployment failed");
                return;
            }

            setLiveUrl(data.url);
            setCurrentProject({ ...currentProject, deploy_url: data.url });
            setStage("live");
        } catch (err) {
            console.error("Deploy error:", err);
            setStage("error");
            setErrorMessage(err instanceof Error ? err.message : "Deployment failed");
        }
    };

    const copyUrl = async () => {
        if (liveUrl) {
            await navigator.clipboard.writeText(liveUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!isOpen) return null;

    const stages: { key: DeployStage; label: string; icon: React.ReactNode }[] = [
        { key: "building", label: "Building your app", icon: <Hammer className="w-4 h-4" /> },
        { key: "packaging", label: "Packaging files", icon: <Package className="w-4 h-4" /> },
        { key: "uploading", label: "Uploading to the web", icon: <UploadCloud className="w-4 h-4" /> },
    ];
    const stageIndex = stages.findIndex(s => s.key === stage);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]" onClick={isWorking ? undefined : onClose}>
            <div
                className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl max-w-md w-full mx-4 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-[#1e1e2e]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <Rocket className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Publish</h3>
                            <p className="text-xs text-gray-500">Deploy your app to a live URL</p>
                        </div>
                    </div>
                    {!isWorking && (
                        <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    )}
                </div>

                <div className="p-5">
                    {/* Live URL (existing or new) */}
                    {liveUrl && stage !== "error" && !isWorking && (
                        <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="text-sm font-medium text-emerald-400">
                                    {stage === "live" ? "Your app is live!" : "Currently published"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={liveUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 text-sm text-indigo-400 hover:text-indigo-300 truncate underline underline-offset-2"
                                >
                                    {liveUrl}
                                </a>
                                <button onClick={copyUrl} className="p-1.5 hover:bg-white/5 rounded transition-colors" title="Copy URL">
                                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
                                </button>
                                <a
                                    href={liveUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 hover:bg-white/5 rounded transition-colors"
                                    title="Open"
                                >
                                    <ExternalLink className="w-4 h-4 text-gray-400" />
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Progress steps */}
                    {isWorking && (
                        <div className="mb-4 space-y-3">
                            {stages.map((s, i) => (
                                <div key={s.key} className="flex items-center gap-3">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${i < stageIndex ? "bg-emerald-500/20 text-emerald-400" :
                                        i === stageIndex ? "bg-indigo-500/20 text-indigo-400" :
                                            "bg-[#1e1e2e] text-gray-600"
                                        }`}>
                                        {i < stageIndex ? <Check className="w-4 h-4" /> :
                                            i === stageIndex ? <Loader2 className="w-4 h-4 animate-spin" /> :
                                                s.icon}
                                    </div>
                                    <span className={`text-sm ${i <= stageIndex ? "text-gray-300" : "text-gray-600"}`}>
                                        {s.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Error */}
                    {stage === "error" && errorMessage && (
                        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                <pre className="text-xs text-red-300/80 whitespace-pre-wrap break-all max-h-32 overflow-y-auto">{errorMessage}</pre>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <button
                        onClick={handleDeploy}
                        disabled={isWorking || !webcontainer || !currentProject}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-medium text-white transition-all shadow-lg shadow-purple-500/20"
                    >
                        {isWorking ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Publishing...
                            </>
                        ) : (
                            <>
                                <Rocket className="w-4 h-4" />
                                {liveUrl ? "Publish update" : "Publish to the web"}
                            </>
                        )}
                    </button>
                    <p className="text-[11px] text-gray-600 text-center mt-3">
                        Your app will be hosted on a free *.netlify.app URL
                    </p>
                </div>
            </div>
        </div>
    );
}
