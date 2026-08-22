"use client";

/**
 * Navegação da demo — visualmente igual ao Sidebar/BottomNav reais, mas
 * sem sessão/auth/signOut e apontando pras rotas /demo/*. Mantida
 * separada dos componentes reais pra nunca arriscar misturar lógica de
 * autenticação com uma área 100% pública.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { CalendarDays, MessageSquare, Users, BarChart3, Gift, MessageCircle, Menu, X } from "lucide-react";
import { DEMO_BUSINESS } from "@/lib/demo-data";

const NAV = [
  { href: "/demo", label: "Agenda", icon: CalendarDays },
  { href: "/demo/conversations", label: "Conversas", icon: MessageSquare },
  { href: "/demo/clients", label: "Clientes", icon: Users },
  { href: "/demo/reports", label: "Relatórios", icon: BarChart3 },
  { href: "/demo/loyalty", label: "Fidelidade", icon: Gift },
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

export function DemoSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-surface-border bg-surface px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <MessageCircle className="text-zap" size={20} />
          <span className="font-bold">ZapVago</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-foreground/70 hover:bg-surface-hover"
        >
          <Menu size={22} />
        </button>
      </div>

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
              <p className="truncate px-3 text-xs text-foreground/50">{DEMO_BUSINESS.name} (demonstração)</p>
            </div>
          </aside>
        </div>
      )}

      <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col md:border-r md:border-surface-border md:bg-surface">
        <div className="flex items-center gap-2 border-b border-surface-border px-5 py-4">
          <MessageCircle className="text-zap" size={22} />
          <span className="font-bold">ZapVago</span>
        </div>
        <NavList pathname={pathname} />
        <div className="border-t border-surface-border p-3">
          <p className="truncate px-3 text-xs text-foreground/50">{DEMO_BUSINESS.name} (demonstração)</p>
        </div>
      </aside>
    </>
  );
}

export function DemoBottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex h-[60px] items-stretch border-t border-surface-border bg-surface md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {NAV.slice(0, 4).map((item) => {
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
