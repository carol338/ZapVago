import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-surface-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-2">
          <MessageCircle className="text-zap" size={22} />
          <span className="text-lg font-bold">ZapVago</span>
        </div>
        <nav className="hidden items-center gap-6 text-sm text-foreground/60 sm:flex">
          <Link href="#diferenciais" className="hover:text-foreground">Diferenciais</Link>
          <Link href="#planos" className="hover:text-foreground">Planos</Link>
          <Link href="#demonstracao" className="hover:text-foreground">Demonstração</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login"><Button variant="ghost" size="sm">Entrar</Button></Link>
          <Link href="/register"><Button size="sm">Começar grátis</Button></Link>
        </div>
      </div>
    </header>
  );
}
