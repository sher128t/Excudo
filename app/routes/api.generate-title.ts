import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import type { Route } from "./+types/api.generate-title";

export async function action({ request }: Route.ActionArgs) {
    if (request.method !== "POST") {
        return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    try {
        const { prompt } = await request.json();

        if (!prompt || typeof prompt !== "string") {
            return Response.json({ error: "Prompt is required" }, { status: 400 });
        }

        // Use AI to generate a concise project title
        const { text } = await generateText({
            model: anthropic("claude-3-5-haiku-latest"),
            system: "You are a title generator. Given a user's project description, generate a short, concise project title (2-5 words max). Return ONLY the title, nothing else. No quotes, no punctuation at the end. Examples: 'Fitness App Website', 'AI Skiing Platform', 'Portfolio Site', 'E-commerce Dashboard'",
            prompt: `Generate a short project title for: "${prompt}"`,
            maxTokens: 30,
        });

        const title = text.trim().replace(/^["']|["']$/g, '').replace(/\.$/, '');

        return Response.json({ title });
    } catch (error) {
        console.error("Error generating title:", error);
        // Return a fallback title based on prompt
        return Response.json({
            title: "New Project",
            fallback: true
        });
    }
}
