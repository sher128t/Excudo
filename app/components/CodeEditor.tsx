import Editor, { type OnMount } from "@monaco-editor/react";
import { useAtom } from "jotai";
import { selectedFileAtom, fileContentAtom } from "~/store/atoms";
import { useWebContainer } from "~/context/WebContainerContext";
import { useEffect, useCallback } from "react";

export function CodeEditor() {
    const [selectedFile] = useAtom(selectedFileAtom);
    const [fileContent, setFileContent] = useAtom(fileContentAtom);
    const { readFile, writeFile } = useWebContainer();

    // Load file content when selected file changes
    useEffect(() => {
        const loadFile = async () => {
            if (selectedFile) {
                try {
                    const content = await readFile(selectedFile);
                    setFileContent(content);
                } catch (error) {
                    console.error("Error reading file:", error);
                    setFileContent("// Error loading file");
                }
            }
        };
        loadFile();
    }, [selectedFile, readFile, setFileContent]);

    // Handle editor mount for keyboard shortcuts
    const handleEditorMount: OnMount = useCallback((editor, monaco) => {
        // Add Ctrl+S save functionality
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, async () => {
            if (selectedFile) {
                const content = editor.getValue();
                try {
                    await writeFile(selectedFile, content);
                    console.log(`Saved: ${selectedFile}`);
                } catch (error) {
                    console.error("Error saving file:", error);
                }
            }
        });
    }, [selectedFile, writeFile]);

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
        };
        return languageMap[ext || ""] || "plaintext";
    };

    return (
        <div className="h-full w-full bg-[#1e1e1e]">
            {selectedFile ? (
                <Editor
                    height="100%"
                    language={getLanguage(selectedFile)}
                    value={fileContent}
                    theme="vs-dark"
                    onChange={(value) => setFileContent(value || "")}
                    onMount={handleEditorMount}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        wordWrap: "on",
                        automaticLayout: true,
                    }}
                />
            ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                    // Select a file to edit
                </div>
            )}
        </div>
    );
}
