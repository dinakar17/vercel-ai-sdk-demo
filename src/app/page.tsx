"use client";

import { CheckCircle, Copy, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const COPY_FEEDBACK_TIMEOUT_MS = 2000;

export default function TextGenerator() {
  const [prompt, setPrompt] = useState("");
  const [systemMessage, setSystemMessage] = useState(
    "You are a helpful assistant."
  );
  const [generatedText, setGeneratedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [usage, setUsage] = useState<{
    inputTokens: number;
    outputTokens: number;
    reasoningTokens: number;
    totalTokens: number;
  } | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setIsLoading(true);
    setError("");
    setGeneratedText("");
    setUsage(null);

    try {
      const response = await fetch("/api/generate-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          system: systemMessage.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate text");
      }

      setGeneratedText(data.text);
      setUsage(data.usage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (generatedText) {
      await navigator.clipboard.writeText(generatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_FEEDBACK_TIMEOUT_MS);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Text Generator
          </CardTitle>
          <CardDescription>
            Generate text using AI. Press Ctrl+Enter or Cmd+Enter to generate
            quickly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* System Message Input */}
          <div className="space-y-2">
            <Label htmlFor="system-message">System Message (Optional)</Label>
            <Textarea
              disabled={isLoading}
              id="system-message"
              onChange={(e) => setSystemMessage(e.target.value)}
              placeholder="You are a helpful assistant..."
              rows={2}
              value={systemMessage}
            />
          </div>

          {/* Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="prompt">
              Prompt <span className="text-destructive">*</span>
            </Label>
            <Textarea
              className="resize-y"
              disabled={isLoading}
              id="prompt"
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your prompt here... (e.g., Write a short story about a robot learning to paint)"
              rows={6}
              value={prompt}
            />
            <p className="text-muted-foreground text-sm">
              {prompt.length} characters
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            disabled={isLoading || !prompt.trim()}
            onClick={handleGenerate}
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Text
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Generated Output Card */}
      {generatedText && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated Text</CardTitle>
              <Button
                className="gap-2"
                onClick={handleCopy}
                size="sm"
                variant="outline"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            {usage && (
              <div className="mt-2 flex gap-2">
                <Badge variant="secondary">
                  Input: {usage.inputTokens} tokens
                </Badge>
                <Badge variant="secondary">
                  Output: {usage.outputTokens} tokens
                </Badge>
                {usage.reasoningTokens > 0 && (
                  <Badge variant="secondary">
                    Reasoning: {usage.reasoningTokens} tokens
                  </Badge>
                )}
                <Badge variant="outline">
                  Total: {usage.totalTokens} tokens
                </Badge>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {generatedText}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
