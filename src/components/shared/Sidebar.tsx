"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
  Menu,
  X,
  ListTodo,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "/dashboard", label: "Agenda", icon: CalendarDays },
  { href: "/dashboard/conversations", label: "Conversas", icon: MessageSquare },
  { href: "/dashboard/clients", label: "Clientes", icon: Users },
  { href: "/dashboard/waiting-list", label: "Lista de Espera", icon: ListTodo },
  { href: "/dashboard/reports", label: "Relatórios", icon: BarChart3 },
  { href: "/dashboard/flash-sales", label: "Feirões", icon: Zap },
  { href: "/dashboard/loyalty", label: "Fidelidade", icon: Gift },
  { href: "/dashboard/settings", label: "Configurações", icon: Settings },
];

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-2 p-3">
      {NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-zap/15 text-zap-light" : "text-foreground/70 hover:bg-surface-hover hover:text-foreground"
            )}
          >
            <item.icon size={18} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({ businessName }: { businessName?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Barra superior — só em mobile */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-surface-border bg-surface px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <MessageCircle className="text-zap" size={20} />
          <span className="font-bold">ZapVago</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle className="flex h-11 w-11 items-center justify-center rounded-lg text-foreground/70 hover:bg-surface-hover" />
          <button
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-foreground/70 hover:bg-surface-hover"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* Drawer — só em mobile */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[80vw] flex-col border-r border-surface-border bg-surface">
            <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="text-zap" size={22} />
                <span className="font-bold">ZapVago</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="-mr-2 flex h-11 w-11 items-center justify-center rounded-lg text-foreground/70 transition-colors hover:bg-surface-hover"
              >
                <X size={20} />
              </button>
            </div>

            <NavList pathname={pathname} onNavigate={() => setOpen(false)} />

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
        </div>
      )}

      {/* Sidebar fixa — só em desktop */}
      <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col md:border-r md:border-surface-border md:bg-surface">
        <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="text-zap" size={22} />
            <span className="font-bold">ZapVago</span>
          </div>
          <ThemeToggle className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground/60 hover:bg-surface-hover hover:text-foreground" />
        </div>

        <NavList pathname={pathname} />

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
    </>
  );
}
