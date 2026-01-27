import { anthropic } from "@ai-sdk/anthropic";
import { streamText, tool } from "ai";
import { z } from "zod";
import type { Route } from "./+types/api.chat";

const SYSTEM_PROMPT = `You are an expert web developer. Build beautiful, production-quality React websites.

## YOUR TASK
Analyze what the user wants to build. Choose appropriate:
- Color scheme (based on industry/vibe)
- Typography (modern, professional, playful - whatever fits)
- Images from Unsplash that match the theme
- Layout and sections that make sense

## ARCHITECTURE
Create a component-based React app. For a typical landing page, create:
- package.json, vite.config.js, tailwind.config.js, postcss.config.js, index.html
- src/index.css, src/main.jsx, src/App.jsx
- src/components/Navbar.jsx
- src/components/Hero.jsx  
- src/components/Features.jsx (or whatever sections fit)
- src/components/CTA.jsx
- src/components/Footer.jsx

## CRITICAL RULES
1. Create ALL component files BEFORE App.jsx imports them
2. DO NOT explain - just create files
3. Every component must be a complete, working file
4. Use Unsplash images: https://images.unsplash.com/photo-[ID]?w=1200

## DESIGN PRINCIPLES (apply creatively based on context)
- Dark themes: Use slate-900/950 backgrounds with vibrant accent colors
- Light themes: Clean whites with subtle shadows
- Hero sections: Full viewport, compelling headline, clear CTA
- Use gradients, glassmorphism, hover effects appropriately
- Include real stats/social proof when relevant
- Make CTAs stand out with contrasting colors

## COLOR CONTRAST RULES (CRITICAL - always follow)
- NEVER use text color same as or similar to its background
- On dark backgrounds (gray-800+): Use white, gray-100, or bright accent colors for text
- On light backgrounds: Use gray-800+, black, or dark accent colors for text
- On colored backgrounds: Ensure 4.5:1 minimum contrast ratio
- Gradient text: Only use on solid backgrounds, not on images or gradients
- Buttons: Text must strongly contrast button background (white on dark, dark on light)

## TECHNICAL REQUIREMENTS
package.json: {"name":"app","version":"1.0.0","type":"module","scripts":{"dev":"vite","build":"vite build"},"dependencies":{"react":"^18.2.0","react-dom":"^18.2.0"},"devDependencies":{"@vitejs/plugin-react":"^4.2.0","vite":"^5.0.0","tailwindcss":"^3.4.0","postcss":"^8.0.0","autoprefixer":"^10.0.0"}}

vite.config.js: import { defineConfig } from 'vite'; import react from '@vitejs/plugin-react'; export default defineConfig({ plugins: [react()] });

tailwind.config.js: export default { content: ['./index.html', './src/**/*.{js,jsx}'], theme: { extend: {} }, plugins: [] };

postcss.config.js: export default { plugins: { tailwindcss: {}, autoprefixer: {} } };

## FILE CREATION ORDER (important!)
1. Config files first (package.json, vite.config.js, etc.)
2. Then src/index.css, src/main.jsx
3. Then ALL component files (Navbar, Hero, Features, CTA, Footer)
4. FINALLY src/App.jsx (which imports the components)
5. Run: npm install && npm run dev

Remember: Create intelligent, context-appropriate designs. A fitness app should feel energetic. A law firm should feel professional. A kids app should feel playful. YOU decide the right aesthetic.`;

// Preprocess messages to ensure all tool invocations have results
// This fixes the "ToolInvocation must have a result" error
function preprocessMessages(messages: any[]): any[] {
    return messages.map(message => {
        // Only process assistant messages with tool invocations
        if (message.role !== 'assistant' || !message.toolInvocations) {
            return message;
        }

        // Check if any tool invocations are missing results
        const hasIncomplete = message.toolInvocations.some(
            (tool: any) => tool.state === 'call' || !tool.result
        );

        if (!hasIncomplete) {
            return message;
        }

        // Fix tool invocations by adding results
        const fixedInvocations = message.toolInvocations.map((tool: any) => {
            if (tool.state === 'result' && tool.result) {
                return tool;
            }

            // Add a synthetic result for incomplete tool calls
            let result = "Executed successfully";
            if (tool.toolName === 'createFile' || tool.toolName === 'updateFile') {
                result = `File ${tool.args?.path || 'unknown'} created successfully`;
            } else if (tool.toolName === 'deleteFile') {
                result = `File ${tool.args?.path || 'unknown'} deleted`;
            } else if (tool.toolName === 'runCommand') {
                result = `Command executed: ${tool.args?.command || 'unknown'}`;
            }

            return {
                ...tool,
                state: 'result',
                result,
            };
        });

        return {
            ...message,
            toolInvocations: fixedInvocations,
        };
    });
}

export async function action({ request }: Route.ActionArgs) {
    const { messages: rawMessages, userTier, modelMode } = await request.json();

    // Preprocess messages to fix incomplete tool invocations
    const messages = preprocessMessages(rawMessages);

    // Select model based on modelMode and user tier
    // If user is free tier and tries to use "thinking", force to "fast"
    const tier = userTier || "free";
    const requestedMode = modelMode || "fast";

    // Plan mode uses fast model for chat-only responses
    const isPlanMode = requestedMode === "plan";

    // Free users can only use fast mode for building
    const effectiveMode = isPlanMode ? "fast" : (tier === "free" ? "fast" : requestedMode);

    // Model mapping - using correct Anthropic model names
    // Fast uses Claude Haiku 4.5 (cheaper, faster) - good for basic websites
    // Thinking uses Claude Sonnet 4.5 (premium, 32k tokens) - best quality for complex projects
    const MODEL_MAP = {
        fast: "claude-haiku-4-5-20251001",    // Claude Haiku 4.5 - fast and affordable
        thinking: "claude-sonnet-4-5-20250929", // Claude Sonnet 4.5 - highest quality
    };

    // Max tokens per model - both 4.5 models support high token counts
    const MAX_TOKENS_MAP = {
        fast: 32000,     // Haiku 4.5 - max tokens for complete projects
        thinking: 32000, // Sonnet 4.5 - max for complex projects
    };

    const modelName = MODEL_MAP[effectiveMode as keyof typeof MODEL_MAP];
    const maxTokens = isPlanMode ? 4000 : MAX_TOKENS_MAP[effectiveMode as keyof typeof MAX_TOKENS_MAP];

    console.log(`Using model: ${modelName} (mode: ${requestedMode}, plan: ${isPlanMode}, tier: ${tier}, maxTokens: ${maxTokens})`);

    // Plan mode - no tools, just conversational AI for planning/brainstorming
    if (isPlanMode) {
        const PLAN_SYSTEM_PROMPT = `You are a helpful AI assistant for planning and brainstorming web projects.

Your role is to:
- Help users think through their project ideas
- Suggest features, design approaches, and technical considerations
- Answer questions about web development, design patterns, and best practices
- Help refine requirements before building
- Discuss architecture, user flows, and component structure

Be conversational, helpful, and encouraging. Ask clarifying questions when needed.
Keep responses concise but thorough. Use markdown formatting for readability.

Do NOT generate code files or use any tools. This is just a planning conversation.
When the user is ready to build, suggest they switch to "Build" mode on the dashboard.`;

        const result = streamText({
            model: anthropic(modelName),
            messages,
            system: PLAN_SYSTEM_PROMPT,
            maxTokens,
        });

        return result.toDataStreamResponse();
    }

    // Build mode - full code generation with tools
    const result = streamText({
        model: anthropic(modelName),
        messages,
        system: SYSTEM_PROMPT,
        maxTokens,
        tools: {
            createFile: tool({
                description: "Create a new file with content",
                parameters: z.object({
                    path: z.string().describe("File path like 'src/components/Hero.jsx'"),
                    content: z.string().describe("Complete file content"),
                }),
            }),
            updateFile: tool({
                description: "Update an existing file",
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

    return result.toDataStreamResponse();
}
