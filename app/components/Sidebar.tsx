import { useEffect, useState } from "react";
import { Folder, File, RefreshCw } from "lucide-react";
import { useWebContainer } from "~/context/WebContainerContext";
import { useSetAtom } from "jotai";
import { selectedFileAtom } from "~/store/atoms";
import type { DirEnt } from "@webcontainer/api";

type FileNode = {
    name: string;
    kind: "file" | "directory";
    path: string;
    children?: FileNode[];
};

export function Sidebar() {
    const { webcontainer, isLoading } = useWebContainer();
    const setSelectedFile = useSetAtom(selectedFileAtom);
    const [files, setFiles] = useState<FileNode[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchFiles = async (dir: string = "/"): Promise<FileNode[]> => {
        if (!webcontainer) return [];
        try {
            const entries = await webcontainer.fs.readdir(dir, { withFileTypes: true });
            const nodes: FileNode[] = await Promise.all(
                entries.map(async (entry) => {
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
            // Poll for changes every 2 seconds
            const interval = setInterval(refreshFiles, 2000);
            return () => clearInterval(interval);
        }
    }, [webcontainer]);

    const FileTree = ({ nodes, depth = 0 }: { nodes: FileNode[]; depth?: number }) => {
        return (
            <div className="pl-2">
                {nodes.map((node) => (
                    <div key={node.path}>
                        <div
                            className={`flex items-center gap-2 p-1 hover:bg-gray-800 cursor-pointer text-sm ${depth > 0 ? "ml-2" : ""
                                }`}
                            onClick={() => {
                                if (node.kind === "file") {
                                    setSelectedFile(node.path);
                                }
                            }}
                        >
                            {node.kind === "directory" ? (
                                <Folder size={14} className="text-blue-400" />
                            ) : (
                                <File size={14} className="text-gray-400" />
                            )}
                            <span>{node.name}</span>
                        </div>
                        {node.children && <FileTree nodes={node.children} depth={depth + 1} />}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="w-64 bg-gray-900 text-white border-r border-gray-800 flex flex-col">
            <div className="p-4 border-b border-gray-800 font-bold flex justify-between items-center">
                <span>Explorer</span>
                <button onClick={refreshFiles} className="hover:text-blue-400">
                    <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                </button>
            </div>
            <div className="flex-1 p-2 overflow-y-auto">
                {isLoading ? (
                    <div className="text-gray-500 text-sm italic p-2">Booting...</div>
                ) : (
                    <FileTree nodes={files} />
                )}
            </div>
        </div>
    );
}
