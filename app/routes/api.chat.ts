import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import type { Route } from "./+types/api.chat";

export async function action({ request }: Route.ActionArgs) {
    const { messages } = await request.json();

    const { text } = await generateText({
        model: openai("gpt-4o"),
        messages,
        system: `You are a helpful coding assistant.`,
    });

    // Return as JSON for now to test basic flow
    return Response.json({
        id: crypto.randomUUID(),
        role: "assistant",
        content: text,
    });
}
