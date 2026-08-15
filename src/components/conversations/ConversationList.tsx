"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const SENTIMENT_EMOJI: Record<string, string> = { positive: "😊", neutral: "😐", negative: "😤" };

interface Message {
  role: "client" | "bot" | "owner";
  content: string;
  timestamp: string;
  sentiment?: string;
}

export interface ConversationSummary {
  id: string;
  clientName: string | null;
  clientPhone: string;
  status: string;
  sentiment: string | null;
  summary: string | null;
  updatedAt: string;
  needsAttention: boolean;
  messages?: Message[];
}

/** Timestamp relativo compacto: "agora", "há 5 min", "há 2h", "ontem", ou a data. */
function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ontem";
  if (days < 7) return `há ${days} dias`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function statusBadge(c: ConversationSummary) {
  if (c.status === "HUMAN_HANDLING") return { emoji: "👤", label: "Você" };
  if (c.status === "NEEDS_HUMAN" || c.needsAttention) return { emoji: "⚠️", label: "Atenção" };
  if (c.status === "RESOLVED") return { emoji: "✅", label: "Resolvida" };
  return { emoji: "🤖", label: "Bot atendendo" };
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: {
  conversations: ConversationSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="divide-y divide-surface-border overflow-y-auto">
      {conversations.map((c) => {
        const lastMessage = c.messages?.length ? c.messages[c.messages.length - 1] : null;
        const preview = lastMessage?.content ?? c.summary ?? "Sem mensagens ainda";
        const badge = statusBadge(c);
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={cn(
              "block w-full px-4 py-3 text-left transition-colors hover:bg-surface-hover",
              selectedId === c.id && "bg-surface-hover"
            )}
          >
            <div className="mb-0.5 flex items-center gap-1.5">
              {c.sentiment && <span title={c.sentiment}>{SENTIMENT_EMOJI[c.sentiment]}</span>}
              <span className="font-medium">{c.clientName ?? c.clientPhone}</span>
            </div>
            <p className="mb-1 text-xs text-foreground/50">📱 {c.clientPhone}</p>
            <p className="truncate text-sm text-foreground/60">&quot;{truncate(preview, 60)}&quot;</p>
            <div className="mt-1.5 flex items-center gap-2 text-xs text-foreground/40">
              <span>{relativeTime(c.updatedAt)}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                {badge.emoji} {badge.label}
              </span>
              {c.needsAttention && c.status !== "NEEDS_HUMAN" && <Badge variant="danger">Precisa de atenção</Badge>}
            </div>
          </button>
        );
      })}
      {conversations.length === 0 && <p className="p-6 text-center text-sm text-foreground/40">Nenhuma conversa encontrada.</p>}
    </div>
  );
}
