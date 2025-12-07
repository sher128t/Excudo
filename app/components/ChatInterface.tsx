import { useChat } from "@ai-sdk/react";
import { useEffect, useState } from "react";
import { useWebContainer } from "~/context/WebContainerContext";

export function ChatInterface() {
    const { writeFile, readFile, runCommand } = useWebContainer();
    const [input, setInput] = useState("");

    const chatHelpers = useChat({
        api: "/api/chat",
        maxSteps: 5,
        onError: (error) => {
            console.error("Chat error:", error);
            alert(`Chat error: ${error.message}`);
        },
        onFinish: () => {
            console.log("Chat finished");
        },
    });

    const { messages, handleSubmit, isLoading, addToolResult, sendMessage } = chatHelpers;

    useEffect(() => {
        console.log("Messages updated:", messages);
    }, [messages]);

    useEffect(() => {
        // console.log("ChatHelpers:", Object.keys(chatHelpers));
    }, [chatHelpers]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim()) return;

        try {
            // @ts-ignore
            await sendMessage({ role: "user", content: input });
            setInput("");
        } catch (err) {
            console.error("sendMessage failed:", err);
        }
    };

    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        if (!lastMessage || !lastMessage.toolInvocations) return;

        const processToolCalls = async () => {
            for (const toolInvocation of lastMessage.toolInvocations) {
                if (toolInvocation.state !== 'call') continue;

                const { toolName, toolCallId, args } = toolInvocation;
                let result = "Success";

                try {
                    console.log(`Executing tool: ${toolName}`, args);

                    if (toolName === "createFile" || toolName === "updateFile") {
                        await writeFile(args.path, args.content);
                        result = `File ${args.path} created/updated.`;
                    } else if (toolName === "deleteFile") {
                        // await deleteFile(args.path); // TODO: Implement deleteFile in context
                        result = `File ${args.path} deleted (simulated).`;
                    } else if (toolName === "runCommand") {
                        const [cmd, ...cmdArgs] = args.command.split(" ");
                        await runCommand(cmd, cmdArgs);
                        result = `Command ${args.command} executed.`;
                    }
                } catch (error) {
                    console.error(`Error executing ${toolName}:`, error);
                    result = `Error: ${error instanceof Error ? error.message : String(error)}`;
                }

                addToolResult({
                    toolCallId,
                    result,
                });
            }
        };

        processToolCalls();
    }, [messages, writeFile, runCommand, addToolResult]);

    return (
        <div className="flex flex-col h-full bg-gray-900 text-white border-r border-gray-800">
            <div className="p-4 border-b border-gray-800 font-bold flex justify-between items-center">
                <span>AI Assistant</span>
                {isLoading && <span className="text-blue-400 text-xs">Loading...</span>}
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.length === 0 && (
                    <div className="text-gray-400 text-sm text-center mt-10">
                        Ask me to build something...
                    </div>
                )}

                {messages.map((m) => (
                    <div
                        key={m.id}
                        className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"
                            }`}
                    >
                        <div
                            className={`max-w-[85%] rounded-lg p-3 ${m.role === "user"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-800 text-gray-200"
                                }`}
                        >
                            <div className="whitespace-pre-wrap text-sm">{m.content}</div>
                            {m.toolInvocations && (
                                <div className="mt-2 text-xs text-gray-400 border-t border-gray-700 pt-2">
                                    {m.toolInvocations.map((t) => (
                                        <div key={t.toolCallId} className="flex items-center gap-1">
                                            <div className={`w-2 h-2 rounded-full ${t.state === 'result' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                            <span>{t.toolName}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 border-t border-gray-800">
                <form onSubmit={handleSend} className="relative">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        className="w-full bg-gray-800 text-white rounded p-3 pr-10 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Describe your app..."
                        rows={3}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="absolute bottom-3 right-3 p-1 hover:bg-gray-700 rounded text-blue-400 disabled:opacity-50"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}
