import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useWebContainer } from "~/context/WebContainerContext";
import { useProject } from "~/context/ProjectContext";
import { Send, Bot, User, FileCode, Terminal, Check, Loader2, Trash2, Sparkles, Square, Paperclip, X, Image as ImageIcon, AlertCircle, RefreshCw } from "lucide-react";
import { ActionChips } from "./ActionChips";
import { FileAttachModal, type AttachedFile } from "./FileAttachModal";

export function ChatInterface() {
    const { writeFile, readFile, runCommand, resetContainer, startDevServer, serverStatus } = useWebContainer();
    const { currentProject, saveProject } = useProject();
    const processedToolCalls = useRef<Set<string>>(new Set());
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const initialPromptHandled = useRef(false);
    const projectLoadedRef = useRef<string | null>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const fileSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [showAttachModal, setShowAttachModal] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

    // Error handling state
    const [error, setError] = useState<{ message: string; retryContent?: string } | null>(null);
    const lastMessageRef = useRef<string>("");

    // Track files for saving to project
    const projectFilesRef = useRef<Record<string, string>>({});

    const chatHelpers = useChat({
        api: "/api/chat",
        maxSteps: 10,
        onError: (error) => {
            console.error("Chat error:", error);
            // Parse error message for user-friendly display
            let errorMessage = "Something went wrong. Please try again.";
            if (error.message.includes("rate limit")) {
                errorMessage = "Rate limit reached. Please wait a moment and try again.";
            } else if (error.message.includes("network") || error.message.includes("fetch")) {
                errorMessage = "Network error. Please check your connection and try again.";
            } else if (error.message.includes("timeout")) {
                errorMessage = "Request timed out. Please try again.";
            } else if (error.message.includes("credit")) {
                errorMessage = "You've run out of credits. Please upgrade your plan.";
            }
            setError({ message: errorMessage, retryContent: lastMessageRef.current });
        },
        onFinish: () => {
            console.log("Chat finished");
            setError(null); // Clear any error on success
        },
    });

    const { messages, input, handleInputChange, handleSubmit: originalHandleSubmit, isLoading, setMessages, setInput, append, stop } = chatHelpers;

    // Wrap handleSubmit to track last message
    const handleSubmit = useCallback((e: React.FormEvent) => {
        lastMessageRef.current = input;
        setError(null);
        originalHandleSubmit(e);
    }, [input, originalHandleSubmit]);

    // Retry function
    const handleRetry = useCallback(() => {
        if (error?.retryContent) {
            setError(null);
            append({ role: "user", content: error.retryContent });
        }
    }, [error, append]);

    // Track previous loading state for detecting when chat finishes
    const wasLoadingRef = useRef(false);

    // Auto-start dev server when chat finishes and files were created
    useEffect(() => {
        // Detect when isLoading transitions from true to false (chat finished)
        if (wasLoadingRef.current && !isLoading) {
            const hasFiles = Object.keys(projectFilesRef.current).length > 0;

            // Only auto-start if we have files and server is idle
            if (hasFiles && serverStatus === "idle") {
                console.log("Chat finished with files - starting dev server");
                startDevServer();
            }
        }
        wasLoadingRef.current = isLoading;
    }, [isLoading, serverStatus, startDevServer]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Generate a thumbnail for the project using canvas
    const generateThumbnail = useCallback((projectName: string): string => {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';

        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#4f46e5');  // indigo
        gradient.addColorStop(1, '#7c3aed');  // purple
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add project name initials
        const initials = projectName
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = 'bold 80px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initials, canvas.width / 2, canvas.height / 2);

        // Add subtle grid pattern
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i < canvas.width; i += 20) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, canvas.height);
            ctx.stroke();
        }
        for (let i = 0; i < canvas.height; i += 20) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(canvas.width, i);
            ctx.stroke();
        }

        return canvas.toDataURL('image/jpeg', 0.7);
    }, []);

    // Debounced save of project files
    const saveFilesToProject = useCallback(() => {
        if (!currentProject) return;

        const files = projectFilesRef.current;
        if (Object.keys(files).length === 0) return;

        // Clear existing timeout
        if (fileSaveTimeoutRef.current) {
            clearTimeout(fileSaveTimeoutRef.current);
        }

        // Debounce to batch file saves
        fileSaveTimeoutRef.current = setTimeout(() => {
            console.log("Saving files to project:", Object.keys(files));

            // Merge with existing files
            const mergedFiles = {
                ...(currentProject.files || {}),
                ...files,
            };

            // Generate thumbnail if not already set
            const thumbnail = currentProject.thumbnail || generateThumbnail(currentProject.name);

            saveProject({ files: mergedFiles, thumbnail });
        }, 1500);
    }, [currentProject, saveProject, generateThumbnail]);

    // Process and execute tool calls, then UPDATE the messages with results
    useEffect(() => {
        const processToolCalls = async () => {
            let hasUpdates = false;
            const updatedMessages = [...messages];
            const newFiles: Record<string, string> = {};

            for (let msgIdx = 0; msgIdx < updatedMessages.length; msgIdx++) {
                const message = updatedMessages[msgIdx];
                if (!message.toolInvocations) continue;

                const updatedInvocations = [...(message.toolInvocations as any[])];

                for (let toolIdx = 0; toolIdx < updatedInvocations.length; toolIdx++) {
                    const toolInvocation = updatedInvocations[toolIdx];

                    // Skip if already processed or already has result
                    if (processedToolCalls.current.has(toolInvocation.toolCallId)) continue;
                    if (toolInvocation.state === 'result') continue;
                    if (toolInvocation.state !== 'call') continue;

                    processedToolCalls.current.add(toolInvocation.toolCallId);
                    const { toolName, args, toolCallId } = toolInvocation;
                    let result = "";

                    try {
                        console.log(`Executing tool: ${toolName}`, args);

                        if (toolName === "createFile") {
                            await writeFile(args.path, args.content);
                            result = `Created file: ${args.path}`;
                            console.log(result);
                            // Track file for saving
                            newFiles[args.path] = args.content;
                        } else if (toolName === "updateFile") {
                            await writeFile(args.path, args.content);
                            result = `Updated file: ${args.path}`;
                            console.log(result);
                            // Track file for saving
                            newFiles[args.path] = args.content;
                        } else if (toolName === "deleteFile") {
                            result = `Deleted file: ${args.path}`;
                            console.log(result);
                            // Remove from tracked files
                            delete projectFilesRef.current[args.path];
                        } else if (toolName === "runCommand") {
                            const [cmd, ...cmdArgs] = args.command.split(" ");
                            await runCommand(cmd, cmdArgs);
                            result = `Executed: ${args.command}`;
                            console.log(result);
                        }
                    } catch (error) {
                        console.error(`Error executing ${toolName}:`, error);
                        result = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
                    }

                    // Update the tool invocation with the result
                    updatedInvocations[toolIdx] = {
                        ...toolInvocation,
                        state: 'result',
                        result: result,
                    };
                    hasUpdates = true;
                }

                // Update the message with modified tool invocations
                if (hasUpdates) {
                    updatedMessages[msgIdx] = {
                        ...message,
                        toolInvocations: updatedInvocations,
                    };
                }
            }

            // Add new files to ref and trigger save
            if (Object.keys(newFiles).length > 0) {
                projectFilesRef.current = {
                    ...projectFilesRef.current,
                    ...newFiles,
                };
                saveFilesToProject();
            }

            // Only update state if we made changes
            if (hasUpdates) {
                console.log("Updating messages with tool results");
                setMessages(updatedMessages);
            }
        };

        processToolCalls();
    }, [messages, writeFile, runCommand, setMessages, saveFilesToProject]);

    const clearChat = () => {
        setMessages([]);
        processedToolCalls.current.clear();
        projectFilesRef.current = {};
    };

    // Load chat messages and initialize file ref when project changes
    useEffect(() => {
        if (currentProject && projectLoadedRef.current !== currentProject.id) {
            projectLoadedRef.current = currentProject.id;

            // Load existing files into ref
            if (currentProject.files) {
                projectFilesRef.current = { ...currentProject.files };
            }

            // Load chat messages
            if (currentProject.chat_messages && currentProject.chat_messages.length > 0) {
                setMessages(currentProject.chat_messages);
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

            // Reset WebContainer before starting new project
            resetContainer().then(() => {
                // Clear tracked files for new project
                projectFilesRef.current = {};
                processedToolCalls.current = new Set();

                setTimeout(() => {
                    append({ role: "user", content: initialPrompt });
                }, 500);
            });
        }
    }, [append, resetContainer]);

    const getToolIcon = (toolName: string) => {
        switch (toolName) {
            case "createFile":
            case "updateFile":
                return <FileCode className="w-3 h-3" />;
            case "runCommand":
                return <Terminal className="w-3 h-3" />;
            default:
                return <Check className="w-3 h-3" />;
        }
    };

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
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="w-8 h-8 text-indigo-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-300 mb-2">Let's build something</h3>
                            <p className="text-sm text-gray-500 max-w-xs">Describe what you want to create and I'll help you build it.</p>
                        </div>
                    </div>
                ) : (
                    messages.map((message) => (
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
                                {/* Tool invocations */}
                                {message.toolInvocations && message.toolInvocations.length > 0 && (
                                    <div className="space-y-1.5 mb-2">
                                        {(message.toolInvocations as any[]).map((tool: any, i: number) => (
                                            <div
                                                key={i}
                                                className="flex items-center gap-2 text-xs bg-[#1e1e2e] rounded-lg px-2.5 py-1.5"
                                            >
                                                <div className="text-indigo-400">
                                                    {getToolIcon(tool.toolName)}
                                                </div>
                                                <span className="text-indigo-400 font-medium">{tool.toolName}</span>
                                                <span className="text-gray-500 truncate max-w-[200px]">
                                                    {tool.args?.path || tool.args?.command || ''}
                                                </span>
                                                {tool.state === 'call' && (
                                                    <Loader2 className="w-3 h-3 animate-spin text-gray-400 ml-auto" />
                                                )}
                                                {tool.state === 'result' && (
                                                    <Check className="w-3 h-3 text-emerald-400 ml-auto" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {/* Message content */}
                                {message.content && (
                                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
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
                                <span className="animate-pulse">...</span>
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
                <div className="flex gap-2 items-center">
                    <button
                        type="button"
                        onClick={() => setShowAttachModal(true)}
                        className={`p-3 rounded-xl transition-colors ${attachedFiles.length > 0 ? 'text-indigo-400 bg-indigo-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        title="Attach images"
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>
                    <input
                        type="text"
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Describe your app..."
                        className="flex-1 bg-[#12121a] border border-[#1e1e2e] rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                    />
                    {isLoading ? (
                        <button
                            type="button"
                            onClick={() => stop()}
                            className="px-4 py-3 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
                        >
                            <Square className="w-4 h-4" />
                            <span>Stop</span>
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={!input.trim() && attachedFiles.length === 0}
                            className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-medium transition-all flex items-center gap-2"
                        >
                            <Send className="w-4 h-4" />
                            <span>Send</span>
                        </button>
                    )}
                </div>
            </form>

            {/* File Attach Modal */}
            <FileAttachModal
                isOpen={showAttachModal}
                onClose={() => setShowAttachModal(false)}
                onAttach={(files) => setAttachedFiles(prev => [...prev, ...files])}
            />
        </div>
    );
}
