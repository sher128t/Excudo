import { useEffect, useState } from "react";
import { useWebContainer } from "~/context/WebContainerContext";
import { useAtom } from "jotai";
import { selectedFileAtom } from "~/store/atoms";
import {
    Folder, FolderOpen, File, FileCode, FileJson, FileText,
    FileImage, ChevronRight, ChevronDown, RefreshCw, Files
} from "lucide-react";

type FileNode = {
    name: string;
    kind: "file" | "directory";
    path: string;
    children?: FileNode[];
    isOpen?: boolean;
};

const getFileIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    switch (ext) {
        case "js":
        case "jsx":
        case "ts":
        case "tsx":
            return <FileCode className="w-4 h-4 text-yellow-400" />;
        case "json":
            return <FileJson className="w-4 h-4 text-yellow-600" />;
        case "css":
        case "scss":
            return <FileCode className="w-4 h-4 text-blue-400" />;
        case "html":
            return <FileCode className="w-4 h-4 text-orange-400" />;
        case "md":
        case "txt":
            return <FileText className="w-4 h-4 text-gray-400" />;
        case "png":
        case "jpg":
        case "svg":
        case "gif":
            return <FileImage className="w-4 h-4 text-purple-400" />;
        default:
            return <File className="w-4 h-4 text-gray-400" />;
    }
};

export function Sidebar() {
    const { webcontainer, isLoading } = useWebContainer();
    const [selectedFile, setSelectedFile] = useAtom(selectedFileAtom);
    const [files, setFiles] = useState<FileNode[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());

    const toggleFolder = (path: string) => {
        setOpenFolders(prev => {
            const next = new Set(prev);
            if (next.has(path)) {
                next.delete(path);
            } else {
                next.add(path);
            }
            return next;
        });
    };

    const fetchFiles = async (dir: string = "/"): Promise<FileNode[]> => {
        if (!webcontainer) return [];
        try {
            const entries = await webcontainer.fs.readdir(dir, { withFileTypes: true });
            const filteredEntries = entries.filter(entry => {
                const name = entry.name;
                return name !== "node_modules" && !name.startsWith(".");
            });

            const nodes: FileNode[] = await Promise.all(
                filteredEntries.map(async (entry) => {
                    const path = dir === "/" ? entry.name : `${dir}/${entry.name}`;
                    if (entry.isDirectory()) {
                        return {
                            name: entry.name,
                            kind: "directory",
                            path,
                            children: await fetchFiles(path),
                        };
                    } else {
                        return {
                            name: entry.name,
                            kind: "file",
                            path,
                        };
                    }
                })
            );
            return nodes.sort((a, b) => {
                if (a.kind === b.kind) return a.name.localeCompare(b.name);
                return a.kind === "directory" ? -1 : 1;
            });
        } catch (error) {
            console.error("Error reading files:", error);
            return [];
        }
    };

    const refreshFiles = async () => {
        if (!webcontainer) return;
        setRefreshing(true);
        const nodes = await fetchFiles();
        setFiles(nodes);
        setRefreshing(false);
    };

    useEffect(() => {
        if (webcontainer) {
            refreshFiles();
            const interval = setInterval(refreshFiles, 3000);
            return () => clearInterval(interval);
        }
    }, [webcontainer]);

    const FileTree = ({ nodes, depth = 0 }: { nodes: FileNode[]; depth?: number }) => {
        return (
            <div className={depth > 0 ? "ml-3 border-l border-[#1e1e2e] pl-2" : ""}>
                {nodes.map((node) => {
                    const isOpen = openFolders.has(node.path);
                    const isSelected = selectedFile === node.path;

                    return (
                        <div key={node.path}>
                            <div
                                className={`flex items-center gap-2 py-1 px-2 rounded-md cursor-pointer transition-all duration-150 text-sm
                                    ${isSelected
                                        ? "bg-indigo-500/20 text-white"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                    }`}
                                onClick={() => {
                                    if (node.kind === "file") {
                                        setSelectedFile(node.path);
                                    } else {
                                        toggleFolder(node.path);
                                    }
                                }}
                            >
                                {node.kind === "directory" ? (
                                    <>
                                        {isOpen ? (
                                            <ChevronDown className="w-3 h-3 text-gray-500" />
                                        ) : (
                                            <ChevronRight className="w-3 h-3 text-gray-500" />
                                        )}
                                        {isOpen ? (
                                            <FolderOpen className="w-4 h-4 text-indigo-400" />
                                        ) : (
                                            <Folder className="w-4 h-4 text-indigo-400" />
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <span className="w-3" />
                                        {getFileIcon(node.name)}
                                    </>
                                )}
                                <span className="truncate">{node.name}</span>
                            </div>
                            {node.children && isOpen && (
                                <FileTree nodes={node.children} depth={depth + 1} />
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="w-60 bg-[#0a0a0f] border-r border-[#1e1e2e] flex flex-col">
            <div className="p-3 border-b border-[#1e1e2e] flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-300">
                    <Files className="w-4 h-4" />
                    <span className="text-sm font-medium">Explorer</span>
                </div>
                <button
                    onClick={refreshFiles}
                    disabled={refreshing}
                    className="p-1.5 hover:bg-white/5 rounded transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${refreshing ? "animate-spin" : ""}`} />
                </button>
            </div>
            <div className="flex-1 p-2 overflow-y-auto custom-scrollbar">
                {isLoading ? (
                    <div className="flex items-center gap-2 text-gray-500 text-sm p-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Booting container...</span>
                    </div>
                ) : files.length === 0 ? (
                    <div className="text-gray-500 text-sm p-2 text-center">
                        No files yet
                    </div>
                ) : (
                    <FileTree nodes={files} />
                )}
            </div>
        </div>
    );
}

