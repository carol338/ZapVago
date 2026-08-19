"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CalendarDays, MessageSquare, Users, BarChart3 } from "lucide-react";
import type { Feature } from "@/lib/plan-limits";

const ITEMS: { href: string; label: string; icon: typeof CalendarDays; feature?: Feature }[] = [
  { href: "/dashboard", label: "Agenda", icon: CalendarDays },
  { href: "/dashboard/conversations", label: "Conversas", icon: MessageSquare },
  { href: "/dashboard/clients", label: "Clientes", icon: Users },
  { href: "/dashboard/reports", label: "Relatórios", icon: BarChart3, feature: "advancedReports" },
];

/** Menu fixo no rodapé, só em mobile — atalho para as 4 seções mais usadas. */
export function BottomNav({ features }: { features: Record<Feature, boolean> }) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex h-[60px] items-stretch border-t border-surface-border bg-surface md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {ITEMS.filter((item) => !item.feature || features[item.feature]).map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors",
              active ? "text-zap-light" : "text-foreground/50"
            )}
          >
            <item.icon size={22} />
            <span className="text-[11px] font-medium leading-none">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
