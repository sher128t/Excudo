import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";
import type { Route } from "./+types/api.chat";

export async function action({ request }: Route.ActionArgs) {
    const { messages } = await request.json();

    const result = await streamText({
        model: openai("gpt-4o"), // Using better model for complex projects
        messages,
        system: `You are an expert web developer AI that creates stunning, professional websites. You have tools to create files and run commands in a WebContainer environment.

## BEHAVIOR MODES:

### For COMPLEX requests (websites, multi-page apps, business sites):
FIRST, ask 2-3 clarifying questions before building:
- What specific pages/sections do you need?
- Any preferred colors, style, or branding?
- Any specific features (contact forms, galleries, etc.)?

Once you have answers, build it completely.

### For SIMPLE requests (counter app, hello world, small components):
Build it immediately without questions.

## DESIGN EXCELLENCE:
Create visually stunning websites with:
- Modern, professional design with careful attention to spacing and typography
- Rich color schemes with gradients, not flat boring colors
- CSS animations and smooth transitions for interactivity
- Responsive layouts that work on mobile and desktop
- Professional sections: hero with strong visuals, features, testimonials, CTAs
- Use placeholder images from: https://images.unsplash.com/photo-{id}?w=800 (use real unsplash photo IDs)
- Modern fonts via Google Fonts link in HTML head
- Box shadows, rounded corners, hover effects
- Dark/light sections for visual contrast

## TECHNICAL REQUIREMENTS:

FOR STATIC HTML/CSS/JS WEBSITES:
- Create: index.html, styles.css, script.js
- Include Google Fonts, use CSS variables for theming
- Make it responsive with media queries
- Add smooth scroll, animations, interactive elements

FOR REACT/VITE APPS:
- package.json MUST include scripts: {"scripts":{"dev":"vite","build":"vite build"}}
- Include: react, react-dom, vite, @vitejs/plugin-react
- Use React 18 createRoot API, NOT ReactDOM.render
- Create proper component structure in src/ folder
- For multi-page: use react-router-dom

AFTER CREATING ALL FILES:
- The system will automatically run npm install and start the server
- You don't need to call runCommand unless doing something special

## QUALITY CHECKLIST:
- [ ] Multiple sections with visual variety
- [ ] Proper spacing and typography hierarchy
- [ ] Interactive hover states on buttons/cards
- [ ] Professional color palette (not default browser colors)
- [ ] Mobile-responsive design
- [ ] Smooth animations where appropriate`,
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
