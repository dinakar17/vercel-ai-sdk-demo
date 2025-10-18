import { openai } from "@ai-sdk/openai";
import type { UIMessage } from "ai";
import { convertToModelMessages, streamText } from "ai";
import type { NextRequest } from "next/server";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    const { messages, system } = body as {
      messages: UIMessage[];
      system?: string;
    };

    // Validate input
    if (!(messages && Array.isArray(messages)) || messages.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Messages array is required and must not be empty.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Convert UI messages to model messages format
    const modelMessages = convertToModelMessages(messages);

    // Stream text using the AI SDK
    const result = streamText({
      model: openai("gpt-4o"),
      system: system || "You are a helpful assistant.",
      messages: modelMessages,

      // Callback when each chunk is received
      onChunk: () => {
        // Optional: Log or process chunks in real-time
        // console.log("Received chunk:", chunk);
      },

      // Callback when streaming finishes
      onFinish: ({ finishReason, usage, response }) => {
        console.log("Stream completed:", {
          finishReason,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          totalTokens: usage.totalTokens,
          messageCount: response.messages.length,
        });

        // Here you can:
        // - Save the conversation to a database
        // - Log analytics or metrics
        // - Update user token usage
        // - Trigger webhooks or notifications
      },

      // Error handling callback
      onError: (error) => {
        console.error("Streaming error:", error);
      },
    });

    // Return as UI Message Stream Response
    // This format works seamlessly with AI SDK UI hooks like useChat
    return result.toUIMessageStreamResponse({
      // Include original messages for proper chat context
      originalMessages: messages,

      // Send token usage information in the stream
      sendFinish: true,

      // Custom error message formatting
      onError: (error) => {
        if (error instanceof Error) {
          return error.message;
        }
        return "An unexpected error occurred during text generation.";
      },
    });
  } catch (error) {
    console.error("Error in chat endpoint:", error);

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Failed to process chat request. Please try again.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
