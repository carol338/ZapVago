"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const SENTIMENT_EMOJI: Record<string, string> = { positive: "😊", neutral: "😐", negative: "😤" };

export interface ConversationSummary {
  id: string;
  clientName: string | null;
  clientPhone: string;
  status: string;
  sentiment: string | null;
  summary: string | null;
  updatedAt: string;
  needsAttention: boolean;
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
      {conversations.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className={cn(
            "block w-full px-4 py-3 text-left transition-colors hover:bg-surface-hover",
            selectedId === c.id && "bg-surface-hover"
          )}
        >
          <div className="mb-1 flex items-center justify-between">
            <span className="font-medium">{c.clientName ?? c.clientPhone}</span>
            <span className="text-xs text-foreground/40">
              {formatDistanceToNow(new Date(c.updatedAt), { locale: ptBR, addSuffix: true })}
            </span>
          </div>
          <p className="truncate text-sm text-foreground/60">{c.summary ?? "Sem resumo ainda"}</p>
          <div className="mt-1 flex items-center gap-2">
            {c.sentiment && <span title={c.sentiment}>{SENTIMENT_EMOJI[c.sentiment]}</span>}
            {c.needsAttention && <Badge variant="danger">Precisa de atenção</Badge>}
            {c.status === "HUMAN_HANDLING" && <Badge variant="info">Você está atendendo</Badge>}
          </div>
        </button>
      ))}
      {conversations.length === 0 && <p className="p-6 text-center text-sm text-foreground/40">Nenhuma conversa encontrada.</p>}
    </div>
  );
}
