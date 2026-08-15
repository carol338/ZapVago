"use client";

import { useEffect, useState } from "react";
import { ConversationList, ConversationSummary } from "@/components/conversations/ConversationList";
import { ConversationView } from "@/components/conversations/ConversationView";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { cn } from "@/lib/utils";

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/conversations?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setConversations(data);
        if (!selectedId && data[0]) setSelectedId(data[0].id);
        setLoading(false);
      });
  }, [statusFilter]);

  return (
    <div>
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Conversas" }]} />
      <h1 className="mb-4 text-2xl font-bold">Conversas</h1>
      <div className="mb-3">
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-56">
          <option value="">Todas</option>
          <option value="BOT_HANDLING">Bot atendendo</option>
          <option value="NEEDS_HUMAN">Precisa de atenção</option>
          <option value="HUMAN_HANDLING">Você atendendo</option>
          <option value="RESOLVED">Resolvidas</option>
        </Select>
      </div>
      <div className="flex h-[calc(100dvh-13rem)] overflow-hidden rounded-xl border border-surface-border bg-surface md:h-[70vh]">
        <div
          className={cn(
            "w-full shrink-0 overflow-y-auto border-surface-border md:w-80 md:border-r",
            selectedId ? "hidden md:block" : "block"
          )}
        >
          {loading ? (
            <div className="space-y-3 p-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <ConversationList conversations={conversations} selectedId={selectedId} onSelect={setSelectedId} />
          )}
        </div>
        <div className={cn("min-w-0 flex-1 flex-col", selectedId ? "flex" : "hidden md:flex")}>
          {selectedId ? (
            <ConversationView conversationId={selectedId} onBack={() => setSelectedId(null)} />
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-foreground/40">Selecione uma conversa</div>
          )}
        </div>
      </div>
    </div>
  );
}
