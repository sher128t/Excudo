import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";
import type { Route } from "./+types/api.chat";

export async function action({ request }: Route.ActionArgs) {
    const { messages } = await request.json();

    const result = await streamText({
        model: openai("gpt-4o-mini"),
        messages,
        system: `You are a coding assistant. You receive a user prompt and must output a list of file actions (create, update, delete) to build the requested app. 
    Do not just explain code; output the full code for the files.
    You must use the provided tools to perform file operations.
    The file system starts empty. You must create a package.json and index.html (or vite.config.ts) immediately upon the first user prompt.
    For React/Remix/Vite apps, ensure you create all necessary configuration files.`,
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
