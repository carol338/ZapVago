"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  MessageSquare,
  Users,
  BarChart3,
  Zap,
  Gift,
  Settings,
  MessageCircle,
  LogOut,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Agenda", icon: CalendarDays },
  { href: "/dashboard/conversations", label: "Conversas", icon: MessageSquare },
  { href: "/dashboard/clients", label: "Clientes", icon: Users },
  { href: "/dashboard/reports", label: "Relatórios", icon: BarChart3 },
  { href: "/dashboard/flash-sales", label: "Feirões", icon: Zap },
  { href: "/dashboard/loyalty", label: "Fidelidade", icon: Gift },
  { href: "/dashboard/settings", label: "Configurações", icon: Settings },
];

export function Sidebar({ businessName }: { businessName?: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 flex-col border-r border-surface-border bg-surface">
      <div className="flex items-center gap-2 border-b border-surface-border px-5 py-4">
        <MessageCircle className="text-zap" size={22} />
        <span className="font-bold">ZapVago</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-zap/15 text-zap-light" : "text-foreground/70 hover:bg-surface-hover hover:text-foreground"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-surface-border p-3">
        {businessName && <p className="mb-2 truncate px-3 text-xs text-foreground/50">{businessName}</p>}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground/70 hover:bg-surface-hover hover:text-foreground"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  );
}
