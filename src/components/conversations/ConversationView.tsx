"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Message {
  role: "client" | "bot" | "owner";
  content: string;
  timestamp: string;
  sentiment?: string;
}

const SENTIMENT_COLOR: Record<string, string> = {
  positive: "border-l-risk-low",
  neutral: "border-l-surface-border",
  negative: "border-l-risk-high",
};

export function ConversationView({ conversationId }: { conversationId: string }) {
  const [conversation, setConversation] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await fetch(`/api/conversations/${conversationId}`);
    if (res.ok) setConversation(await res.json());
  }

  useEffect(() => {
    load();
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  async function assume() {
    await fetch(`/api/conversations/${conversationId}/assume`, { method: "POST" });
    load();
  }

  async function release() {
    await fetch(`/api/conversations/${conversationId}/release`, { method: "POST" });
    load();
  }

  async function sendReply() {
    if (!reply.trim()) return;
    setSending(true);
    await fetch(`/api/conversations/${conversationId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: reply }),
    });
    setReply("");
    setSending(false);
    load();
  }

  if (!conversation) return <div className="flex-1 p-6 text-sm text-foreground/40">Carregando conversa...</div>;

  const messages: Message[] = conversation.messages ?? [];

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-surface-border p-4">
        <div>
          <p className="font-semibold">{conversation.clientName ?? conversation.clientPhone}</p>
          <p className="text-xs text-foreground/40">{conversation.clientPhone}</p>
        </div>
        <div className="flex items-center gap-2">
          {conversation.status === "HUMAN_HANDLING" ? (
            <Button size="sm" variant="secondary" onClick={release}>Devolver para o bot</Button>
          ) : (
            <Button size="sm" onClick={assume}>Assumir conversa</Button>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[75%] rounded-lg border-l-4 bg-surface-hover px-3 py-2 text-sm",
              m.role === "client" ? "mr-auto" : "ml-auto bg-zap/10",
              m.sentiment ? SENTIMENT_COLOR[m.sentiment] : "border-l-transparent"
            )}
          >
            <p className="mb-1 text-[10px] uppercase text-foreground/40">
              {m.role === "client" ? "Cliente" : m.role === "bot" ? "ZapVago (bot)" : "Você"}
            </p>
            <p>{m.content}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 border-t border-surface-border p-3">
        <Input
          placeholder="Escreva uma resposta..."
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendReply()}
        />
        <Button onClick={sendReply} disabled={sending}>Enviar</Button>
      </div>
    </div>
  );
}
