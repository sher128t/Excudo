import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";
import type { Route } from "./+types/api.chat";

export async function action({ request }: Route.ActionArgs) {
    const { messages } = await request.json();

    const result = await streamText({
        model: openai("gpt-4o-mini"),
        messages,
        system: `You are a coding assistant that helps build web apps. You have tools to create files and run commands.

IMPORTANT INSTRUCTIONS:
1. When asked to create an app, create all necessary files using the createFile tool
2. For simple HTML/CSS/JS apps, create the files and then run 'npx serve .' to serve them
3. For React apps, create package.json with vite, then run 'npm install' and 'npm run dev'
4. Always run the serve command after creating files so the user can preview the app
5. Keep responses concise - just create files and run commands, don't explain unless asked`,
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
