import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import type { Route } from "./+types/api.chat";

export async function action({ request }: Route.ActionArgs) {
    const { messages } = await request.json();

    const result = streamText({
        model: openai("gpt-4o"),
        messages,
        system: `You are a helpful coding assistant.`,
    });

    // Return using the textStream property with proper headers
    return new Response(result.textStream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
