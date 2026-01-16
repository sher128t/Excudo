import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useWebContainer } from "~/context/WebContainerContext";
import { useProject } from "~/context/ProjectContext";
import { Send, Bot, User, FileCode, Terminal, Check, Loader2, Trash2, Sparkles, Square, Paperclip, X, Image as ImageIcon, Wrench } from "lucide-react";
import { ActionChips } from "./ActionChips";
import { FileAttachModal, type AttachedFile } from "./FileAttachModal";

// Tool execution result tracking
interface ToolResult {
    toolName: string;
    path?: string;
    command?: string;
    success: boolean;
    error?: string;
}

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

    // Track tool execution results for feedback loop
    const toolResultsRef = useRef<ToolResult[]>([]);
    const feedbackInjectedRef = useRef<Set<string>>(new Set());
    const [executingTools, setExecutingTools] = useState(false);

    const chatHelpers = useChat({
        api: "/api/chat",
        maxSteps: 5, // Reduced - we handle continuation ourselves
        onError: (error) => {
            console.error("Chat error:", error);
        },
        onFinish: (message) => {
            console.log("Chat finished, message id:", message.id);
            // After AI finishes, inject tool results if any
            injectToolFeedback();
        },
    });

    const { messages, input, handleInputChange, handleSubmit: originalHandleSubmit, isLoading, setMessages, setInput, append, stop } = chatHelpers;

    // Inject tool execution feedback into chat
    const injectToolFeedback = useCallback(() => {
        const results = toolResultsRef.current;
        if (results.length === 0) return;

        // Create a unique key for this set of results
        const resultKey = results.map(r => `${r.toolName}:${r.path || r.command}`).join('|');
        if (feedbackInjectedRef.current.has(resultKey)) return;
        feedbackInjectedRef.current.add(resultKey);

        // Build feedback summary
        const filesCreated = results.filter(r => r.toolName === 'createFile' && r.success);
        const filesUpdated = results.filter(r => r.toolName === 'updateFile' && r.success);
        const commandsRun = results.filter(r => r.toolName === 'runCommand' && r.success);
        const errors = results.filter(r => !r.success);

        let feedback = "[SYSTEM: Tool Execution Complete]\n";

        if (filesCreated.length > 0) {
            feedback += `✅ Created ${filesCreated.length} file(s): ${filesCreated.map(f => f.path).join(', ')}\n`;
        }
        if (filesUpdated.length > 0) {
            feedback += `✅ Updated ${filesUpdated.length} file(s): ${filesUpdated.map(f => f.path).join(', ')}\n`;
        }
        if (commandsRun.length > 0) {
            feedback += `✅ Executed command(s): ${commandsRun.map(c => c.command).join(', ')}\n`;
        }
        if (errors.length > 0) {
            feedback += `❌ Errors: ${errors.map(e => e.error).join(', ')}\n`;
        }
        feedback += "\nAll changes have been applied to the project. The user can now see the updated preview.";

        console.log("Injecting tool feedback:", feedback);

        // Add as a system message that the AI will see in context
        setMessages(prev => [
            ...prev,
            {
                id: `tool-feedback-${Date.now()}`,
                role: 'assistant' as const,
                content: feedback,
            }
        ]);

        // Clear results for next round
        toolResultsRef.current = [];
    }, [setMessages]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Process and execute tool calls
    useEffect(() => {
        const processToolCalls = async () => {
            let hasNewTools = false;
            const newResults: ToolResult[] = [];

            for (const message of messages) {
                if (!message.toolInvocations) continue;

                for (const toolInvocation of message.toolInvocations as any[]) {
                    if (processedToolCalls.current.has(toolInvocation.toolCallId)) continue;
                    if (toolInvocation.state !== 'call') continue;

                    hasNewTools = true;
                    processedToolCalls.current.add(toolInvocation.toolCallId);
                    const { toolName, args } = toolInvocation;

                    try {
                        console.log(`Executing tool: ${toolName}`, args);

                        if (toolName === "createFile") {
                            await writeFile(args.path, args.content);
                            console.log(`File ${args.path} created.`);
                            newResults.push({ toolName, path: args.path, success: true });
                        } else if (toolName === "updateFile") {
                            await writeFile(args.path, args.content);
                            console.log(`File ${args.path} updated.`);
                            newResults.push({ toolName, path: args.path, success: true });
                        } else if (toolName === "deleteFile") {
                            console.log(`File ${args.path} deleted.`);
                            newResults.push({ toolName, path: args.path, success: true });
                        } else if (toolName === "runCommand") {
                            const [cmd, ...cmdArgs] = args.command.split(" ");
                            await runCommand(cmd, cmdArgs);
                            console.log(`Command ${args.command} executed.`);
                            newResults.push({ toolName, command: args.command, success: true });
                        }
                    } catch (error) {
                        console.error(`Error executing ${toolName}:`, error);
                        newResults.push({
                            toolName,
                            path: args.path,
                            command: args.command,
                            success: false,
                            error: error instanceof Error ? error.message : 'Unknown error'
                        });
                    }
                }
            }

            // Store results for feedback injection
            if (newResults.length > 0) {
                toolResultsRef.current = [...toolResultsRef.current, ...newResults];
                setExecutingTools(true);
            }
        };

        processToolCalls();
    }, [messages, writeFile, runCommand]);

    // Track when tools finish executing
    useEffect(() => {
        if (executingTools && !isLoading) {
            // AI finished and tools were executed - inject feedback after a short delay
            const timer = setTimeout(() => {
                injectToolFeedback();
                setExecutingTools(false);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isLoading, executingTools, injectToolFeedback]);

    const clearChat = () => {
        setMessages([]);
        processedToolCalls.current.clear();
        toolResultsRef.current = [];
        feedbackInjectedRef.current.clear();
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

    // Check if a message is a tool feedback message (for special styling)
    const isToolFeedback = (content: string) => {
        return content.startsWith('[SYSTEM: Tool Execution Complete]');
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
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isToolFeedback(message.content)
                                        ? 'bg-emerald-500/20'
                                        : 'bg-gradient-to-br from-indigo-500/20 to-purple-600/20'
                                    }`}>
                                    {isToolFeedback(message.content)
                                        ? <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                                        : <Bot className="w-3.5 h-3.5 text-indigo-400" />
                                    }
                                </div>
                            )}
                            <div
                                className={`max-w-[85%] rounded-xl px-4 py-2.5 ${message.role === "user"
                                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                                        : isToolFeedback(message.content)
                                            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm"
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
            <form onSubmit={originalHandleSubmit} className="p-4 border-t border-[#1e1e2e]">
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
