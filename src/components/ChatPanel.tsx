"use client";

import { useState, useRef, useEffect } from "react";
import { Send, MessageSquare, Loader2, Bot, User } from "lucide-react";
import { ChatMessage } from "@/types";

const STARTER_QUESTIONS = [
  "What are the biggest liquidity risks today?",
  "Any news about our banking counterparties?",
  "Summarize FX risks this week",
  "Any early warning signals I should flag to the CFO?",
];

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  async function sendMessage(text?: string) {
    const userText = text ?? input.trim();
    if (!userText || isLoading) return;

    const userMsg: ChatMessage = { role: "user", content: userText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${data.error ?? "Unknown error"}` },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="border border-gray-100 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900/40 shadow-sm dark:shadow-none flex flex-col lg:h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-slate-800">
        <MessageSquare className="w-4 h-4 text-gehc-500 dark:text-gold-400" />
        <span className="text-xs font-semibold text-gray-900 dark:text-white">Ask the Desk</span>
        <span className="ml-auto text-[10px] text-gray-400 dark:text-slate-600">AI · Grounded in today&apos;s news</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-xs text-gray-400 dark:text-slate-600 text-center pt-2">
              Ask questions about today&apos;s markets, risks, or your cash positions.
            </p>
            <div className="space-y-2">
              {STARTER_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="w-full text-left text-xs text-gray-500 dark:text-slate-400 border border-gray-100 dark:border-slate-800 rounded-lg px-3 py-2 hover:border-gehc-500/30 dark:hover:border-gold-600/40 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-gehc-50 dark:hover:bg-slate-800/50 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-5 h-5 rounded bg-gehc-500/10 dark:bg-gold-500/20 border border-gehc-500/20 dark:border-gold-600/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3 h-3 text-gehc-500 dark:text-gold-400" />
                </div>
              )}
              <div
                className={`max-w-[85%] text-xs leading-relaxed rounded-lg px-3 py-2 ${
                  msg.role === "user"
                    ? "bg-gehc-500/10 dark:bg-gold-500/15 border border-gehc-500/20 dark:border-gold-600/30 text-gray-800 dark:text-slate-200"
                    : "bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700 text-gray-700 dark:text-slate-300"
                }`}
                style={{ whiteSpace: "pre-wrap" }}
              >
                {msg.content}
              </div>
              {msg.role === "user" && (
                <div className="w-5 h-5 rounded bg-gray-100 dark:bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3 h-3 text-gray-500 dark:text-slate-400" />
                </div>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex gap-2">
            <div className="w-5 h-5 rounded bg-gehc-500/10 dark:bg-gold-500/20 border border-gehc-500/20 dark:border-gold-600/30 flex items-center justify-center shrink-0">
              <Bot className="w-3 h-3 text-gehc-500 dark:text-gold-400" />
            </div>
            <div className="bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700 rounded-lg px-3 py-2">
              <Loader2 className="w-3 h-3 animate-spin text-gehc-500 dark:text-gold-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Ask about risks, markets, cash positions..."
            className="flex-1 text-xs bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-gray-900 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-600 focus:outline-none focus:border-gehc-500/50 dark:focus:border-gold-600/50 focus:bg-white dark:focus:bg-slate-800 transition-colors"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-lg bg-gehc-500/10 dark:bg-gold-500/20 border border-gehc-500/30 dark:border-gold-600/40 text-gehc-500 dark:text-gold-400 hover:bg-gehc-500/20 dark:hover:bg-gold-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
