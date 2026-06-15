import { anthropic } from "@ai-sdk/anthropic";
import { streamText, tool } from "ai";
import { z } from "zod";
import type { Route } from "./+types/api.chat";
import { TEMPLATE_SUMMARY } from "~/lib/template";
import { getAuthenticatedUser, checkAndUseCredit, getUserTier } from "~/lib/auth.server";

const SYSTEM_PROMPT = `You are Excudo, an expert product designer and senior React engineer. You build beautiful, production-quality web apps that look like they were crafted by a top design agency.

## PROJECT TEMPLATE (already set up - do not recreate)
${TEMPLATE_SUMMARY}

Dependencies are installed automatically and the dev server is started for you. NEVER run "npm install" or "npm run dev" yourself. Only use runCommand to add NEW packages (e.g. "npm install framer-motion") when truly needed - prefer the pre-installed ones.

## YOUR TOOLS
- createFile / updateFile: write a complete file (full content, no truncation, no placeholders like "...")
- deleteFile: remove a file
- readFile: read a file's current contents - ALWAYS do this before updating a file you didn't just write
- listFiles: list all files in the project
- runCommand: run a shell command (supports && chains)

## WORKFLOW
For a NEW app:
1. Briefly state (1-2 sentences) what you're building and the design direction
2. Create src/components/*.jsx files first, then src/App.jsx that imports them
3. Do not create config files - they exist already

For EDITS to an existing app:
1. Use listFiles and readFile to understand current code before changing it
2. Make targeted updates - only touch the files that need to change
3. Preserve existing design language and structure unless asked to change it

If you receive an error report (build error, missing import, etc.), read the relevant file(s), find the root cause, and fix it with updateFile. Do not guess - verify with readFile.

## DESIGN QUALITY BAR (this is what separates great from generic)
- Pick a deliberate art direction per project: a fitness app feels energetic, a law firm feels authoritative, a kids app feels playful. Commit to it.
- Typography: establish hierarchy with size AND weight. Use tracking-tight on large headings. Body text: text-slate-600 (light) / text-slate-400 (dark), leading-relaxed.
- Spacing: generous and consistent. Sections: py-20 md:py-28. Containers: max-w-7xl mx-auto px-6.
- Color: one dominant accent color + neutrals. Avoid rainbow gradients everywhere; use gradients sparingly for emphasis.
- Depth: subtle borders (border-slate-200/dark:border-slate-800), soft shadows (shadow-sm, shadow-lg for cards), rounded-xl/2xl.
- Micro-interactions: hover states on every interactive element (hover:scale-[1.02], hover:shadow-lg, transition-all duration-200).
- Icons: use lucide-react (already installed) - import { IconName } from 'lucide-react'. Never use emoji as icons.
- Images: use Unsplash with specific search terms: https://images.unsplash.com/photo-{ID}?w=1200&q=80 - only use real photo IDs you are confident exist; otherwise use gradient/colored placeholders.
- Mobile-first responsive: every layout must work at 375px. Use md:/lg: prefixes to scale up.

## COLOR CONTRAST (critical - always follow)
- Text must strongly contrast its background (4.5:1 minimum)
- On dark backgrounds (slate-800+): white/slate-100 text
- On light backgrounds: slate-800+ text
- Buttons: white text on dark/colored buttons, dark text on light buttons
- Never place gradient text on images or gradients

## ARCHITECTURE
- Component-based: each logical section is its own file in src/components/
- Interactive apps: use React hooks (useState/useEffect) - state lives in the closest common parent
- Multi-page apps: use react-router-dom@6 (already installed) with <BrowserRouter> in src/main.jsx, pages in src/pages/
- Keep data in small const arrays/objects at the top of components or in src/data/*.js
- Every file must be complete and syntactically valid - all imports resolve, all tags closed

## CRITICAL RULES
1. Create ALL component files BEFORE the file that imports them
2. Keep prose minimal - a short intro line, then tool calls, then a 1-2 sentence summary
3. Every component must be a complete working file - never output partial files
4. NEVER run npm install or npm run dev (handled automatically)`;

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
When the user is ready to build, suggest they switch to "Build" mode.`;

// Ensure all tool invocations in history have results (the API rejects
// assistant messages with dangling tool calls). Unlike before, we do NOT
// fabricate success - missing results are reported honestly so the model
// knows the call may not have executed.
function preprocessMessages(messages: any[]): any[] {
    return messages.map(message => {
        if (message.role !== 'assistant' || !message.toolInvocations) {
            return message;
        }

        const hasIncomplete = message.toolInvocations.some(
            (tool: any) => tool.state !== 'result' || tool.result === undefined
        );

        if (!hasIncomplete) {
            return message;
        }

        const fixedInvocations = message.toolInvocations.map((tool: any) => {
            if (tool.state === 'result' && tool.result !== undefined) {
                return tool;
            }
            return {
                ...tool,
                state: 'result',
                result: `[No result captured for ${tool.toolName} - the call may have been interrupted and might not have executed. Verify with readFile/listFiles if it matters.]`,
            };
        });

        return {
            ...message,
            toolInvocations: fixedInvocations,
        };
    });
}

export async function action({ request }: Route.ActionArgs) {
    try {
        // Require a signed-in user - this endpoint spends Anthropic credits
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return new Response(JSON.stringify({ error: "Not authenticated. Please sign in." }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        const { messages: rawMessages, modelMode, projectContext } = await request.json();

        const messages = preprocessMessages(rawMessages);

        const requestedMode = modelMode || "fast";
        const isPlanMode = requestedMode === "plan";

        // Charge one credit per user message in build mode. Continuation
        // requests from the multi-step tool loop end with an assistant
        // message, so they are not double-charged. The tier comes from the
        // server-side profile - never trust the client.
        const lastMessage = rawMessages?.[rawMessages.length - 1];
        const isNewUserMessage = lastMessage?.role === "user";

        let tier: string;
        if (!isPlanMode && isNewUserMessage) {
            const credit = await checkAndUseCredit(user.id);
            if (!credit.ok) {
                return new Response(
                    JSON.stringify({ error: "You've run out of daily credits. They reset tomorrow - or upgrade your plan for more." }),
                    { status: 402, headers: { "Content-Type": "application/json" } }
                );
            }
            tier = credit.tier;
        } else {
            tier = await getUserTier(user.id);
        }

        // Free users can only use fast mode for building
        const effectiveMode = isPlanMode ? "fast" : (tier === "free" ? "fast" : requestedMode);

        const MODEL_MAP = {
            // Pinned IDs per https://platform.claude.com/docs/en/about-claude/models/overview
            fast: "claude-haiku-4-5-20251001",
            thinking: "claude-sonnet-4-6",
        };

        const MAX_TOKENS_MAP = {
            fast: 32000,
            thinking: 32000,
        };

        const modelName = MODEL_MAP[effectiveMode as keyof typeof MODEL_MAP];
        const maxTokens = isPlanMode ? 4000 : MAX_TOKENS_MAP[effectiveMode as keyof typeof MAX_TOKENS_MAP];

        console.log(`Using model: ${modelName} (mode: ${requestedMode}, plan: ${isPlanMode}, tier: ${tier}, maxTokens: ${maxTokens})`);

        // Plan mode - no tools, just conversational AI for planning/brainstorming
        if (isPlanMode) {
            const result = streamText({
                model: anthropic(modelName),
                messages,
                system: PLAN_SYSTEM_PROMPT,
                maxTokens,
            });

            return result.toDataStreamResponse();
        }

        // Ground the model in the current project state for follow-up edits
        let system = SYSTEM_PROMPT;
        if (projectContext && typeof projectContext === "string" && projectContext.trim()) {
            system += `\n\n## CURRENT PROJECT STATE\n${projectContext}\nUse readFile to inspect any of these files before modifying them.`;
        }

        // Build mode - full code generation with tools (executed client-side
        // against the WebContainer)
        const result = streamText({
            model: anthropic(modelName),
            messages,
            system,
            maxTokens,
            tools: {
                createFile: tool({
                    description: "Create a new file with the given complete content",
                    parameters: z.object({
                        path: z.string().describe("File path like 'src/components/Hero.jsx'"),
                        content: z.string().describe("Complete file content"),
                    }),
                }),
                updateFile: tool({
                    description: "Replace an existing file with new complete content",
                    parameters: z.object({
                        path: z.string(),
                        content: z.string().describe("Complete new file content"),
                    }),
                }),
                deleteFile: tool({
                    description: "Delete a file from the project",
                    parameters: z.object({
                        path: z.string(),
                    }),
                }),
                readFile: tool({
                    description: "Read the current contents of a file in the project",
                    parameters: z.object({
                        path: z.string().describe("File path like 'src/App.jsx'"),
                    }),
                }),
                listFiles: tool({
                    description: "List all files currently in the project",
                    parameters: z.object({}),
                }),
                runCommand: tool({
                    description: "Run a shell command in the project (supports && chains). Only for adding new npm packages - never run npm install or npm run dev.",
                    parameters: z.object({
                        command: z.string(),
                    }),
                }),
            },
        });

        return result.toDataStreamResponse();
    } catch (err) {
        console.error("Chat API error:", err);
        const message = err instanceof Error ? err.message : "Unknown server error";
        return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
