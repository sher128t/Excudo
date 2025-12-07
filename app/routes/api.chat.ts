import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import type { Route } from "./+types/api.chat";

export async function action({ request }: Route.ActionArgs) {
    const { messages } = await request.json();

    const result = await streamText({
        model: openai("gpt-4o"),
        messages,
        system: `You are a helpful coding assistant.`,
    });

    // In AI SDK v3, use toAIStreamResponse
    return result.toAIStreamResponse();
}
