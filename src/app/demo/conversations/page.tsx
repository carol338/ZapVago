"use client";

/**
 * Conversa de WhatsApp da demo — mesmo visual do painel de verdade
 * (lista + chat), mas 100% em memória: "Assumir" e "Enviar" só mexem no
 * estado local do componente, nunca chamam a API real. Recarregar a
 * página volta tudo ao estado inicial.
 */
import { useState } from "react";
import { Send, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DEMO_CONVERSATIONS } from "@/lib/demo-data";

const SENTIMENT_EMOJI: Record<string, string> = { positive: "😊", neutral: "😐", negative: "😤" };
const SENTIMENT_LABEL: Record<string, string> = { positive: "Positivo", neutral: "Neutro", negative: "Negativo" };

function statusBadge(status: string) {
  if (status === "HUMAN_HANDLING") return { emoji: "👤", label: "Você" };
  if (status === "NEEDS_HUMAN") return { emoji: "⚠️", label: "Atenção" };
  if (status === "RESOLVED") return { emoji: "✅", label: "Resolvida" };
  return { emoji: "🤖", label: "Bot atendendo" };
}

type LocalMessage = { role: "client" | "bot" | "owner"; content: string; sentiment?: string };

export default function DemoConversationsPage() {
  const [selectedId, setSelectedId] = useState(DEMO_CONVERSATIONS[0].id);
  const [statusById, setStatusById] = useState<Record<string, string>>(
    Object.fromEntries(DEMO_CONVERSATIONS.map((c) => [c.id, c.status]))
  );
  const [extraMessages, setExtraMessages] = useState<Record<string, LocalMessage[]>>({});
  const [reply, setReply] = useState("");
  const [showChatMobile, setShowChatMobile] = useState(false);

  const selected = DEMO_CONVERSATIONS.find((c) => c.id === selectedId)!;
  const status = statusById[selectedId];
  const messages: LocalMessage[] = [...selected.messages, ...(extraMessages[selectedId] ?? [])];
  const isHuman = status === "HUMAN_HANDLING";
  const isResolved = status === "RESOLVED";

  function assume() {
    setStatusById((prev) => ({ ...prev, [selectedId]: "HUMAN_HANDLING" }));
  }
  function resolve() {
    setStatusById((prev) => ({ ...prev, [selectedId]: "RESOLVED" }));
  }
  function sendReply() {
    if (!reply.trim()) return;
    setExtraMessages((prev) => ({ ...prev, [selectedId]: [...(prev[selectedId] ?? []), { role: "owner", content: reply }] }));
    setReply("");
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Conversas</h1>
      <div className="flex h-[calc(100dvh-13rem)] overflow-hidden rounded-xl border border-surface-border bg-surface md:h-[70vh]">
        <div className={cn("w-full shrink-0 divide-y divide-surface-border overflow-y-auto border-surface-border md:w-80 md:border-r", showChatMobile ? "hidden md:block" : "block")}>
          {DEMO_CONVERSATIONS.map((c) => {
            const badge = statusBadge(statusById[c.id]);
            const lastMessage = [...c.messages, ...(extraMessages[c.id] ?? [])].slice(-1)[0];
            return (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedId(c.id);
                  setShowChatMobile(true);
                }}
                className={cn(
                  "block w-full px-4 py-3 text-left transition-colors hover:bg-surface-hover",
                  selectedId === c.id && "bg-surface-hover"
                )}
              >
                <div className="mb-0.5 flex items-center gap-1.5">
                  {c.sentiment && <span>{SENTIMENT_EMOJI[c.sentiment]}</span>}
                  <span className="font-medium">{c.clientName}</span>
                </div>
                <p className="mb-1 text-xs text-foreground/50">📱 {c.clientPhone}</p>
                <p className="truncate text-sm text-foreground/60">&quot;{lastMessage?.content}&quot;</p>
                <div className="mt-1.5 flex items-center gap-2 text-xs text-foreground/40">
                  <span>há {c.minutesAgo} min</span>
                  <span>·</span>
                  <span>{badge.emoji} {badge.label}</span>
                  {c.needsAttention && statusById[c.id] !== "NEEDS_HUMAN" && <Badge variant="danger">Precisa de atenção</Badge>}
                </div>
              </button>
            );
          })}
        </div>

        <div className={cn("min-w-0 flex-1 flex-col", showChatMobile ? "flex" : "hidden md:flex")}>
          <div className="border-b border-surface-border p-3 sm:p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <button
                  onClick={() => setShowChatMobile(false)}
                  aria-label="Voltar para a lista"
                  className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-foreground/60 transition-colors hover:bg-surface-hover md:hidden"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{selected.clientName}</p>
                  <p className="truncate text-xs text-foreground/40">📱 {selected.clientPhone}</p>
                  {selected.sentiment && (
                    <p className="text-xs text-foreground/50">
                      Sentimento: {SENTIMENT_EMOJI[selected.sentiment]} {SENTIMENT_LABEL[selected.sentiment]}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {!isResolved && (
                  <Button size="sm" variant="secondary" onClick={resolve}>
                    <Check size={14} className="mr-1" /> Resolvida
                  </Button>
                )}
                {!isHuman && !isResolved && <Button size="sm" onClick={assume}>Assumir</Button>}
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
                </div>
              );
            })}
          </div>

          {isHuman ? (
            <div className="flex gap-2 border-t border-surface-border p-3">
              <Input
                placeholder="Escreva uma resposta..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendReply()}
              />
              <Button onClick={sendReply}>
                <Send size={14} />
              </Button>
            </div>
          ) : (
            <div className="border-t border-surface-border p-3 text-center text-xs text-foreground/40">
              {isResolved ? "Conversa resolvida." : "O bot está respondendo automaticamente. Clique em Assumir pra responder você mesmo."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
