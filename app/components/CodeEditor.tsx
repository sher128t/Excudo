import Editor, { type OnMount } from "@monaco-editor/react";
import { useAtom } from "jotai";
import { selectedFileAtom, fileContentAtom } from "~/store/atoms";
import { useWebContainer } from "~/context/WebContainerContext";
import { useProject } from "~/context/ProjectContext";
import { useEffect, useCallback, useState } from "react";
import { File, Folder, ChevronRight, ChevronDown, Save, X, RefreshCw } from "lucide-react";

// File tree component
function FileTree({ files, onSelectFile, selectedFile }: {
    files: Record<string, string>;
    onSelectFile: (path: string) => void;
    selectedFile: string | null;
}) {
    const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['src', 'src/components']));

    // Build tree structure from flat file list
    const buildTree = (files: Record<string, string>) => {
        const tree: Record<string, any> = {};

        Object.keys(files).forEach(path => {
            const parts = path.replace(/^\//, '').split('/');
            let current = tree;

            parts.forEach((part, i) => {
                if (i === parts.length - 1) {
                    current[part] = { type: 'file', path };
                } else {
                    if (!current[part]) {
                        current[part] = { type: 'dir', children: {} };
                    }
                    current = current[part].children;
                }
            });
        });

        return tree;
    };

    const toggleDir = (path: string) => {
        setExpandedDirs(prev => {
            const next = new Set(prev);
            if (next.has(path)) {
                next.delete(path);
            } else {
                next.add(path);
            }
            return next;
        });
    };

    const renderNode = (name: string, node: any, path: string = '', depth: number = 0) => {
        const fullPath = path ? `${path}/${name}` : name;

        if (node.type === 'file') {
            const isSelected = selectedFile === node.path;
            return (
                <button
                    key={fullPath}
                    onClick={() => onSelectFile(node.path)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-white/5 transition-colors ${isSelected ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-400'
                        }`}
                    style={{ paddingLeft: `${depth * 12 + 8}px` }}
                >
                    <File className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{name}</span>
                </button>
            );
        }

        const isExpanded = expandedDirs.has(fullPath);

        return (
            <div key={fullPath}>
                <button
                    onClick={() => toggleDir(fullPath)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-sm text-gray-300 hover:bg-white/5 transition-colors"
                    style={{ paddingLeft: `${depth * 12 + 8}px` }}
                >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    <Folder className="w-4 h-4 text-indigo-400" />
                    <span>{name}</span>
                </button>
                {isExpanded && node.children && (
                    <div>
                        {Object.entries(node.children)
                            .sort(([, a]: [string, any], [, b]: [string, any]) => {
                                if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
                                return 0;
                            })
                            .map(([childName, childNode]) =>
                                renderNode(childName, childNode, fullPath, depth + 1)
                            )}
                    </div>
                )}
            </div>
        );
    };

    const tree = buildTree(files);
    const sortedEntries = Object.entries(tree).sort(([, a]: [string, any], [, b]: [string, any]) => {
        if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
        return 0;
    });

    return (
        <div className="h-full overflow-y-auto">
            {sortedEntries.map(([name, node]) => renderNode(name, node))}
        </div>
    );
}

export function CodeEditor() {
    const [selectedFile, setSelectedFile] = useAtom(selectedFileAtom);
    const [fileContent, setFileContent] = useAtom(fileContentAtom);
    const { readFile, writeFile } = useWebContainer();
    const { currentProject } = useProject();
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [originalContent, setOriginalContent] = useState("");
    const [error, setError] = useState<string | null>(null);

    // Get files from project
    const files = currentProject?.files || {};

    // Load file content when selected file changes
    useEffect(() => {
        const loadFile = async () => {
            if (selectedFile) {
                setError(null);
                try {
                    const content = await readFile(selectedFile);
                    setFileContent(content);
                    setOriginalContent(content);
                    setHasChanges(false);
                } catch (error) {
                    console.error("Error reading file:", error);
                    // Try to get from project files directly
                    if (files[selectedFile]) {
                        setFileContent(files[selectedFile]);
                        setOriginalContent(files[selectedFile]);
                        setHasChanges(false);
                    } else {
                        setError("Could not load file");
                        setFileContent("// Error loading file");
                    }
                }
            }
        };
        loadFile();
    }, [selectedFile, readFile, setFileContent, files]);

    // Track changes
    useEffect(() => {
        setHasChanges(fileContent !== originalContent);
    }, [fileContent, originalContent]);

    // Save file
    const handleSave = useCallback(async () => {
        if (!selectedFile) return;

        setIsSaving(true);
        setError(null);
        try {
            await writeFile(selectedFile, fileContent);
            setOriginalContent(fileContent);
            setHasChanges(false);
            console.log(`Saved: ${selectedFile}`);
        } catch (error) {
            console.error("Error saving file:", error);
            setError("Failed to save file");
        } finally {
            setIsSaving(false);
        }
    }, [selectedFile, fileContent, writeFile]);

    // Handle editor mount for keyboard shortcuts
    const handleEditorMount: OnMount = useCallback((editor, monaco) => {
        // Add Ctrl+S save functionality
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            handleSave();
        });
    }, [handleSave]);

    // Get language from file extension
    const getLanguage = (filename: string | null): string => {
        if (!filename) return "plaintext";
        const ext = filename.split(".").pop()?.toLowerCase();
        const languageMap: Record<string, string> = {
            js: "javascript",
            jsx: "javascript",
            ts: "typescript",
            tsx: "typescript",
            json: "json",
            html: "html",
            css: "css",
            md: "markdown",
            py: "python",
            scss: "scss",
            less: "less",
            yaml: "yaml",
            yml: "yaml",
            xml: "xml",
            sql: "sql",
        };
        return languageMap[ext || ""] || "plaintext";
    };

    return (
        <div className="h-full w-full flex bg-[#1e1e1e]">
            {/* File Tree Sidebar */}
            <div className="w-56 border-r border-[#2d2d2d] bg-[#18181b] flex flex-col">
                <div className="px-3 py-2 border-b border-[#2d2d2d] text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Files
                </div>
                {Object.keys(files).length > 0 ? (
                    <FileTree
                        files={files}
                        onSelectFile={setSelectedFile}
                        selectedFile={selectedFile}
                    />
                ) : (
                    <div className="p-3 text-sm text-gray-500">
                        No files yet. Create a project first.
                    </div>
                )}
            </div>

            {/* Editor */}
            <div className="flex-1 flex flex-col">
                {/* File Tab Bar */}
                {selectedFile && (
                    <div className="h-10 bg-[#252526] border-b border-[#2d2d2d] flex items-center px-2">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1e1e1e] rounded-t text-sm">
                            <File className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-300">{selectedFile.split('/').pop()}</span>
                            {hasChanges && <span className="w-2 h-2 bg-indigo-400 rounded-full" />}
                            <button
                                onClick={() => setSelectedFile(null)}
                                className="ml-2 text-gray-500 hover:text-white"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="flex-1" />
                        {/* Save button */}
                        <button
                            onClick={handleSave}
                            disabled={!hasChanges || isSaving}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${hasChanges
                                    ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'
                                    : 'text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            {isSaving ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            <span>{isSaving ? 'Saving...' : 'Save'}</span>
                        </button>
                    </div>
                )}

                {/* Error banner */}
                {error && (
                    <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-2 text-sm text-red-400 flex items-center justify-between">
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="hover:opacity-70">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Monaco Editor */}
                <div className="flex-1">
                    {selectedFile ? (
                        <Editor
                            height="100%"
                            language={getLanguage(selectedFile)}
                            value={fileContent}
                            theme="vs-dark"
                            onChange={(value) => setFileContent(value || "")}
                            onMount={handleEditorMount}
                            options={{
                                minimap: { enabled: true },
                                fontSize: 14,
                                wordWrap: "on",
                                automaticLayout: true,
                                scrollBeyondLastLine: false,
                                lineNumbers: "on",
                                renderWhitespace: "selection",
                                tabSize: 2,
                                insertSpaces: true,
                                folding: true,
                                bracketPairColorization: { enabled: true },
                            }}
                        />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4">
                            <File className="w-16 h-16 opacity-20" />
                            <div className="text-center">
                                <p className="text-lg font-medium text-gray-400">No file selected</p>
                                <p className="text-sm">Select a file from the sidebar to start editing</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
