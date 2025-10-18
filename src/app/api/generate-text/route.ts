import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Parse the request body
    const { prompt, system } = await req.json();

    // Validate the prompt
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Invalid prompt. Prompt must be a non-empty string." },
        { status: 400 }
      );
    }

    // Generate text using the AI SDK
    const { text, finishReason, usage } = await generateText({
      model: openai("gpt-4o"), // You can change to 'gpt-4o-mini' or other models
      system: system || "You are a helpful assistant.",
      prompt,
      // Optional parameters:
      // maxTokens: 500,
      // temperature: 0.7,
      // topP: 1,
    });

    // Return the generated text with metadata
    return NextResponse.json({
      text,
      finishReason,
      usage: {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        reasoningTokens: usage.reasoningTokens,
        totalTokens: usage.totalTokens,
      },
    });
  } catch (error) {
    console.error("Error generating text:", error);
    return NextResponse.json(
      { error: "Failed to generate text. Please try again." },
      { status: 500 }
    );
  }
}
