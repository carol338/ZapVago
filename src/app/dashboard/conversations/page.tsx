"use client";

import { useEffect, useState } from "react";
import { ConversationList, ConversationSummary } from "@/components/conversations/ConversationList";
import { ConversationView } from "@/components/conversations/ConversationView";
import { Select } from "@/components/ui/select";

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/conversations?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setConversations(data);
        if (!selectedId && data[0]) setSelectedId(data[0].id);
      });
  }, [statusFilter]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Conversas</h1>
      <div className="mb-3">
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-56">
          <option value="">Todas</option>
          <option value="BOT_HANDLING">Bot atendendo</option>
          <option value="NEEDS_HUMAN">Precisa de atenção</option>
          <option value="HUMAN_HANDLING">Você atendendo</option>
          <option value="RESOLVED">Resolvidas</option>
        </Select>
      </div>
      <div className="flex h-[70vh] overflow-hidden rounded-xl border border-surface-border bg-surface">
        <div className="w-80 shrink-0 overflow-y-auto border-r border-surface-border">
          <ConversationList conversations={conversations} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
        {selectedId ? (
          <ConversationView conversationId={selectedId} />
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-foreground/40">Selecione uma conversa</div>
        )}
      </div>
    </div>
  );
}
