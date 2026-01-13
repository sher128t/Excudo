import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useWebContainer } from "~/context/WebContainerContext";
import { useProject } from "~/context/ProjectContext";
import { Send, Bot, User, FileCode, Terminal, Check, Loader2, Trash2, Sparkles, Square, Paperclip, X, Image as ImageIcon } from "lucide-react";
import { ActionChips } from "./ActionChips";
import { FileAttachModal, type AttachedFile } from "./FileAttachModal";

export function ChatInterface() {
    const { writeFile, readFile, runCommand } = useWebContainer();
    const { currentProject, saveProject } = useProject();
    const processedToolCalls = useRef<Set<string>>(new Set());
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const initialPromptHandled = useRef(false);
    const projectLoadedRef = useRef<string | null>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [showAttachModal, setShowAttachModal] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

    const chatHelpers = useChat({
        api: "/api/chat",
        maxSteps: 25,
        onError: (error) => {
            console.error("Chat error:", error);
        },
        onFinish: () => {
            console.log("Chat finished");
        },
    });

    const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, setInput, append, stop } = chatHelpers;

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        const processToolCalls = async () => {
            for (const message of messages) {
                if (!message.toolInvocations) continue;

                for (const toolInvocation of message.toolInvocations as any[]) {
                    if (processedToolCalls.current.has(toolInvocation.toolCallId)) continue;
                    if (toolInvocation.state !== 'call') continue;

                    processedToolCalls.current.add(toolInvocation.toolCallId);
                    const { toolName, args } = toolInvocation;

                    try {
                        console.log(`Executing tool: ${toolName}`, args);

                        if (toolName === "createFile" || toolName === "updateFile") {
                            await writeFile(args.path, args.content);
                            console.log(`File ${args.path} created/updated.`);
                        } else if (toolName === "deleteFile") {
                            console.log(`File ${args.path} deleted (simulated).`);
                        } else if (toolName === "runCommand") {
                            const [cmd, ...cmdArgs] = args.command.split(" ");
                            await runCommand(cmd, cmdArgs);
                            console.log(`Command ${args.command} executed.`);
                        }
                    } catch (error) {
                        console.error(`Error executing ${toolName}:`, error);
                    }
                }
            }
        };

        processToolCalls();
    }, [messages, writeFile, runCommand]);

    const clearChat = () => {
        setMessages([]);
        processedToolCalls.current.clear();
    };

    // Load chat messages when project changes
    useEffect(() => {
        if (currentProject && projectLoadedRef.current !== currentProject.id) {
            projectLoadedRef.current = currentProject.id;
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
        }, 2000);  // Save 2 seconds after last change

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
            sessionStorage.removeItem("initialPrompt");
            // Small delay to ensure everything is mounted
            setTimeout(() => {
                append({ role: "user", content: initialPrompt });
            }, 500);
        }
    }, [append]);

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
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.length === 0 && (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center max-w-sm">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Bot className="w-6 h-6 text-indigo-400" />
                            </div>
                            <h3 className="text-gray-300 font-medium mb-2">What would you like to build?</h3>
                            <p className="text-gray-500 text-sm">Describe your app and I'll create it for you using React, Vite, and Tailwind CSS.</p>
                        </div>
                    </div>
                )}

                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}
                    >
                        {message.role === "assistant" && (
                            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                        )}
                        <div
                            className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${message.role === "user"
                                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                                : "bg-[#12121a] border border-[#1e1e2e] text-gray-300"
                                }`}
                        >
                            <div className="whitespace-pre-wrap">{message.content}</div>
                            {message.toolInvocations && message.toolInvocations.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5">
                                    {message.toolInvocations.map((tool: any, i: number) => (
                                        <div key={i} className="flex items-center gap-2 text-xs">
                                            <span className="w-4 h-4 bg-emerald-500/20 rounded flex items-center justify-center text-emerald-400">
                                                {getToolIcon(tool.toolName)}
                                            </span>
                                            <span className="text-gray-400">{tool.toolName}</span>
                                            {tool.args?.path && (
                                                <span className="text-gray-500 truncate max-w-[150px]">
                                                    {tool.args.path}
                                                </span>
                                            )}
                                            {tool.args?.command && (
                                                <code className="text-gray-500 bg-black/30 px-1.5 py-0.5 rounded text-[10px]">
                                                    {tool.args.command}
                                                </code>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {message.role === "user" && (
                            <div className="w-7 h-7 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-gray-300" />
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-3 items-start">
                        <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl px-4 py-3">
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                                <span className="text-sm text-gray-400">Generating...</span>
                            </div>
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

