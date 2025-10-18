"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Bot, Loader2, RefreshCw, Send, StopCircle, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

export default function ChatInterface() {
  const [input, setInput] = useState("");

  const { messages, sendMessage, error, stop, regenerate, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/stream-text",
    }),
  });

  const lastMessageId = messages.at(-1)?.id;

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (lastMessageId !== undefined) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [lastMessageId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input });
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl p-4">
      <Card className="flex h-[700px] flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Chat Assistant
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full px-6">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                <Bot className="mb-4 h-12 w-12 opacity-50" />
                <p className="font-medium text-lg">Start a conversation</p>
                <p className="text-sm">Ask me anything, I'm here to help!</p>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                {messages.map((message) => (
                  <div
                    className={`flex gap-3 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                    key={message.id}
                  >
                    {message.role === "assistant" && (
                      <div className="flex-shrink-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                          <Bot className="h-5 w-5 text-primary-foreground" />
                        </div>
                      </div>
                    )}

                    <div
                      className={`flex max-w-[80%] flex-col gap-2 ${
                        message.role === "user" ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {message.parts.map((part, index) => {
                          if (part.type === "text") {
                            return (
                              <p
                                className="whitespace-pre-wrap text-sm leading-relaxed"
                                key={`part-${part.type}-${index}`}
                              >
                                {part.text}
                              </p>
                            );
                          }
                          return null;
                        })}
                      </div>

                      {message.role === "assistant" && (
                        <Badge className="text-xs" variant="secondary">
                          AI Response
                        </Badge>
                      )}
                    </div>

                    {message.role === "user" && (
                      <div className="flex-shrink-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                          <User className="h-5 w-5" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {status === "streaming" && (
                  <div className="flex justify-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                        <Bot className="h-5 w-5 text-primary-foreground" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-muted-foreground text-sm">
                        AI is thinking...
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 border-t p-4">
          {/* Error Alert */}
          {error && (
            <Alert className="mb-2" variant="destructive">
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          {messages.length > 0 && (
            <div className="flex w-full gap-2">
              {status === "streaming" && (
                <Button
                  className="gap-2"
                  onClick={stop}
                  size="sm"
                  variant="outline"
                >
                  <StopCircle className="h-4 w-4" />
                  Stop
                </Button>
              )}
              {status === "ready" && messages.length > 0 && (
                <Button
                  className="gap-2"
                  onClick={() => regenerate()}
                  size="sm"
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4" />
                  Regenerate
                </Button>
              )}
            </div>
          )}

          {/* Input Form */}
          <form className="flex w-full gap-2" onSubmit={handleSubmit}>
            <Textarea
              className="max-h-[200px] min-h-[60px] resize-none"
              disabled={status !== "ready"}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
              rows={2}
              value={input}
            />
            <Button
              className="h-[60px] w-[60px]"
              disabled={status !== "ready" || !input.trim()}
              size="icon"
              type="submit"
            >
              {status === "streaming" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </form>

          <p className="w-full text-center text-muted-foreground text-xs">
            Press Enter to send • Shift+Enter for new line
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
