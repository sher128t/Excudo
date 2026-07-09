import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAtom } from "jotai";
import { useWebContainer } from "~/context/WebContainerContext";
import { useProject } from "~/context/ProjectContext";
import { useAuth } from "~/context/AuthContext";
import { fixRequestAtom } from "~/store/atoms";
import { DEFAULT_PROJECT_STYLE, getTemplateFiles, normalizeProjectStyle, type ProjectStyle } from "~/lib/template";
import { createProjectVersion } from "~/lib/projects";
import { Send, Bot, User, FileCode, Terminal, Check, Loader2, Trash2, Sparkles, Square, Paperclip, X, AlertCircle, RefreshCw, Zap, Crown, MessageCircle, Eye, FolderTree, LayoutTemplate, Box } from "lucide-react";
import { ActionChips } from "./ActionChips";
import { FileAttachModal, type AttachedFile } from "./FileAttachModal";
import ReactMarkdown from "react-markdown";

export type ModelMode = "plan" | "fast" | "thinking";

const AUTO_FIX_PREFIX = "[EXCUDO_AUTO_FIX]";

function isAutoFixMessageContent(content: unknown) {
    return typeof content === "string" && content.startsWith(AUTO_FIX_PREFIX);
}

function createAutoFixPrompt(errorText: string) {
    return `${AUTO_FIX_PREFIX}\nThe app has a build/runtime error. Here is the dev server output:\n\n\`\`\`\n${errorText}\n\`\`\`\n\nFind the root cause and fix it. Keep this repair quiet and do not mention internal automation markers.`;
}

function resizePromptTextarea(textarea: HTMLTextAreaElement) {
    textarea.style.height = "auto";
    const maxHeight = 180;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
}

function inferProjectStyleFromFiles(files: Record<string, string>): ProjectStyle {
    const packageJson = files["package.json"] || files["/package.json"] || "";
    return files["src/orbit/kit.jsx"] || packageJson.includes("@react-three/fiber")
        ? "immersive3d"
        : DEFAULT_PROJECT_STYLE;
}

export function ChatInterface() {
    const { writeFile, readFile, deleteFile, listFiles, runShellCommand, resetContainer, startDevServer, serverStatus, buildError } = useWebContainer();
    const { currentProject, saveProject } = useProject();
    const { profile, refreshProfile } = useAuth();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const promptInputRef = useRef<HTMLTextAreaElement>(null);
    const initialPromptHandled = useRef(false);
    const projectLoadedRef = useRef<string | null>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const fileSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastAutoFixKeyRef = useRef<string | null>(null);
    const repairInProgressRef = useRef(false);
    const [showAttachModal, setShowAttachModal] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
    const [fixRequest, setFixRequest] = useAtom(fixRequestAtom);

    // Model mode state
    const [modelMode, setModelMode] = useState<ModelMode>("fast");
    const [projectStyle, setProjectStyle] = useState<ProjectStyle>(DEFAULT_PROJECT_STYLE);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // Check if user can use thinking mode
    const canUseThinking = profile?.tier !== "free";

    // Error handling state
    const [error, setError] = useState<{ message: string; retryContent?: string } | null>(null);
    const lastMessageRef = useRef<string>("");

    // Track files for saving to project. This is the authoritative full
    // file set for the current project (template + AI writes + loads).
    const projectFilesRef = useRef<Record<string, string>>({});
    // Files explicitly deleted (so they don't resurrect on merge-save)
    const deletedFilesRef = useRef<Set<string>>(new Set());
    // Whether any files changed since the last version snapshot
    const filesChangedRef = useRef(false);

    // Ref so request-body preparation always sees the latest value
    const modelModeRef = useRef<ModelMode>(modelMode);
    modelModeRef.current = modelMode;

    const projectStyleRef = useRef<ProjectStyle>(projectStyle);
    projectStyleRef.current = projectStyle;

    // Compact project context (file tree) sent with each request
    const buildProjectContext = useCallback((): string => {
        const paths = Object.keys(projectFilesRef.current);
        if (paths.length === 0) return "";
        return `Files in the project:\n${paths.sort().map(p => `- ${p}`).join("\n")}`;
    }, []);

    const chatHelpers = useChat({
        api: "/api/chat",
        maxSteps: 30,
        experimental_prepareRequestBody: ({ messages }) => ({
            messages,
            modelMode: modelModeRef.current,
            projectStyle: projectStyleRef.current,
            projectContext: buildProjectContext(),
        }) as any,
        // Execute AI tool calls against the WebContainer. Returning a value
        // records it as the tool result and (with maxSteps) lets the model
        // continue automatically.
        onToolCall: async ({ toolCall }) => {
            const { toolName, args } = toolCall as { toolName: string; args: any };
            try {
                console.log(`Executing tool: ${toolName}`, args);

                if (toolName === "createFile" || toolName === "updateFile") {
                    await writeFile(args.path, args.content);
                    projectFilesRef.current[args.path] = args.content;
                    deletedFilesRef.current.delete(args.path);
                    filesChangedRef.current = true;
                    saveFilesToProjectRef.current();
                    return `${toolName === "createFile" ? "Created" : "Updated"} file: ${args.path}`;
                }

                if (toolName === "deleteFile") {
                    try {
                        await deleteFile(args.path);
                    } catch {
                        // File may not exist in container; still remove from tracking
                    }
                    delete projectFilesRef.current[args.path];
                    deletedFilesRef.current.add(args.path);
                    filesChangedRef.current = true;
                    saveFilesToProjectRef.current();
                    return `Deleted file: ${args.path}`;
                }

                if (toolName === "readFile") {
                    const content = await readFile(args.path);
                    return content.length > 30000
                        ? content.slice(0, 30000) + "\n... [truncated]"
                        : content;
                }

                if (toolName === "listFiles") {
                    const files = await listFiles();
                    return files.join("\n") || "(no files)";
                }

                if (toolName === "runCommand") {
                    const { exitCode, output } = await runShellCommand(args.command);
                    const tail = output.length > 2000 ? "...\n" + output.slice(-2000) : output;
                    return exitCode === 0
                        ? `Command succeeded (exit 0):\n${tail}`
                        : `Command FAILED (exit ${exitCode}):\n${tail}`;
                }

                return `Unknown tool: ${toolName}`;
            } catch (err) {
                console.error(`Error executing ${toolName}:`, err);
                return `Error: ${err instanceof Error ? err.message : "Unknown error"}`;
            }
        },
        onError: (error) => {
            console.error("Chat error:", error);
            // Parse error message for user-friendly display
            let errorMessage = "Something went wrong. Please try again.";
            if (error.message.includes("Not authenticated")) {
                errorMessage = "Your session has expired. Please sign in again.";
            } else if (error.message.includes("credit")) {
                errorMessage = "You've run out of daily credits. They reset tomorrow.";
            } else if (error.message.includes("rate limit")) {
                errorMessage = "Rate limit reached. Please wait a moment and try again.";
            } else if (error.message.includes("network") || error.message.includes("fetch")) {
                errorMessage = "Network error. Please check your connection and try again.";
            } else if (error.message.includes("timeout")) {
                errorMessage = "Request timed out. Please try again.";
            }
            setError({ message: errorMessage, retryContent: lastMessageRef.current });
        },
        onFinish: () => {
            console.log("Chat finished");
            setError(null); // Clear any error on success
            // Update the credit counter (credits are deducted server-side)
            refreshProfile();
        },
    });

    const { messages, input, handleInputChange, handleSubmit: originalHandleSubmit, isLoading, setMessages, setInput, append, stop } = chatHelpers;

    // Wrap handleSubmit to track last message and include images
    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() && attachedFiles.length === 0) return;

        lastMessageRef.current = input;
        setError(null);

        // If there are attached images, use append with multimodal content
        if (attachedFiles.length > 0) {
            const content: Array<{ type: "text"; text: string } | { type: "image"; image: string }> = [];

            // Add text if present
            if (input.trim()) {
                content.push({ type: "text", text: input });
            }

            // Add images
            for (const file of attachedFiles) {
                content.push({ type: "image", image: file.dataUrl });
            }

            // Send with multimodal content (type assertion needed - runtime supports it)
            append({ role: "user", content: content as unknown as string });

            // Clear input and attachments
            setInput("");
            setAttachedFiles([]);
            requestAnimationFrame(() => {
                if (promptInputRef.current) resizePromptTextarea(promptInputRef.current);
            });
        } else {
            // No images, use standard submit
            originalHandleSubmit(e);
            requestAnimationFrame(() => {
                if (promptInputRef.current) resizePromptTextarea(promptInputRef.current);
            });
        }
    }, [input, originalHandleSubmit, attachedFiles, append, setInput]);

    // Retry function
    const handleRetry = useCallback(() => {
        if (error?.retryContent) {
            setError(null);
            append({ role: "user", content: error.retryContent });
        }
    }, [error, append]);

    // Track previous loading state for detecting when chat finishes
    const wasLoadingRef = useRef(false);
    const devServerStartedRef = useRef(false);

    // When chat finishes: auto-start dev server (first generation) and
    // snapshot a project version if files changed
    useEffect(() => {
        if (wasLoadingRef.current && !isLoading) {
            // Small delay to ensure all file writes are processed
            setTimeout(() => {
                const hasFiles = Object.keys(projectFilesRef.current).length > 0;
                const hasPackageJson = projectFilesRef.current["package.json"] || projectFilesRef.current["/package.json"];

                // Only auto-start if we have files, have package.json, server is idle, and haven't started yet
                if (hasFiles && hasPackageJson && serverStatus === "idle" && !devServerStartedRef.current) {
                    console.log("Chat finished with files - starting dev server");
                    devServerStartedRef.current = true;
                    startDevServer();
                }

                if (hasFiles && hasPackageJson && serverStatus === "error" && repairInProgressRef.current) {
                    console.log("Repair finished - retrying dev server");
                    repairInProgressRef.current = false;
                    startDevServer();
                } else if (repairInProgressRef.current && serverStatus !== "error") {
                    repairInProgressRef.current = false;
                }

                // Version snapshot (Phase: history & rollback)
                if (filesChangedRef.current && currentProject && hasFiles) {
                    filesChangedRef.current = false;
                    const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
                    const label = isAutoFixMessageContent(lastUserMsg?.content)
                        ? "Auto repair"
                        : typeof lastUserMsg?.content === "string"
                        ? lastUserMsg.content.slice(0, 80)
                        : "AI edit";
                    createProjectVersion(currentProject.id, { ...projectFilesRef.current }, label)
                        .catch(err => console.error("Failed to snapshot version:", err));
                }
            }, 500);
        }
        wasLoadingRef.current = isLoading;
    }, [isLoading, serverStatus, startDevServer, currentProject, messages]);

    // Consume "Fix with AI" requests from the Preview panel
    useEffect(() => {
        if (fixRequest && !isLoading) {
            const errorText = fixRequest;
            setFixRequest(null);
            lastMessageRef.current = "Fix the build error";
            repairInProgressRef.current = true;
            append({
                role: "user",
                content: createAutoFixPrompt(errorText),
            });
        }
    }, [fixRequest, isLoading, append, setFixRequest]);

    // Automatically repair detected preview/build errors without exposing raw logs.
    useEffect(() => {
        if (!buildError || isLoading || modelModeRef.current === "plan") return;

        const errorKey = buildError.replace(/\s+/g, " ").trim().slice(-1200);
        if (!errorKey || lastAutoFixKeyRef.current === errorKey) return;

        lastAutoFixKeyRef.current = errorKey;
        setFixRequest(null);
        lastMessageRef.current = "Auto-fix build error";
        repairInProgressRef.current = true;
        append({
            role: "user",
            content: createAutoFixPrompt(buildError),
        });
    }, [buildError, isLoading, append, setFixRequest]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Generate a thumbnail for the project using canvas - unique subtle gradient per project
    const generateThumbnail = useCallback((projectName: string, _projectDescription?: string): string => {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';

        // Generate unique but subtle hue based on project name
        let hash = 0;
        for (let i = 0; i < projectName.length; i++) {
            hash = projectName.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash) % 360;

        // Create subtle dark gradient with unique hue
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, `hsl(${hue}, 30%, 15%)`);  // Darker, desaturated
        gradient.addColorStop(1, `hsl(${(hue + 30) % 360}, 25%, 10%)`);  // Slightly different hue
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add subtle noise/texture effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            ctx.fillRect(x, y, 2, 2);
        }

        return canvas.toDataURL('image/jpeg', 0.8);
    }, []);

    // Debounced save of project files
    const saveFilesToProject = useCallback(() => {
        if (!currentProject) return;

        if (Object.keys(projectFilesRef.current).length === 0) return;

        // Clear existing timeout
        if (fileSaveTimeoutRef.current) {
            clearTimeout(fileSaveTimeoutRef.current);
        }

        // Debounce to batch file saves
        fileSaveTimeoutRef.current = setTimeout(() => {
            // Merge with any files saved outside the chat (e.g. manual editor
            // saves), then drop explicitly deleted paths
            const mergedFiles: Record<string, string> = {
                ...(currentProject.files || {}),
                ...projectFilesRef.current,
            };
            for (const deleted of deletedFilesRef.current) {
                delete mergedFiles[deleted];
            }

            console.log("Saving files to project:", Object.keys(mergedFiles).length);

            // Generate thumbnail if not already set
            const thumbnail = currentProject.thumbnail || generateThumbnail(currentProject.name, currentProject.description);

            saveProject({ files: mergedFiles, thumbnail });
        }, 1500);
    }, [currentProject, saveProject, generateThumbnail]);

    // Stable ref so onToolCall (created once) always calls the latest saver
    const saveFilesToProjectRef = useRef(saveFilesToProject);
    saveFilesToProjectRef.current = saveFilesToProject;

    const clearChat = () => {
        setMessages([]);
        projectFilesRef.current = {};
        deletedFilesRef.current = new Set();
    };

    // Load chat messages and initialize file ref when project changes
    useEffect(() => {
        if (currentProject && projectLoadedRef.current !== currentProject.id) {
            projectLoadedRef.current = currentProject.id;

            // Load existing files into ref
            if (currentProject.files) {
                projectFilesRef.current = { ...currentProject.files };
                setProjectStyle(inferProjectStyleFromFiles(projectFilesRef.current));
            }
            deletedFilesRef.current = new Set();

            // Load chat messages with preprocessed tool states
            if (currentProject.chat_messages && currentProject.chat_messages.length > 0) {
                // Fix tool invocation states - all loaded tools are complete
                const preprocessedMessages = currentProject.chat_messages.map((message: any) => {
                    if (message.role !== 'assistant' || !message.toolInvocations) {
                        return message;
                    }
                    // Mark all tool invocations as complete since they're loaded from storage
                    const fixedInvocations = message.toolInvocations.map((tool: any) => ({
                        ...tool,
                        state: 'result',
                        result: tool.result || `${tool.toolName} completed`,
                    }));
                    return { ...message, toolInvocations: fixedInvocations };
                });
                setMessages(preprocessedMessages);
            }
        }
    }, [currentProject, setMessages]);

    // Auto-save chat messages when they change (debounced)
    useEffect(() => {
        if (!currentProject || messages.length === 0) return;
        // Don't save if we just loaded from project
        if (projectLoadedRef.current === currentProject.id &&
            currentProject.chat_messages?.length === messages.length) {
            return;
        }

        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Debounce save to avoid too many requests
        saveTimeoutRef.current = setTimeout(() => {
            saveProject({ chat_messages: messages });
        }, 2000);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [messages, currentProject, saveProject]);

    // Handle initial prompt from dashboard
    useEffect(() => {
        if (initialPromptHandled.current) return;

        const initialPrompt = sessionStorage.getItem("initialPrompt");
        if (initialPrompt) {
            initialPromptHandled.current = true;
            // Set flag so editor knows this is a new project (don't auto-start)
            sessionStorage.setItem("isNewProject", "true");
            sessionStorage.removeItem("initialPrompt");

            // Read initial model mode from dashboard selection
            const initialMode = sessionStorage.getItem("initialModelMode");
            if (initialMode === "plan" || initialMode === "fast" || initialMode === "thinking") {
                setModelMode(initialMode);
            }
            sessionStorage.removeItem("initialModelMode");

            const initialProjectStyle = normalizeProjectStyle(sessionStorage.getItem("initialProjectStyle"));
            setProjectStyle(initialProjectStyle);
            sessionStorage.removeItem("initialProjectStyle");

            lastMessageRef.current = initialPrompt;

            // Reset WebContainer, mount the starter template, then prompt
            resetContainer().then(async () => {
                projectFilesRef.current = {};
                deletedFilesRef.current = new Set();
                devServerStartedRef.current = false;

                // Mount the starter template so the AI only writes src/ files
                try {
                    for (const [path, content] of Object.entries(getTemplateFiles(initialProjectStyle))) {
                        await writeFile(path, content);
                        projectFilesRef.current[path] = content;
                    }
                    console.log("Starter template mounted");
                } catch (err) {
                    console.error("Failed to mount template:", err);
                }

                setTimeout(() => {
                    append({ role: "user", content: initialPrompt });
                }, 300);
            });
        }
    }, [append, resetContainer, writeFile]);

    const getToolIcon = (toolName: string) => {
        switch (toolName) {
            case "createFile":
            case "updateFile":
                return <FileCode className="w-3 h-3" />;
            case "readFile":
                return <Eye className="w-3 h-3" />;
            case "listFiles":
                return <FolderTree className="w-3 h-3" />;
            case "runCommand":
                return <Terminal className="w-3 h-3" />;
            default:
                return <Check className="w-3 h-3" />;
        }
    };

    const examplePrompts = [
        "A fitness tracking app",
        "Portfolio website",
        "E-commerce landing",
    ];

    return (
        <div className="h-full flex flex-col bg-[#0a0a0f]">
            {/* Header */}
            <div className="p-3 border-b border-[#1e1e2e] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-md flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-300">AI Assistant</span>
                </div>
                {messages.length > 0 && (
                    <button
                        onClick={clearChat}
                        className="p-1.5 hover:bg-white/5 rounded transition-colors"
                        title="Clear chat"
                    >
                        <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-gray-300" />
                    </button>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center h-full">
                        <div className="text-center max-w-md">
                            {/* Animated gradient orb */}
                            <div className="relative w-20 h-20 mx-auto mb-6">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl opacity-20 blur-xl animate-pulse" />
                                <div className="relative w-full h-full bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                                    <Sparkles className="w-9 h-9 text-indigo-400" />
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">What would you like to build?</h3>
                            <p className="text-sm text-gray-400 mb-6">Describe your idea and I'll create a complete, working application.</p>

                            {/* Example prompts */}
                            <div className="flex flex-wrap gap-2 justify-center">
                                {examplePrompts.map((prompt) => (
                                    <button
                                        key={prompt}
                                        type="button"
                                        onClick={() => {
                                            setInput(prompt);
                                            requestAnimationFrame(() => {
                                                if (promptInputRef.current) resizePromptTextarea(promptInputRef.current);
                                            });
                                        }}
                                        className="px-3 py-1.5 text-xs text-gray-400 bg-[#12121a] border border-[#1e1e2e] rounded-lg hover:border-indigo-500/50 hover:text-white transition-colors"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    messages.filter((message) => !isAutoFixMessageContent(message.content)).map((message) => (
                        <div
                            key={message.id}
                            className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            {message.role === "assistant" && (
                                <div className="w-7 h-7 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-3.5 h-3.5 text-indigo-400" />
                                </div>
                            )}
                            <div
                                className={`max-w-[85%] rounded-xl px-4 py-2.5 ${message.role === "user"
                                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                                    : "bg-[#12121a] border border-[#1e1e2e] text-gray-300"
                                    }`}
                            >
                                {/* Tool invocations - Cleaner step-list style */}
                                {message.toolInvocations && message.toolInvocations.length > 0 && (
                                    <div className="mb-3 rounded-lg border border-[#1e1e2e] bg-[#0d0d14] overflow-hidden">
                                        {(message.toolInvocations as any[]).map((tool: any, i: number) => (
                                            <div
                                                key={i}
                                                className={`flex items-center gap-3 px-3 py-2 text-sm ${i !== 0 ? 'border-t border-[#1e1e2e]' : ''}`}
                                            >
                                                {/* Status indicator */}
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${(tool.state === 'result' || tool.result)
                                                    ? 'bg-emerald-500/20'
                                                    : 'bg-[#1e1e2e]'
                                                    }`}>
                                                    {tool.state === 'call' && !tool.result ? (
                                                        <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                                                    ) : (
                                                        <Check className="w-3 h-3 text-emerald-400" />
                                                    )}
                                                </div>
                                                {/* Tool info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-400">{getToolIcon(tool.toolName)}</span>
                                                        <span className="text-gray-300 font-medium">{tool.toolName}</span>
                                                        <span className="text-gray-500 truncate text-xs">
                                                            {tool.args?.path || tool.args?.command || ''}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {/* Message content */}
                                {message.content && (
                                    <div className="text-sm">
                                        {typeof message.content === "string"
                                            ? (message.role === "assistant" ? (
                                                <ReactMarkdown
                                                    components={{
                                                        h1: ({ children }) => <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0">{children}</h1>,
                                                        h2: ({ children }) => <h2 className="text-lg font-semibold mb-2 mt-3 first:mt-0">{children}</h2>,
                                                        h3: ({ children }) => <h3 className="text-base font-medium mb-2 mt-2 first:mt-0">{children}</h3>,
                                                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                                        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                                                        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                                                        li: ({ children }) => <li className="text-gray-300">{children}</li>,
                                                        code: ({ className, children }) => {
                                                            const isBlock = className?.includes('language-');
                                                            return isBlock ? (
                                                                <pre className="bg-black/30 rounded-lg p-3 my-2 overflow-x-auto">
                                                                    <code className="text-sm text-emerald-400">{children}</code>
                                                                </pre>
                                                            ) : (
                                                                <code className="bg-white/10 px-1.5 py-0.5 rounded text-pink-400">{children}</code>
                                                            );
                                                        },
                                                        pre: ({ children }) => <>{children}</>,
                                                        blockquote: ({ children }) => (
                                                            <blockquote className="border-l-2 border-purple-500 pl-3 my-2 text-gray-300 italic">{children}</blockquote>
                                                        ),
                                                        strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                                                        em: ({ children }) => <em className="italic">{children}</em>,
                                                    }}
                                                >
                                                    {message.content}
                                                </ReactMarkdown>
                                            ) : (
                                                <span className="whitespace-pre-wrap">{message.content}</span>
                                            ))
                                            : Array.isArray(message.content)
                                                ? (message.content as any[]).map((part: any, i: number) => (
                                                    <span key={i}>
                                                        {part.type === "text" && part.text}
                                                        {part.type === "image" && (
                                                            <img
                                                                src={part.image}
                                                                alt="Attached"
                                                                className="max-w-xs rounded-lg mt-2 border border-[#1e1e2e]"
                                                            />
                                                        )}
                                                    </span>
                                                ))
                                                : null
                                        }
                                    </div>
                                )}
                            </div>
                            {message.role === "user" && (
                                <div className="w-7 h-7 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <User className="w-3.5 h-3.5 text-white" />
                                </div>
                            )}
                        </div>
                    ))
                )}
                {isLoading && (
                    <div className="flex gap-3">
                        <div className="w-7 h-7 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-lg flex items-center justify-center">
                            <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                        </div>
                        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl px-4 py-2.5">
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <span>Thinking</span>
                                <span className="flex gap-0.5">
                                    <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </span>
                            </div>
                        </div>
                    </div>
                )}
                {/* Error banner with retry */}
                {error && !isLoading && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-red-400 font-medium mb-1">Error</p>
                                <p className="text-sm text-red-300/80">{error.message}</p>
                            </div>
                            {error.retryContent && (
                                <button
                                    onClick={handleRetry}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Retry
                                </button>
                            )}
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Action Chips */}
            <ActionChips
                onAction={(prompt) => {
                    lastMessageRef.current = prompt;
                    append({ role: "user", content: prompt });
                }}
                disabled={isLoading}
            />

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-[#1e1e2e]">
                {/* Attached files preview */}
                {attachedFiles.length > 0 && (
                    <div className="flex gap-2 mb-3 flex-wrap">
                        {attachedFiles.map((file) => (
                            <div key={file.id} className="relative group">
                                <img
                                    src={file.dataUrl}
                                    alt={file.name}
                                    className="w-16 h-16 object-cover rounded-lg border border-[#1e1e2e]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setAttachedFiles(prev => prev.filter(f => f.id !== file.id))}
                                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Model Selector */}
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                    {/* Plan mode - separate */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Mode:</span>
                        <div className="bg-[#12121a] rounded-lg p-1 border border-[#1e1e2e]">
                            <button
                                type="button"
                                onClick={() => setModelMode("plan")}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${modelMode === "plan"
                                    ? "bg-indigo-500/20 text-indigo-400"
                                    : "text-gray-400 hover:text-white"
                                    }`}
                            >
                                <MessageCircle className="w-3 h-3" />
                                Plan
                            </button>
                        </div>
                    </div>

                    {/* Separator */}
                    <div className="h-4 w-px bg-[#1e1e2e]" />

                    {/* Project style selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Style:</span>
                        <div className="flex bg-[#12121a] rounded-lg p-1 border border-[#1e1e2e]">
                            <button
                                type="button"
                                onClick={() => setProjectStyle("traditional")}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${projectStyle === "traditional"
                                    ? "bg-sky-500/20 text-sky-300"
                                    : "text-gray-400 hover:text-white"
                                    }`}
                            >
                                <LayoutTemplate className="w-3 h-3" />
                                Classic
                            </button>
                            <button
                                type="button"
                                onClick={() => setProjectStyle("immersive3d")}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${projectStyle === "immersive3d"
                                    ? "bg-fuchsia-500/20 text-fuchsia-300"
                                    : "text-gray-400 hover:text-white"
                                    }`}
                            >
                                <Box className="w-3 h-3" />
                                3D
                            </button>
                        </div>
                    </div>

                    {/* Separator */}
                    <div className="h-4 w-px bg-[#1e1e2e]" />

                    {/* Build modes - grouped */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Build:</span>
                        <div className="flex bg-[#12121a] rounded-lg p-1 border border-[#1e1e2e]">
                            <button
                                type="button"
                                onClick={() => setModelMode("fast")}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${modelMode === "fast"
                                    ? "bg-amber-500/20 text-amber-400"
                                    : "text-gray-400 hover:text-white"
                                    }`}
                            >
                                <Zap className="w-3 h-3" />
                                Fast
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (canUseThinking) {
                                        setModelMode("thinking");
                                    } else {
                                        setShowUpgradeModal(true);
                                    }
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${modelMode === "thinking"
                                    ? "bg-purple-500/20 text-purple-400"
                                    : "text-gray-400 hover:text-white"
                                    }`}
                            >
                                <Crown className="w-3 h-3" />
                                Thinking
                                {!canUseThinking && (
                                    <span className="text-[10px] bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-1.5 py-0.5 rounded-full ml-1">PRO</span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Mode description */}
                    <span className="text-[10px] text-gray-500">
                        {modelMode === "plan"
                            ? "Ask questions or plan changes without modifying code"
                            : modelMode === "fast"
                                ? "Generate code quickly"
                                : "Better quality, more thorough"}
                    </span>
                </div>

                <div className="flex gap-2 items-center relative">
                    <button
                        type="button"
                        onClick={() => setShowAttachModal(true)}
                        className={`p-3 rounded-xl transition-all ${attachedFiles.length > 0 ? 'text-indigo-400 bg-indigo-500/10 shadow-lg shadow-indigo-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        title="Attach images"
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>
                    <div className="flex-1 relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                        <textarea
                            ref={promptInputRef}
                            rows={1}
                            value={input}
                            onChange={(e) => {
                                handleInputChange(e);
                                resizePromptTextarea(e.currentTarget);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    e.currentTarget.form?.requestSubmit();
                                }
                            }}
                            placeholder="Describe your app..."
                            className="relative w-full min-h-[46px] max-h-[180px] resize-none bg-[#12121a] border border-[#1e1e2e] rounded-xl px-4 py-3 text-sm leading-5 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-all"
                        />
                    </div>
                    {isLoading ? (
                        <button
                            type="button"
                            onClick={() => stop()}
                            className="px-5 py-3 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-lg shadow-red-500/20"
                        >
                            <Square className="w-4 h-4" />
                            <span>Stop</span>
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={!input.trim() && attachedFiles.length === 0}
                            className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-lg shadow-purple-500/20 disabled:shadow-none"
                        >
                            <Send className="w-4 h-4" />
                            <span>Send</span>
                        </button>
                    )}
                </div>
            </form>

            {/* Upgrade Modal */}
            {showUpgradeModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <Crown className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Upgrade to Pro</h3>
                                <p className="text-sm text-gray-400">Unlock Thinking mode</p>
                            </div>
                        </div>
                        <p className="text-gray-300 mb-4">
                            <strong>Thinking mode</strong> uses our most advanced AI model for:
                        </p>
                        <ul className="text-sm text-gray-400 space-y-2 mb-6">
                            <li className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-400" />
                                Higher quality code generation
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-400" />
                                More reliable file creation
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-400" />
                                Better understanding of complex requests
                            </li>
                        </ul>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowUpgradeModal(false)}
                                className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium transition-colors"
                            >
                                Maybe later
                            </button>
                            <a
                                href="/pricing"
                                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-medium transition-colors text-center"
                            >
                                View Plans
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* File Attach Modal */}
            <FileAttachModal
                isOpen={showAttachModal}
                onClose={() => setShowAttachModal(false)}
                onAttach={(files) => setAttachedFiles(prev => [...prev, ...files])}
            />
        </div>
    );
}
