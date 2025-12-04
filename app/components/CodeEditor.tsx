import Editor, { type OnMount } from "@monaco-editor/react";
import { useAtom } from "jotai";
import { selectedFileAtom } from "~/store/atoms";
import { useWebContainer } from "~/context/WebContainerContext";
import { useEffect, useState, useRef } from "react";

export function CodeEditor() {
    const [selectedFile] = useAtom(selectedFileAtom);
    const { readFile, writeFile } = useWebContainer();
    const [content, setContent] = useState("// Select a file to edit");
    const editorRef = useRef<any>(null);

    useEffect(() => {
        async function loadFile() {
            if (selectedFile) {
                try {
                    const fileContent = await readFile(selectedFile);
                    setContent(fileContent);
                } catch (error) {
                    console.error("Error reading file:", error);
                    setContent("// Error reading file");
                }
            }
        }
        loadFile();
    }, [selectedFile, readFile]);

    const handleEditorDidMount: OnMount = (editor) => {
        editorRef.current = editor;
    };

    const handleChange = (value: string | undefined) => {
        if (selectedFile && value !== undefined) {
            // Auto-save logic could go here, or debounce it
            // For now, let's just write directly (maybe debounce in real app)
            // writeFile(selectedFile, value);
        }
    };

    // Save on Ctrl+S
    const handleKeyDown = async (e: React.KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "s") {
            e.preventDefault();
            if (selectedFile && editorRef.current) {
                const value = editorRef.current.getValue();
                await writeFile(selectedFile, value);
                console.log("Saved", selectedFile);
            }
        }
    };

    return (
        <div className="flex-1 h-full" onKeyDown={handleKeyDown}>
            <Editor
                height="100%"
                path={selectedFile || undefined}
                defaultLanguage="typescript"
                value={content}
                theme="vs-dark"
                onChange={handleChange}
                onMount={handleEditorDidMount}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    automaticLayout: true,
                }}
            />
        </div>
    );
}
