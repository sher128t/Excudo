import { useChat } from "@ai-sdk/react";
import { useEffect, useState, useRef } from "react";
import { useWebContainer } from "~/context/WebContainerContext";

export function ChatInterface() {
    const { writeFile, readFile, runCommand } = useWebContainer();
    const processedToolCalls = useRef<Set<string>>(new Set());

    const chatHelpers = useChat({
        api: "/api/chat",
        maxSteps: 25,
        onError: (error) => {
            console.error("Chat error:", error);
            alert(`Chat error: ${error.message}`);
        },
        onFinish: () => {
            console.log("Chat finished");
        },
    });

    const { messages, input, handleInputChange, handleSubmit, isLoading, addToolResult } = chatHelpers;

    useEffect(() => {
        console.log("Messages updated:", messages);
    }, [messages]);

    useEffect(() => {
        // console.log("ChatHelpers:", Object.keys(chatHelpers));
    }, [chatHelpers]);

    // Process tool calls and execute them (without sending results back to avoid loop)
    useEffect(() => {
        const processToolCalls = async () => {
            for (const message of messages) {
                if (!message.toolInvocations) continue;

                for (const toolInvocation of message.toolInvocations as any[]) {
                    // Skip if already processed using the tool call ID
                    if (processedToolCalls.current.has(toolInvocation.toolCallId)) continue;

                    // Skip if not in 'call' state (e.g., already has 'result')
                    if (toolInvocation.state !== 'call') continue;

                    // Mark as processed BEFORE executing to prevent race conditions
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

    return (
        <div className="h-full flex flex-col bg-gray-900">
            <div className="p-3 border-b border-gray-700">
                <h2 className="text-sm font-semibold text-gray-300">AI Assistant</h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`p-3 rounded-lg text-sm ${message.role === "user"
                            ? "bg-blue-600 ml-8"
                            : "bg-gray-800 mr-8"
                            }`}
                    >
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        {message.toolInvocations && (
                            <div className="mt-2 text-xs text-gray-400">
                                {message.toolInvocations.map((tool: any, i: number) => (
                                    <div key={i} className="flex items-center gap-1">
                                        <span className="text-green-400">✓</span>
                                        <span>{tool.toolName}</span>
                                        {tool.toolName === "createFile" && (
                                            <span className="text-gray-500">({tool.args?.path})</span>
                                        )}
                                        {tool.toolName === "runCommand" && (
                                            <span className="text-gray-500">({tool.args?.command})</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="text-gray-400 text-sm animate-pulse">
                        Thinking...
                    </div>
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Describe your app..."
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-sm font-medium"
                    >
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
}
