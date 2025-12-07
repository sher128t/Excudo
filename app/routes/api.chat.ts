import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { z } from "zod";
import type { Route } from "./+types/api.chat";

export async function action({ request }: Route.ActionArgs) {
    const { messages } = await request.json();

    const result = streamText({
        model: openai("gpt-4o"),
        messages,
        system: `You are a helpful coding assistant.`,
    });

    // Create a streaming response manually using fullStream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            try {
                for await (const chunk of result.fullStream) {
                    // Convert chunk to data stream format expected by useChat
                    const data = JSON.stringify(chunk) + '\n';
                    controller.enqueue(encoder.encode(`0:${data}`));
                }
                controller.close();
            } catch (error) {
                controller.error(error);
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Vercel-AI-Data-Stream': 'v1',
        },
    });
}
