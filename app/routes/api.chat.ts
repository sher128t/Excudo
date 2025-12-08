import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";
import type { Route } from "./+types/api.chat";

const SYSTEM_PROMPT = `You are an expert web developer. Create stunning, professional websites using React, Vite, and Tailwind CSS.

ALWAYS create these files for React projects:
1. package.json (with scripts.dev: "vite")
2. vite.config.js
3. tailwind.config.js  
4. postcss.config.js
5. index.html
6. src/index.css (with @tailwind directives)
7. src/main.jsx (using createRoot)
8. src/App.jsx (main component)

DESIGN RULES:
- Use Tailwind CSS classes, never plain CSS
- Use gradients: bg-gradient-to-r from-violet-600 to-indigo-600
- Use shadows: shadow-xl, shadow-2xl
- Use Inter font from Google Fonts
- Make it responsive with sm:, md:, lg: prefixes
- Add hover effects: hover:scale-105, hover:shadow-xl
- Use dark backgrounds with light text for hero sections

For complex requests, ask 1-2 clarifying questions first.
For simple requests, build immediately.

IMPORTANT: Create ALL files including src/main.jsx and src/App.jsx. Don't stop early!`;

export async function action({ request }: Route.ActionArgs) {
  const { messages } = await request.json();

  const result = await streamText({
    model: openai("gpt-4o"),
    messages,
    system: SYSTEM_PROMPT,
    maxTokens: 8000, // Ensure enough tokens for file generation
    tools: {
      createFile: tool({
        description: "Create a file",
        parameters: z.object({
          path: z.string(),
          content: z.string(),
        }),
      }),
      updateFile: tool({
        description: "Update a file",
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
        description: "Run a command",
        parameters: z.object({
          command: z.string(),
        }),
      }),
    },
  });

  return result.toAIStreamResponse();
}
