"use client";

import {
  FormEvent,
  useState,
} from "react";

import ReactMarkdown from "react-markdown";

type AskSortdProps = {
  context: unknown;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function AskSortd({
  context,
}: AskSortdProps) {
  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const message = input.trim();

    if (!message || isThinking) {
      return;
    }

    setMessages((current) => [
      ...current,
      {
        role: "user",
        content: message,
      },
    ]);

    setInput("");
    setIsThinking(true);

    try {
      const response = await fetch(
        "/api/ai/chat",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            message,
            context,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Unable to ask Sort'd.",
        );
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: data.message,
        },
      ]);
    } catch (error) {
      console.error(error);

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "I couldn't think about that right now. Try again in a moment.",
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">✦</span>

          <div>
            <h2 className="font-semibold text-slate-950">
              Ask Sort&apos;d
            </h2>

            <p className="text-xs text-slate-500">
              Talk through your day
            </p>
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="max-h-80 space-y-3 overflow-y-auto p-4">
          {messages.map(
            (message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={
                  message.role === "user"
                    ? "ml-8 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white"
                    : "mr-8 rounded-2xl bg-slate-100 px-4 py-3 text-sm leading-6 text-slate-700"
                }
              >
                {message.role === "assistant" ? (
                    <ReactMarkdown
                        components={{
                        h1: ({ children }) => (
                            <h3 className="mb-2 font-semibold text-slate-950">
                            {children}
                            </h3>
                        ),

                        h2: ({ children }) => (
                            <h3 className="mb-2 font-semibold text-slate-950">
                            {children}
                            </h3>
                        ),

                        h3: ({ children }) => (
                            <h3 className="mb-2 font-semibold text-slate-950">
                            {children}
                            </h3>
                        ),

                        p: ({ children }) => (
                            <p className="mb-2 last:mb-0">
                            {children}
                            </p>
                        ),

                        ul: ({ children }) => (
                            <ul className="mb-2 list-disc space-y-1 pl-5">
                            {children}
                            </ul>
                        ),

                        ol: ({ children }) => (
                            <ol className="mb-2 list-decimal space-y-1 pl-5">
                            {children}
                            </ol>
                        ),

                        strong: ({ children }) => (
                            <strong className="font-semibold text-slate-950">
                            {children}
                            </strong>
                        ),
                        }}
                    >
                        {message.content}
                    </ReactMarkdown>
                    ) : (
                    message.content
                    )}
              </div>
            ),
          )}

          {isThinking && (
            <div className="mr-8 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-500">
              Thinking…
            </div>
          )}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex gap-2 p-3"
      >
        <input
          value={input}
          onChange={(event) =>
            setInput(event.target.value)
          }
          placeholder="What should I do tonight?"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
        />

        <button
          type="submit"
          disabled={
            isThinking || !input.trim()
          }
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Ask
        </button>
      </form>
    </section>
  );
}