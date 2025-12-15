import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";
import type { Route } from "./+types/api.chat";

const SYSTEM_PROMPT = `You are a web developer. Create React + Vite + Tailwind websites.

RULES:
1. DO NOT explain or describe what you will do - just CREATE the files
2. Create ALL 8 files in ONE response, one after another
3. Keep text responses very short (1-2 sentences max)

FILES TO CREATE (in order):
1. package.json - {"name":"app","version":"1.0.0","type":"module","scripts":{"dev":"vite","build":"vite build"},"dependencies":{"react":"^18.2.0","react-dom":"^18.2.0"},"devDependencies":{"@vitejs/plugin-react":"^4.2.0","vite":"^5.0.0","tailwindcss":"^3.4.0","postcss":"^8.0.0","autoprefixer":"^10.0.0"}}
2. vite.config.js - import { defineConfig } from 'vite'; import react from '@vitejs/plugin-react'; export default defineConfig({ plugins: [react()] });
3. tailwind.config.js - export default { content: ['./index.html', './src/**/*.{js,jsx}'], theme: { extend: {} }, plugins: [] };
4. postcss.config.js - export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
5. index.html - HTML with root div and script type="module" src="/src/main.jsx"
6. src/index.css - @tailwind base; @tailwind components; @tailwind utilities;
7. src/main.jsx - createRoot render App  
8. src/App.jsx - Full multi-section website with: Hero (gradient bg, big title), Features (3-4 cards), Stats, Testimonials, CTA, Footer

DESIGN:
- Dark gradient backgrounds: bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900
- Glass cards: bg-white/5 backdrop-blur rounded-2xl border border-white/10
- Gradient buttons: bg-gradient-to-r from-purple-600 to-pink-600 rounded-full
- Large headings: text-5xl font-bold text-white
- Use emoji for icons

After files, run: npm install && npm run dev`;

export async function action({ request }: Route.ActionArgs) {
  const { messages } = await request.json();

  const result = await streamText({
    model: openai("gpt-4o"),
    messages,
    system: SYSTEM_PROMPT,
    maxTokens: 16000,
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



