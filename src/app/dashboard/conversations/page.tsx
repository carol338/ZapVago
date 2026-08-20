"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { ConversationList, ConversationSummary } from "@/components/conversations/ConversationList";
import { ConversationView } from "@/components/conversations/ConversationView";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "bot", emoji: "🤖", label: "Atendidas pelo Bot" },
  { key: "attention", emoji: "⚠️", label: "Precisam de Atenção" },
  { key: "you", emoji: "👤", label: "Assumidas por Você" },
] as const;

function ConversationsPageInner() {
  const searchParams = useSearchParams();
  const openId = searchParams.get("open");

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("bot");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (openId) setSelectedId(openId);
  }, [openId]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ tab });
    if (search.trim()) params.set("search", search.trim());
    const t = setTimeout(() => {
      fetch(`/api/conversations?${params}`)
        .then((r) => r.json())
        .then((data) => {
          setConversations(data);
          if (!openId) setSelectedId(data[0]?.id ?? null);
          setLoading(false);
        });
    }, 250);
    return () => clearTimeout(t);
  }, [tab, search]);

  return (
    <div>
      {/* Escondido no mobile quando uma conversa está aberta — o chat ocupa a tela inteira, como um app de mensagens. */}
      <div className={cn(selectedId && "hidden md:block")}>
        <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Conversas" }]} />
        <h1 className="mb-4 text-2xl font-bold">Conversas</h1>

        <div className="mb-3 flex gap-1 overflow-x-auto rounded-lg border border-surface-border bg-surface p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "min-h-[44px] flex-1 shrink-0 whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors",
                tab === t.key ? "bg-zap/15 text-zap-light" : "text-foreground/60 hover:bg-surface-hover"
              )}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
          <Input
            className="pl-9"
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div
        className={cn(
          "flex overflow-hidden rounded-xl border border-surface-border bg-surface md:h-[65vh]",
          selectedId ? "h-[calc(100dvh-8rem)]" : "h-[calc(100dvh-17rem)]"
        )}
      >
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
            <ConversationView
              conversationId={selectedId}
              onBack={() => setSelectedId(null)}
              onResolved={() => setConversations((c) => c.filter((x) => x.id !== selectedId))}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-foreground/40">Selecione uma conversa</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ConversationsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <ConversationsPageInner />
    </Suspense>
  );
}
