import Editor, { type OnMount } from "@monaco-editor/react";
import { useAtom } from "jotai";
import { selectedFileAtom, fileContentAtom } from "~/store/atoms";
import { useWebContainer } from "~/context/WebContainerContext";
import { useProject } from "~/context/ProjectContext";
import { useEffect, useCallback, useState } from "react";
import { File, Save, X, RefreshCw } from "lucide-react";

export function CodeEditor() {
    const [selectedFile, setSelectedFile] = useAtom(selectedFileAtom);
    const [fileContent, setFileContent] = useAtom(fileContentAtom);
    const { readFile, writeFile } = useWebContainer();
    const { currentProject, saveProject } = useProject();
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
            // Persist to Supabase so manual edits survive reloads
            if (currentProject) {
                await saveProject({
                    files: {
                        ...(currentProject.files || {}),
                        [selectedFile]: fileContent,
                    },
                });
            }
            setOriginalContent(fileContent);
            setHasChanges(false);
            console.log(`Saved: ${selectedFile}`);
        } catch (error) {
            console.error("Error saving file:", error);
            setError("Failed to save file");
        } finally {
            setIsSaving(false);
        }
    }, [selectedFile, fileContent, writeFile, currentProject, saveProject]);

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
        <div className="h-full w-full flex flex-col bg-[#1e1e1e]">
            {/* File Tab Bar */}
            {selectedFile && (
                <div className="h-10 bg-[#252526] border-b border-[#2d2d2d] flex items-center px-2 flex-shrink-0">
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
                <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-2 text-sm text-red-400 flex items-center justify-between flex-shrink-0">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="hover:opacity-70">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Monaco Editor */}
            <div className="flex-1 min-h-0">
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
    );
}
