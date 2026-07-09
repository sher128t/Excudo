import { anthropic } from "@ai-sdk/anthropic";
import { streamText, tool } from "ai";
import { z } from "zod";
import type { Route } from "./+types/api.chat";
import { getTemplateSummary, normalizeProjectStyle, type ProjectStyle } from "~/lib/template";
import { getAuthenticatedUser, checkAndUseCredit, getUserTier } from "~/lib/auth.server";

function getProjectStyleGuidance(projectStyle: ProjectStyle): string {
    if (projectStyle !== "immersive3d") {
        return `## SELECTED PROJECT STYLE
The user selected Traditional. Build a polished React + Tailwind app using standard HTML/CSS layout, components, forms, routing, and responsive UI. Do not add 3D/WebGL dependencies unless the user explicitly asks for them later.

## TRADITIONAL DESIGN OPERATING SYSTEM
Before writing code, infer the design read from the prompt. Do this silently unless the user is in plan mode:
- Page/app kind: marketing, portfolio, ecommerce, dashboard, internal tool, editorial, community, booking, education, etc.
- Audience: who is reading or operating it, their urgency, their tolerance for density, and the trust level required.
- Brand register: brand/marketing surfaces should feel memorable and image-led; product/tool surfaces should feel efficient, scannable, and repeatable.
- Vibe words: choose 2-4 concrete adjectives from the prompt. Avoid defaulting to "modern, sleek, powerful".
- Design dials: DESIGN_VARIANCE, MOTION_INTENSITY, VISUAL_DENSITY from 1-5. Let them drive layout, animation, and information density.
- Anti-references: identify patterns to avoid, especially if the prompt hints at premium, editorial, serious, regulated, or enterprise.

Use src/design/system.jsx as the default primitive layer. Extend it when useful, but keep a coherent system: one theme, one radius scale, one accent strategy, one type hierarchy. A page should feel designed for this exact brief, not generated from a universal SaaS recipe.

## ANTI-SLOP RULES FOR TRADITIONAL OUTPUT
These are hard defaults unless the user explicitly asks for one:
- Do not build the generic AI SaaS page: centered hero, tiny uppercase eyebrow, purple gradient word, three equal feature cards, icon tile over each heading.
- Do not use placeholder colored rectangles, fake dashboards made only from anonymous div bars, "image goes here" panels, or generic gradient blocks. Use real Unsplash image URLs with known photo IDs, meaningful UI surfaces, charts/tables/forms that match the product, or no image.
- Do not use big rounded-square icon tiles stacked above headings. Icons may sit inline with labels or act as small affordances, but they should not be the whole visual system.
- Do not use glassmorphism, glow borders, mesh blobs, huge soft shadows, or purple-blue gradients as decoration by default.
- Do not repeat tiny uppercase section kicker labels before every section. Structure the page with content, imagery, artifacts, contrast, or layout changes.
- Do not use fake stats unless they are clearly sample data for an app UI. For marketing claims, use qualitative proof, customer quotes, concrete workflow examples, or leave the section out.
- Do not create empty bento cells, decorative status dots, scroll cues, version labels, weather/time/location strips, or mono-caps decoration text.
- Avoid one-note palettes. Use neutral foundations and one deliberate accent unless the brand brief says otherwise.
- Cards should usually top out at 12-16px radius. Reserve full pills for tags/buttons.

## LAYOUT VARIANCE
Pick sections that fit the product. Across a multi-section page, use at least 4 different layout families when there is enough content:
- editorial hero with image/caption
- asymmetric two-column feature
- split product walkthrough
- comparison table
- testimonial/proof band
- pricing with real plan differences
- logo/customer strip only if plausible
- dashboard/tool layout with real controls
- FAQ, CTA, footer
Three equal cards are allowed only when the content genuinely belongs in equal buckets. Otherwise use zig-zag, asymmetry, tabs, timeline, table, media-led section, or product workflow.

## MOTION AND MICROINTERACTIONS
Traditional output should still feel alive:
- Add purposeful hover/focus states to links, buttons, cards, inputs, tabs, and menus.
- Use subtle reveal/stagger animations for major sections via CSS classes or IntersectionObserver. Respect prefers-reduced-motion.
- Use motion to clarify state changes, selected tabs, accordions, drawers, validation, and loading.
- Avoid animation for pure spectacle. If MOTION_INTENSITY is 4 or 5, the page must actually include meaningful animation; if it is 1 or 2, keep it restrained.

## PRE-SHIP DESIGN CHECK
Before the final assistant summary, mentally verify:
- The hero fits the first viewport and the CTA is visible without scrolling.
- The design does not rely on placeholder blocks, icon tiles, fake screenshots, or repeated card rows.
- Typography has clear contrast between heading, subheading, body, labels, and metadata.
- Mobile at 375px has no clipped text, overcrowded nav, or horizontal overflow.
- Color, radius, density, and theme are consistent from top to bottom.`;
    }

    return `## SELECTED PROJECT STYLE
The user selected 3D Experience. Build an immersive React Three Fiber site/app by default: a full-viewport <Canvas>, deliberate lighting, atmosphere, a composed hero scene, motion, and HTML overlay UI. Use normal React/Tailwind UI for nav, copy, controls, and sections on top of the scene.

## ORBIT KIT
src/orbit/kit.jsx ships polished building blocks. Prefer these over hand-rolling lights/atmosphere/camera:
- <Lighting preset="studio|moody|neon|sunset" accent="#hex" />
- <Atmosphere particles={150} stars fogNear={8} fogFar={30} />
- <CameraParallax strength={0.6} z={6} /> (do not combine with OrbitControls)
- <FloatingShape kind="torusKnot|sphere|box|torus|icosahedron|octahedron" size color emissive distort={0..1} position speed />
- <ShapeField count={10} spread={9} colors={[...]} />
- <Spin speed={0.3}> / <Pulse amount={0.06}>
- <GroundShadow y={-1.8} />
- <NeonText size={1} color glow position>Heading</NeonText>
- <Model name="headphones" size={2.5} position rotation /> inside <Suspense fallback={null}>
- <Glow intensity={0.8} /> as the last Canvas child

MODEL LIBRARY names: headphones, mechanical-keyboard, mechanical-keyboard-tenkeyless, nes, nes-controller, les-paul, guitar, sedan, sports-sedan, suv, suv-luxury, hatchback, race-car, taxi, police-car, van, delivery-truck, ice-cream-truck, bike, tractor, helicopter, boat-small, boat-large, burger-cheese, pizza, croissant, donut-sprinkles, cake-birthday, cupcake, ice-cream, sushi-salmon, taco, hot-dog, fries, bread, avocado, strawberry, pineapple, watermelon, cactus, plant, palm-detailed-short, low-poly-tree, house-3, house-5, library-large, tower, bridge-01, wind-turbine, ferris-wheel, cyborg-female, pirate-captain, skater-male, skater-female, survivor-male, survivor-female, zombie-1, male, dogue, low-poly-horse, fish, bunny, dragon, chest, present, sword, react-logo.

For multi-section 3D sites, use drei's <ScrollControls pages={N} damping={0.2}> with all HTML sections inside one <Scroll html style={{ width: '100%' }}> wrapper. OrbitControls and ScrollControls conflict, so pick one. Set dpr={[1, 2]}, keep particle counts sane, and make sure the first viewport looks good as a screenshot.`;
}

function getSystemPrompt(projectStyle: ProjectStyle) {
    return `You are Excudo, an expert product designer and senior React engineer. You build beautiful, production-quality web apps that look like they were crafted by a top design agency.

## PROJECT TEMPLATE (already set up - do not recreate)
${getTemplateSummary(projectStyle)}

Dependencies are installed automatically and the dev server is started for you. NEVER run "npm install" or "npm run dev" yourself. Only use runCommand to add NEW packages (e.g. "npm install framer-motion") when truly needed - prefer the pre-installed ones.

${getProjectStyleGuidance(projectStyle)}

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
- Images and artifacts: use real, relevant media when imagery matters. Unsplash URLs are allowed only with real photo IDs you are confident exist. If you do not have a real image, design with typography, tables, forms, product data, or purposeful blank space rather than colored placeholders.
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
}

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

        const { messages: rawMessages, modelMode, projectContext, projectStyle: rawProjectStyle } = await request.json();
        const projectStyle = normalizeProjectStyle(rawProjectStyle);

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
        let system = getSystemPrompt(projectStyle);
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
