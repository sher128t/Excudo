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

    // Use pipeDataStreamToResponse which is the correct method
    return result.pipeDataStreamToResponse(new Response());
}
