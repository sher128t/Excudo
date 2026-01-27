import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";
import { useChat } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import {
    Hammer, ArrowLeft, Send, Loader2, User, Bot, Sparkles
} from "lucide-react";
import { UserMenu } from "~/components/UserMenu";

export default function Chat() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [initialPromptSent, setInitialPromptSent] = useState(false);

    // Get initial planning prompt from session storage
    const initialPrompt = typeof window !== "undefined"
        ? sessionStorage.getItem("planningPrompt") || ""
        : "";

    const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
        api: "/api/chat",
        body: {
            modelMode: "plan",  // Planning mode - no code generation
        },
    });

    // Redirect to landing if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/landing");
        }
    }, [user, authLoading, navigate]);

    // Send initial prompt if we have one
    useEffect(() => {
        if (initialPrompt && !initialPromptSent && user) {
            append({ role: "user", content: initialPrompt });
            sessionStorage.removeItem("planningPrompt");
            setInitialPromptSent(true);
        }
    }, [initialPrompt, initialPromptSent, user, append]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    if (authLoading) {
        return (
            <div className="h-screen w-screen bg-[#0a0a0f] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="h-screen w-screen bg-[#0a0a0f] text-white flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-pink-600 rounded-lg flex items-center justify-center">
                            <Hammer className="w-4 h-4 text-white" />
                        </div>
                    </Link>
                    <div className="flex items-center gap-2 text-gray-400">
                        <Link to="/" className="hover:text-white transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            <h1 className="text-lg font-semibold text-white">Planning Mode</h1>
                        </div>
                    </div>
                </div>
                <UserMenu />
            </header>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-4 py-8">
                    {messages.length === 0 && !isLoading && (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Sparkles className="w-8 h-8 text-purple-400" />
                            </div>
                            <h2 className="text-2xl font-semibold mb-2">Planning Mode</h2>
                            <p className="text-gray-400 max-w-md mx-auto">
                                Ask questions, brainstorm ideas, or plan your project before building.
                                I'll help you think through requirements, design choices, and architecture.
                            </p>
                        </div>
                    )}

                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex gap-4 mb-6 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            {message.role === "assistant" && (
                                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                            )}
                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === "user"
                                    ? "bg-indigo-600 text-white"
                                    : "bg-white/5 text-gray-200 border border-white/5"
                                    }`}
                            >
                                <div className="text-sm">
                                    {message.role === "assistant" ? (
                                        <ReactMarkdown
                                            components={{
                                                h1: ({ children }) => <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0">{children}</h1>,
                                                h2: ({ children }) => <h2 className="text-lg font-semibold mb-2 mt-3 first:mt-0">{children}</h2>,
                                                h3: ({ children }) => <h3 className="text-base font-medium mb-2 mt-2 first:mt-0">{children}</h3>,
                                                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                                ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                                                ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                                                li: ({ children }) => <li className="text-gray-200">{children}</li>,
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
                                    )}
                                </div>
                            </div>
                            {message.role === "user" && (
                                <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                            )}
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-4 mb-6">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Loader2 className="w-4 h-4 text-white animate-spin" />
                            </div>
                            <div className="bg-white/5 rounded-2xl px-4 py-3 border border-white/5">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <span className="text-sm">Thinking...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input */}
            <div className="border-t border-white/5 p-4 bg-[#0a0a0f]/80 backdrop-blur-xl">
                <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-3 bg-white/5 rounded-2xl px-4 py-3 border border-white/10 focus-within:border-white/20 transition-colors">
                        <input
                            type="text"
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Ask a question or share your ideas..."
                            className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center disabled:opacity-50 hover:opacity-90 transition-opacity"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 text-center mt-2">
                        Planning mode helps you think through your project. When ready, head back to the dashboard and select "Build" to create it.
                    </p>
                </form>
            </div>
        </div>
    );
}
