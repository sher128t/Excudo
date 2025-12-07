import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";
import type { Route } from "./+types/api.chat";

export async function action({ request }: Route.ActionArgs) {
    const { messages } = await request.json();

    const result = await streamText({
        model: openai("gpt-4o-mini"),
        messages,
        system: `You are a coding assistant that builds web apps. You have tools to create files and run commands.

CRITICAL RULES - FOLLOW EXACTLY:
1. Create ALL necessary files first using createFile tool
2. AFTER creating files, you MUST run the appropriate commands:

FOR SIMPLE HTML/CSS/JS APPS (no React, no npm):
- Just create index.html, style.css, script.js
- Run: runCommand with "npx -y serve ."

FOR REACT/VITE APPS:
- Create package.json with these exact dependencies: {"dependencies":{"react":"^18.2.0","react-dom":"^18.2.0"},"devDependencies":{"vite":"^5.0.0","@vitejs/plugin-react":"^4.2.0"}}
- Create vite.config.js, index.html, src/main.jsx, src/App.jsx
- Run: runCommand with "npm install"
- Then run: runCommand with "npm run dev"

IMPORTANT:
- Always run commands AFTER creating files
- For React, you MUST run both "npm install" AND "npm run dev"
- Never explain - just create files and run commands
- Keep all files minimal and working`,
        tools: {
            createFile: tool({
                description: "Create a new file with the specified content",
                parameters: z.object({
                    path: z.string(),
                    content: z.string(),
                }),
            }),
            updateFile: tool({
                description: "Update an existing file with new content",
                parameters: z.object({
                    path: z.string(),
                    content: z.string(),
                }),
            }),
            deleteFile: tool({
                description: "Delete a file",
                parameters: z.object({
                    path: z.string(),
                }),
            }),
            runCommand: tool({
                description: "Run a shell command",
                parameters: z.object({
                    command: z.string(),
                }),
            }),
        },
    });

    return result.toAIStreamResponse();
}
