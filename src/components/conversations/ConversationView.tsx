"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Message {
  role: "client" | "bot" | "owner";
  content: string;
  timestamp: string;
  sentiment?: string;
}

const SENTIMENT_EMOJI: Record<string, string> = { positive: "😊", neutral: "😐", negative: "😤" };
const SENTIMENT_LABEL: Record<string, string> = { positive: "Positivo", neutral: "Neutro", negative: "Negativo" };

function summarizeSentiment(messages: Message[]) {
  const clientMsgs = messages.filter((m) => m.role === "client" && m.sentiment);
  if (clientMsgs.length === 0) return null;
  const counts: Record<string, number> = {};
  for (const m of clientMsgs) counts[m.sentiment!] = (counts[m.sentiment!] ?? 0) + 1;
  const [top, topCount] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return { sentiment: top, pct: Math.round((topCount / clientMsgs.length) * 100) };
}

export function ConversationView({
  conversationId,
  onBack,
  onResolved,
}: {
  conversationId: string;
  onBack?: () => void;
  onResolved?: () => void;
}) {
  const [conversation, setConversation] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);
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

  async function resolve() {
    setResolving(true);
    await fetch(`/api/conversations/${conversationId}/resolve`, { method: "POST" });
    setResolving(false);
    onResolved?.();
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
  const sentimentSummary = summarizeSentiment(messages);
  const isHuman = conversation.status === "HUMAN_HANDLING";
  const isResolved = conversation.status === "RESOLVED";

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-surface-border p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {onBack && (
              <button
                onClick={onBack}
                aria-label="Voltar para a lista"
                className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-foreground/60 transition-colors hover:bg-surface-hover md:hidden"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div className="min-w-0">
              <p className="truncate font-semibold">{conversation.clientName ?? conversation.clientPhone}</p>
              <p className="truncate text-xs text-foreground/40">📱 {conversation.clientPhone}</p>
              {sentimentSummary && (
                <p className="text-xs text-foreground/50">
                  Sentimento: {SENTIMENT_EMOJI[sentimentSummary.sentiment]} {SENTIMENT_LABEL[sentimentSummary.sentiment]} (
                  {sentimentSummary.pct}%)
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {!isResolved && (
              <Button size="sm" variant="secondary" onClick={resolve} disabled={resolving}>
                <Check size={14} className="mr-1" /> Resolvida
              </Button>
            )}
            {isHuman ? (
              <Button size="sm" variant="secondary" onClick={release}>Devolver</Button>
            ) : (
              !isResolved && <Button size="sm" onClick={assume}>Assumir</Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m, i) => {
          const isClient = m.role === "client";
          const isOwner = m.role === "owner";
          return (
            <div key={i} className={cn("flex flex-col", isClient ? "items-end" : "items-start")}>
              <div
                className={cn(
                  "max-w-[75%] rounded-lg px-3 py-2 text-sm text-white",
                  isClient && "bg-zap",
                  !isClient && !isOwner && "bg-[#1F2024]",
                  isOwner && "bg-blue-500"
                )}
              >
                {isOwner && <p className="mb-0.5 text-[10px] uppercase text-white/70">Você</p>}
                {!isClient && !isOwner && <p className="mb-0.5 text-[10px] uppercase text-white/50">ZapVago (bot)</p>}
                <span className="flex items-start gap-1.5">
                  <span>{m.content}</span>
                  {isClient && m.sentiment && <span className="shrink-0">{SENTIMENT_EMOJI[m.sentiment]}</span>}
                </span>
              </div>
              <span className="mt-0.5 text-[10px] text-foreground/30">{format(new Date(m.timestamp), "HH:mm")}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {isHuman ? (
        <div className="flex gap-2 border-t border-surface-border p-3">
          <Input
            placeholder="Escreva uma resposta..."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendReply()}
          />
          <Button onClick={sendReply} disabled={sending}>Enviar</Button>
        </div>
      ) : (
        <div className="border-t border-surface-border p-3 text-center text-xs text-foreground/40">
          {isResolved ? "Conversa resolvida." : "O bot está respondendo automaticamente. Clique em Assumir pra responder você mesmo."}
        </div>
      )}
    </div>
  );
}
